#!/bin/bash
# Server-side deploy script for motoexcursions.it on the Sweden VPS.
# Triggered by GitHub webhook (via /hooks/redeploy-motoexcursions on :9000)
# OR runnable by hand: ssh sweden 'bash /home/greg/motoexcursions/scripts/deploy.sh'

exec > /tmp/deploy-motoexcursions.log 2>&1
set -e

echo "Deploy started at $(date)"

cd /home/greg/motoexcursions

git config --global --add safe.directory /home/greg/motoexcursions
git fetch origin main
git reset --hard origin/main

echo "Installing dependencies..."
/usr/bin/npm ci

echo "Building project..."
/usr/bin/npm run build

echo "Restarting PM2 app..."
pm2 restart motoexcursions

echo "Deploy finished at $(date)"
