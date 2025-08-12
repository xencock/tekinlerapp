module.exports = {
  apps: [
    {
      name: 'tekinler',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 5000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: process.env.PORT || 5000,
      },
      max_memory_restart: '300M',
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true
    }
  ]
};


