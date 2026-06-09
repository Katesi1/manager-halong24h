# Deploy — Halong24h Web Admin

Target: VPS Ubuntu 22.04 + PM2 + nginx + Let's Encrypt SSL.
Domain: `manage.halong24h.com`.

## Files

| File | Vai trò |
|---|---|
| `server-setup.sh` | Chạy **MỘT LẦN** trên server lần đầu (install Node + PM2 + nginx + certbot) |
| `nginx-manage.halong24h.com.conf` | Nginx reverse proxy config — copy lên server |
| `../ecosystem.config.cjs` | PM2 process config — đã có sẵn trong root repo |
| `deploy.sh` | Deploy script chạy từ máy LOCAL — build + rsync + reload PM2 |

## Lần đầu setup

### 1. Trỏ DNS

Vào DNS provider (Cloudflare/Vercel/etc.):

```
A   manage.halong24h.com   <SERVER_IP>
```

Đợi DNS propagate (~5-30 phút). Verify:

```bash
dig +short manage.halong24h.com
```

### 2. Setup server

SSH vào server, copy & chạy `server-setup.sh`:

```bash
# Trên máy local
scp deploy/server-setup.sh root@<SERVER_IP>:/tmp/

# SSH vào server
ssh root@<SERVER_IP>
bash /tmp/server-setup.sh
```

Script này install Node 20 + PM2 + nginx + certbot + tạo `/var/www/halong24h-manage`.

### 3. Copy nginx config + lấy SSL cert

Vẫn trên server (hoặc từ máy local):

```bash
# Từ local
scp deploy/nginx-manage.halong24h.com.conf root@<SERVER_IP>:/etc/nginx/sites-available/manage.halong24h.com

# SSH vào server
ssh root@<SERVER_IP>
ln -sf /etc/nginx/sites-available/manage.halong24h.com /etc/nginx/sites-enabled/

# Xoá tạm 2 dòng SSL trong config (chưa có cert) — comment ra:
#   ssl_certificate ...
#   ssl_certificate_key ...
#   ssl_trusted_certificate ...
# Để nginx có thể start trước khi cert có

nginx -t
systemctl reload nginx

# Lấy cert
certbot --nginx -d manage.halong24h.com \
  --non-interactive --agree-tos -m halong24h.team@gmail.com

# Certbot tự thêm SSL paths vào config. Uncomment 3 dòng SSL trên (nếu certbot không tự làm).
nginx -t
systemctl reload nginx
```

### 4. Deploy lần đầu (từ local)

```bash
# Edit deploy/deploy.sh thay SERVER_HOST nếu khác manage.halong24h.com
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

Hoặc set env inline:

```bash
SERVER_USER=root SERVER_HOST=12.34.56.78 ./deploy/deploy.sh
```

### 5. Verify

```bash
# Trên server
pm2 status halong24h-manage
pm2 logs halong24h-manage --lines 50

# Từ ngoài
curl -I https://manage.halong24h.com
```

Mở trình duyệt: https://manage.halong24h.com/login

## Deploy lần sau (sau khi commit code mới)

```bash
git pull
./deploy/deploy.sh
```

Script tự: typecheck → build → rsync → `pm2 reload` (zero downtime).

## Rollback nhanh

```bash
ssh root@<SERVER_IP>
cd /var/www/halong24h-manage
pm2 stop halong24h-manage
# Restore .next + node_modules từ backup (rsync trước đó nên có)
pm2 start halong24h-manage
```

Tốt nhất set up backup cron `tar /var/www/halong24h-manage` mỗi đêm.

## Google Sign-In sau deploy

Sau khi `https://manage.halong24h.com` chạy được, vào Google Cloud Console:

1. https://console.cloud.google.com/apis/credentials
2. Web client → **Authorized JavaScript origins** → Add: `https://manage.halong24h.com`
3. Save (đợi 5 phút Google cache update)

## Troubleshooting

| Vấn đề | Cách kiểm tra |
|---|---|
| `502 Bad Gateway` | PM2 chưa start. `pm2 status` + `pm2 logs` |
| `connection refused` | App chưa listen port 3001. Check `netstat -tlnp \| grep 3001` |
| `SSL cert error` | Certbot fail. `certbot certificates` xem cert tồn tại. Re-run certbot |
| `Google button không hiện` | `.env.production` thiếu `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. Build lại |
| `Google audience mismatch` | BE chưa add Web Client ID vào audience. Báo BE |
| `502 sau deploy` | Build fail trên server. `pm2 logs` xem error trace |
