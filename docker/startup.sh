if [ ! -z "$PORT" ]; then
    sed -i "s/listen 80;/listen $PORT;/g" /etc/nginx/sites-available/default.conf
    sed -i "s/listen \[::\]:80;/listen \[::\]:$PORT;/g" /etc/nginx/sites-available/default.conf
fi



php artisan package:discover --ansi
php artisan config:cache
php artisan route:cache
php artisan view:cache

php-fpm -D

nginx -g "daemon off;"
