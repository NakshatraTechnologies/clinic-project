module.exports = {
  apps: [
    {
      name: 'clinic-backend',
      script: './Backend/server.js',
      cwd: '/var/www/clinic',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5010,
      },
      // PM2 will also load Backend/.env via dotenv inside server.js
      // So make sure Backend/.env exists on the server
      error_file: '/var/www/clinic/logs/pm2-error.log',
      out_file: '/var/www/clinic/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
