if [ ! -z "$PORT" ]; then
    sed -i "s/listen 80;/listen $PORT;/g" /etc/nginx/sites-available/default.conf
    sed -i "s/listen \[::\]:80;/listen \[::\]:$PORT;/g" /etc/nginx/sites-available/default.conf
fi



# Ensure SQLite database exists if using sqlite driver
if [ -z "$DB_CONNECTION" ] || [ "$DB_CONNECTION" = "sqlite" ]; then
    if [ ! -f /var/www/database/database.sqlite ]; then
        touch /var/www/database/database.sqlite
        chown www-data:www-data /var/www/database/database.sqlite
    fi
fi

php artisan package:discover --ansi
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

php-fpm -D

nginx -g "daemon off;"
