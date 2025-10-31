# VPS Deployment Guide

This guide explains how to deploy Pedavue to a fresh Ubuntu 24.04 VPS (for example Jagoan Hosting) using the automated helper script at `scripts/deploy.sh`. The script provisions the runtime, installs dependencies, configures Nginx, and builds production assets in under ten minutes when run on a clean server.

## What the Script Does

- Checks for PHP 8.4 and installs it from the Ondřej Surý PPA when missing or outdated.
- Installs the latest current release of Node.js and npm via the NodeSource repository.
- Installs or updates Composer with signature verification.
- Runs `composer install --no-dev --optimize-autoloader`.
- Installs or updates Nginx, wiring a `pedavue.conf` server block pointing to the app's `public/` directory.
- Runs `npm ci` (or `npm install`) followed by `npm run build`.
- Caches Laravel optimizations (`php artisan optimize`) when an `.env` file is present.
- Leaves database migrations to be executed manually after review.

## Before You Start

1. **Server access** – SSH into the VPS with a user that can escalate via `sudo`.
2. **System clock** – Ensure `timedatectl` shows the correct timezone and NTP status.
3. **Dependencies** – Remove any conflicting PHP/Node repositories if previously installed.
4. **Laravel env file** – Copy your production `.env` (see `docs/deployment-guide.md` for secret tips) and upload it to the project root before running the script.
5. **Desired host name** – Export `SERVER_NAME=pedavue.example.com` (or set it via the GitHub Action secret) before running the script if you want the Nginx config to use a domain instead of `_`.
6. **Web server user (optional)** – If your PHP-FPM pool runs under a user other than `www-data`, export `WEB_USER=myuser` so storage/cache permissions are applied correctly.

## Initial Server Preparation (One-Time)

```bash
# On the VPS after logging in
sudo apt-get update
sudo apt-get install -y git unzip curl
mkdir -p /var/www/pedavue
cd /var/www/pedavue
git clone <your-repo-url> .
cp .env.example .env  # replace with the real production file afterwards
```

## Running the Deployment Script

```bash
cd /var/www/pedavue
chmod +x scripts/deploy.sh
SERVER_NAME=pedavue.example.com ./scripts/deploy.sh
# or specify alternative PHP-FPM user if needed
SERVER_NAME=pedavue.example.com WEB_USER=nginx ./scripts/deploy.sh
```

### Script Arguments

The script does not require arguments. It internally uses `sudo` when available. If you run it as root, ensure the project files remain owned by your deployment user (`chown -R deploy:deploy /var/www/pedavue`).

## GitHub Actions Secrets

These secrets power `.github/workflows/deploy-vps-provision.yml`:

- `VPS_SSH_HOST` – required; VPS hostname or IP address.
- `VPS_SSH_USER` – required; SSH username used by the workflow.
- `VPS_SSH_PORT` – optional; SSH port (defaults to 22).
- `VPS_SSH_PRIVATE_KEY` – required; private key that authenticates the workflow.
- `VPS_SSH_KNOWN_HOSTS` – optional; host key fingerprint to enforce strict checking.
- `VPS_ENV_PRODUCTION` – required; full production `.env` contents.
- `VPS_APP_DIR` – optional; remote application path (defaults to `/var/www/<repository>` when omitted).
- `VPS_SERVER_NAME` – optional; domain or host value for the generated Nginx config (`_` when omitted).
- `VPS_WEB_USER` – optional; PHP-FPM/web server user for storage permissions (defaults to `www-data`).

### Creating and Testing `VPS_SSH_PRIVATE_KEY`

1. **Generate an SSH key pair on your local machine** (skip if you already have one dedicated to deployments):

    ```bash
    ssh-keygen -t ed25519 -C "pedavue-deploy" -f ~/.ssh/pedavue_vps
    ```

    - `~/.ssh/pedavue_vps` becomes your private key (what you store in the GitHub secret).
    - `~/.ssh/pedavue_vps.pub` is the public key.

2. **Copy the public key to the VPS user** (replace `deploy@example.com` with your SSH user and host):

    ```bash
    ssh-copy-id -i ~/.ssh/pedavue_vps.pub deploy@example.com
    ```

    If `ssh-copy-id` is unavailable, append the public key manually to `/home/deploy/.ssh/authorized_keys` on the server.

3. **Test the connection from your local machine** before adding secrets:

    ```bash
    ssh -i ~/.ssh/pedavue_vps deploy@example.com
    ```

    - Confirm you can log in without a password prompt.
    - Run a quick command, e.g. `whoami`, then exit.

4. **Validate the host fingerprint** (for the optional `VPS_SSH_KNOWN_HOSTS` secret):

    ```bash
    ssh-keyscan -H example.com
    ```

    Copy the resulting line into the secret if you want strict host checking.

5. **Store the private key in GitHub Secrets**:
    - Open `Settings → Secrets and variables → Actions`.
    - Add a new secret named `VPS_SSH_PRIVATE_KEY`.
    - Paste the contents of `~/.ssh/pedavue_vps` (including the `-----BEGIN OPENSSH PRIVATE KEY-----` header and footer).

Keep the private key file secure on your local machine; use file permissions `chmod 600 ~/.ssh/pedavue_vps`.

## Post-Script Tasks

1. **Run database migrations manually** (per business policy):
    ```bash
    php artisan migrate --force
    ```
2. **Warm caches (optional)**: `php artisan config:cache`, `php artisan route:cache`.
3. **Reload PHP-FPM / Web server** if required: `sudo systemctl reload php8.4-fpm`, `sudo systemctl reload nginx` (the script reloads Nginx automatically after writing the config).
4. **Queue / Scheduler** – ensure Supervisor or systemd units are configured for `php artisan queue:work` and the scheduler (`php artisan schedule:run`).

## Rolling Updates

For subsequent deployments:

```bash
cd /var/www/pedavue
git pull origin galur
./scripts/deploy.sh
php artisan migrate --force   # when approved
```

The script is idempotent: it upgrades existing PHP/Node/Composer installations and only reinstalls dependencies when necessary.

## Troubleshooting

- **APT repository errors** – rerun `sudo apt-get update` and ensure outbound HTTPS is allowed.
- **Permission denied** – verify the user can run `sudo` and owns the project files.
- **Build failures** – check that `.env` contains correct `APP_URL`, database, and Vite configuration. Rerun `npm run build` manually after fixing issues.
- **Composer memory issues** – prepend `COMPOSER_MEMORY_LIMIT=-1` when invoking the script on low-memory machines.

## Hardening Reminders

- Replace password SSH with key-based authentication.
- Enable automatic security updates: `sudo apt-get install unattended-upgrades`.
- Monitor disk usage with `df -h`; asset builds can grow quickly.

With these steps, deploying Pedavue to any Ubuntu-based VPS becomes a repeatable, script-driven process while keeping final database changes under manual control.
