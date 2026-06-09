#!/usr/bin/env bash
# =============================================================================
# Chạy MỘT LẦN trên server lần đầu setup. SSH vào server rồi:
#   curl -fsSL <URL của file này> | bash
# Hoặc copy thủ công + chạy: bash server-setup.sh
#
# Yêu cầu: Ubuntu 22.04 LTS hoặc Debian 12 (cmd có thể đổi cho distro khác).
# =============================================================================

set -euo pipefail

DOMAIN="manage.halong24h.com"
APP_DIR="/var/www/halong24h-manage"
APP_PORT=3001

echo "[setup] 1/8 Update apt"
apt update

echo "[setup] 2/8 Install Node.js 20 LTS (NodeSource)"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
node -v
npm -v

echo "[setup] 3/8 Install PM2 globally"
npm install -g pm2

echo "[setup] 4/8 Install nginx + certbot"
apt install -y nginx certbot python3-certbot-nginx rsync

echo "[setup] 5/8 Tạo thư mục app + log"
mkdir -p "${APP_DIR}"
mkdir -p /var/log/pm2
mkdir -p /var/www/certbot
chown -R "$(whoami):$(whoami)" "${APP_DIR}"

echo "[setup] 6/8 PM2 systemd (auto-start sau reboot)"
pm2 startup systemd -u "$(whoami)" --hp "$HOME" || true

echo "[setup] 7/8 UFW firewall (nếu có cài UFW)"
if command -v ufw >/dev/null 2>&1; then
  ufw allow 'Nginx Full' || true
  ufw allow OpenSSH || true
fi

echo "[setup] 8/8 NEXT STEPS thủ công:"
cat <<EOF

  ✅ Server đã có: Node 20, PM2, nginx, certbot, app dir ${APP_DIR}

  Bạn cần làm tiếp:

  1) Trỏ DNS:
     Tạo A record:  ${DOMAIN}  →  IP của server này

  2) Đợi DNS propagate (kiểm tra: dig +short ${DOMAIN})

  3) Copy nginx config từ local repo:
     scp deploy/nginx-${DOMAIN}.conf root@${DOMAIN}:/etc/nginx/sites-available/${DOMAIN}
     ssh root@${DOMAIN} 'ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/'

  4) Lấy SSL cert (Let's Encrypt):
     certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos -m admin@halong24h.com
     # Certbot sẽ tự sửa nginx config thêm path cert. Sau đó:
     systemctl reload nginx

  5) Từ máy local, deploy lần đầu:
     ./deploy/deploy.sh

  6) Verify:
     curl -I https://${DOMAIN}
     pm2 status halong24h-manage

EOF
