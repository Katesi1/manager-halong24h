module.exports = {
  apps: [
    {
      name: 'web-manager',
      cwd: 'C:\\Halong24h\\Webhalong24hManager',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 4003',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 4003,
      },
    },
  ],
};
