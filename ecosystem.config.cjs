/**
 * PM2 ecosystem config — production deploy.
 *
 * Chạy trên server:
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 save
 *   pm2 startup    # tạo systemd service để PM2 auto-start sau reboot
 *
 * Reload không downtime sau khi pull code + npm ci + npm run build:
 *   pm2 reload halong24h-manage
 */
module.exports = {
  apps: [
    {
      name: 'halong24h-manage',
      cwd: '/var/www/halong24h-manage',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      instances: 'max', // Cluster mode — 1 instance per CPU core
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Log paths — nhớ tạo `mkdir -p /var/log/pm2` trên server
      output: '/var/log/pm2/halong24h-manage.out.log',
      error: '/var/log/pm2/halong24h-manage.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Hồi phục nhanh khi crash
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
