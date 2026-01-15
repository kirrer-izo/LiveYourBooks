#!/bin/sh

# Update Nginx to listen on the port Render provides
if [ ! -z "$PORT" ]; then
    sed -i "s/listen 80;/listen $PORT;/g" /etc/nginx/sites-available/default
    sed -i "s/listen \[::\]:80;/listen \[::\]:$PORT;/g" /etc/nginx/sites-available/default
fi

# Ensure SQLite database exists if using sqlite
if [ "$DB_CONNECTION" = "sqlite" ]; then
    if [ ! -f /var/www/database/database.sqlite ]; then
        touch /var/www/database/database.sqlite
        chown www-data:www-data /var/www/database/database.sqlite
    fi
fi

# Optimize Laravel for Production
php artisan config:clear
php artisan package:discover --ansi
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start PHP-FPM in background
php-fpm -D

# Start Nginx in foreground
echo "Starting Nginx on port $PORT..."
nginx -g "daemon off;"