#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

SERVER_NAME="${SERVER_NAME:-_}"

export COMPOSER_ALLOW_SUPERUSER=1

if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo -E"
else
    if [ "$(id -u)" -ne 0 ]; then
        echo "This script requires sudo or root privileges." >&2
        exit 1
    fi
    SUDO=""
fi

log() {
    printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

run_privileged() {
    if [ -n "$SUDO" ]; then
        $SUDO "$@"
    else
        "$@"
    fi
}

APT_UPDATED=0
ensure_apt_updated() {
    if [ "$APT_UPDATED" -eq 0 ]; then
        log "Updating apt package index..."
        run_privileged apt-get update
        APT_UPDATED=1
    fi
}

ensure_packages() {
    ensure_apt_updated
    run_privileged env DEBIAN_FRONTEND=noninteractive apt-get install -y "$@"
}

trap 'log "Deployment failed."; exit 1' ERR

log "Ensuring core apt tooling is present..."
ensure_packages ca-certificates curl git unzip software-properties-common lsb-release gnupg

ensure_php() {
    local needs_repo=0

    if command -v php >/dev/null 2>&1; then
        CURRENT_PHP="$(php -r 'echo PHP_VERSION;')"
        if php -r "exit(version_compare(PHP_VERSION, '8.4', '<') ? 0 : 1);"; then
            log "PHP ${CURRENT_PHP} detected (older than 8.4). Upgrading..."
            needs_repo=1
        else
            log "PHP ${CURRENT_PHP} already meets requirements."
        fi
    else
        log "PHP not detected. Installing PHP 8.4..."
        needs_repo=1
    fi

    if [ "$needs_repo" -eq 1 ]; then
        run_privileged add-apt-repository -y ppa:ondrej/php
        ensure_apt_updated
    fi

    ensure_packages php8.4 php8.4-cli php8.4-fpm php8.4-bcmath php8.4-mbstring php8.4-xml php8.4-zip php8.4-curl php8.4-intl php8.4-mysql php8.4-readline php8.4-gd
    if [ -x /usr/bin/php8.4 ]; then
        run_privileged update-alternatives --set php /usr/bin/php8.4 >/dev/null 2>&1 || true
    fi
    log "PHP $(php -r 'echo PHP_VERSION;') ready."
}

ensure_node() {
    if command -v node >/dev/null 2>&1; then
        log "Node $(node -v) detected. Updating to latest current release..."
    else
        log "Node.js not detected. Installing latest current release..."
    fi

    curl -fsSL https://deb.nodesource.com/setup_current.x | run_privileged bash -
    ensure_packages nodejs build-essential
    log "Node $(node -v) with npm $(npm -v) ready."
}

ensure_composer() {
    if command -v composer >/dev/null 2>&1; then
        log "Composer $(COMPOSER_ALLOW_SUPERUSER=1 composer --version | awk '{print $3}') detected. Updating..."
    else
        log "Composer not detected. Installing..."
    fi

    local expected actual
    expected="$(curl -sS https://composer.github.io/installer.sig)"
    php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
    actual="$(php -r "echo hash_file('sha384', 'composer-setup.php');")"

    if [ "$expected" != "$actual" ]; then
        rm -f composer-setup.php
        echo "Composer installer signature mismatch." >&2
        exit 1
    fi

    run_privileged php composer-setup.php --install-dir=/usr/local/bin --filename=composer --quiet
    rm -f composer-setup.php
    log "Composer $(COMPOSER_ALLOW_SUPERUSER=1 composer --version | awk '{print $3}') ready."
}

ensure_nginx() {
    if command -v nginx >/dev/null 2>&1; then
        log "Nginx $(nginx -v 2>&1 | awk -F/ '{print $2}') already present."
    else
        log "Installing Nginx web server..."
        ensure_packages nginx
        run_privileged systemctl enable --now nginx >/dev/null 2>&1 || true
    fi
}

configure_nginx() {
    local conf_path="/etc/nginx/sites-available/pedavue.conf"
    local enabled_path="/etc/nginx/sites-enabled/pedavue.conf"
    local root_path="${PROJECT_ROOT}/public"

    if [ ! -d "${root_path}" ]; then
        log "Public directory ${root_path} missing; skipping Nginx configuration."
        return
    fi

    log "Configuring Nginx server block for ${SERVER_NAME}..."

    run_privileged bash -c "cat <<'EOF' > '${conf_path}'
server {
    listen 80;
    listen [::]:80;
    server_name ${SERVER_NAME};

    root ${root_path};
    index index.php index.html;

    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection '1; mode=block';

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$ {
        try_files \$uri =404;
        expires max;
        access_log off;
    }

    location ~ /(\.env|storage|bootstrap|artisan|\.git) {
        deny all;
        return 404;
    }

    error_log /var/log/nginx/pedavue_error.log;
    access_log /var/log/nginx/pedavue_access.log;
}
EOF"

    run_privileged mkdir -p /var/log/nginx
    run_privileged ln -sfn "${conf_path}" "${enabled_path}"
    if [ -e /etc/nginx/sites-enabled/default ]; then
        run_privileged rm -f /etc/nginx/sites-enabled/default
    fi

    if run_privileged nginx -t; then
        run_privileged systemctl reload nginx
        log "Nginx reloaded with pedavue.conf"
    else
        log "Nginx configuration test failed; keeping existing configuration."
    fi
}

log "Preparing PHP runtime..."
ensure_php

log "Preparing Node.js toolchain..."
ensure_node

log "Preparing Composer..."
ensure_composer

log "Ensuring Nginx is installed..."
ensure_nginx
configure_nginx

log "Installing Composer dependencies..."
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction --ansi --no-progress

if [ ! -f .env ]; then
    log ".env file not found. Configure environment variables before running artisan commands."
else
    log "Caching Laravel optimizations..."
    if ! php artisan optimize --ansi; then
        log "Artisan optimize failed; verify environment configuration."
    fi
fi

log "Installing Node dependencies..."
if [ -f package-lock.json ]; then
    npm ci --loglevel error
else
    npm install --loglevel error
fi

log "Building frontend assets..."
npm run build --silent

log "Deployment build finished. Run 'php artisan migrate --force' manually when you are ready."
