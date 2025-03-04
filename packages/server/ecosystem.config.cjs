module.exports = {
  apps: [
    {
      name: 'toggl-auto-tracker',
      script: 'dist/index.cjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      log_file: 'logs/combined.log',
      merge_logs: true,
      time: true,
      max_logs: 30,
    },
  ],
}
