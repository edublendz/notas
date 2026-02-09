FROM php:8.2-fpm-alpine

RUN apk add --no-cache \
    icu-dev \
    libzip-dev \
    oniguruma-dev \
    bash \
    git \
    && docker-php-ext-install -j$(nproc) \
        intl \
        pdo_mysql \
        zip \
    && apk del git

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/api

COPY apis/composer.json apis/composer.lock* ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --no-scripts

COPY apis/ ./

RUN composer dump-autoload --optimize \
    && php bin/console cache:clear --no-warmup || true \
    && php bin/console cache:warmup || true \
    && chown -R www-data:www-data var

USER www-data

CMD ["php-fpm", "-F"]
