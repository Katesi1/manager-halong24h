#!/usr/bin/env bash
# =============================================================================
# Deploy script — chạy TỪ MÁY LOCAL để build + rsync lên server + reload PM2.
#
# Usage:
#   ./deploy/deploy.sh
#
# Yêu cầu local:
#   - Node.js 20+
#   - npm 10+
#   - rsync
#   - SSH key đã add vào server (~/.ssh/authorized_keys)
# =============================================================================

set -euo pipefail

# ---- CONFIG (sửa theo server thật của bạn) ----
SERVER_USER="${SERVER_USER:-root}"
SERVER_HOST="${SERVER_HOST:-manage.halong24h.com}"
SERVER_PATH="${SERVER_PATH:-/var/www/halong24h-manage}"
PM2_APP_NAME="${PM2_APP_NAME:-halong24h-manage}"
# -----------------------------------------------

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $*"; }
err() { echo -e "${RED}[deploy]${NC} $*" >&2; }

log "1/6 Typecheck"
npm run typecheck

log "2/6 Build production"
NODE_ENV=production npm run build

log "3/6 Đảm bảo .env.production có trên local"
if [[ ! -f .env.production ]]; then
  err "Thiếu .env.production — copy từ .env.production.example"
  exit 1
fi

log "4/6 Rsync lên server ${SERVER_HOST}:${SERVER_PATH}"
# Loại bỏ node_modules + .next/cache để giảm transfer; build lại trên server sẽ
# nhanh vì có cache npm. Hoặc rsync cả .next nếu build local đã đủ.
rsync -avz --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.env.local' \
  --exclude '.env.local.*' \
  --exclude '.next/cache' \
  --exclude '*.log' \
  --exclude '.vscode' \
  ./ "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"

log "5/6 Install deps + reload PM2 trên server"
ssh "${SERVER_USER}@${SERVER_HOST}" bash <<EOF
  set -euo pipefail
  cd "${SERVER_PATH}"
  echo "[server] Install deps (production)"
  npm ci --omit=dev --prefer-offline
  echo "[server] Reload PM2 (zero downtime)"
  pm2 reload ${PM2_APP_NAME} --update-env || pm2 start ecosystem.config.cjs --env production
  pm2 save
  echo "[server] Status:"
  pm2 status ${PM2_APP_NAME}
EOF

log "6/6 Done — kiểm tra https://${SERVER_HOST}"
