// PM2 config for motoexcursions.it on the Sweden VPS.
// Runs the Astro Node standalone server.
// Secrets (META_*, YOUTUBE_*) come from .env — never commit.
module.exports = {
  apps: [
    {
      name: 'motoexcursions',
      cwd: '/home/greg/motoexcursions',
      script: 'dist/server/entry.mjs',
      node_args: '--env-file=/home/greg/motoexcursions/.env',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '30015',
      },
      max_memory_restart: '256M',
      autorestart: true,
      watch: false,
    },
  ],
};
