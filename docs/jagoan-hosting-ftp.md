# Jagoan Hosting Deployment Guide

This guide covers the GitHub Actions workflows stored at:

- `.github/workflows/deploy-jagoan-hosting.yml` — incremental **FTP/FTPS** deployments.
- `.github/workflows/deploy-jagoan-hosting-ssh.yml` — **SSH + rsync** deployments with release directories.

Both workflows prepare production-ready assets inside GitHub Actions and publish them to your Jagoan Hosting cPanel account. Choose the SSH pipeline when you need faster uploads or want an atomic release process; use the FTP workflow if SSH is unavailable.

## Workflow Overview

- Checks out the repository on Ubuntu.
- Installs PHP 8.4 dependencies using Composer with production flags.
- Installs Node.js 22 dependencies, builds the Vite assets, and mirrors the output to `public/build`.
- For FTP: flattens the Laravel `public/` directory into the hosting document root and rewrites `index.php` for shared hosting.
- For SSH: uploads a timestamped release folder (including the entire Laravel app), symlinks `current`, syncs only `public/` into the document root, and rewrites `index.php` to reference the current release.
- Ensures the Vite build output is available from both `/build` and `/public/build` as required by Laravel.
- Writes the production `.env` file from a GitHub secret.
- Uploads the prepared tree either via `SamKirkland/FTP-Deploy-Action` (FTP workflow) or via `rsync` over SSH (SSH workflow).

When using the SSH workflow the remote server keeps the last five releases under `~/apps/pedavue/releases/` (default), updates `~/apps/pedavue/current`, and re-creates the `public_html/storage` symlink so `/storage/*` downloads remain valid.

## Required GitHub Secrets

Create the following repository secrets before enabling the workflow:

| Secret name                        | Description                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `JAGOAN_FTP_HOST`                  | FTP or FTPS hostname provided by Jagoan Hosting.                                  |
| `JAGOAN_FTP_USER`                  | Full FTP username (often `cpanel_user@domain`).                                   |
| `JAGOAN_FTP_PASS`                  | FTP password.                                                                     |
| `JAGOAN_FTP_PORT` _(opt)_          | FTP port. Defaults to `21` when omitted.                                          |
| `JAGOAN_FTP_PROTOCOL` _(opt)_      | `ftps` (default) or `ftp` if TLS is unavailable.                                  |
| `JAGOAN_SERVER_PUBLIC_DIR` _(opt)_ | Target directory on the server. Defaults to `/public_html/`.                      |
| `JAGOAN_ENV_PRODUCTION`            | Full contents of the production `.env` file used by Laravel (including newlines). |

Additional secrets for the SSH workflow:

| Secret name                        | Description                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `JAGOAN_SSH_HOST`                  | SSH hostname or IP (typically the same as the cPanel host).                                                 |
| `JAGOAN_SSH_USER`                  | SSH username (usually the cPanel username).                                                                 |
| `JAGOAN_SSH_PRIVATE_KEY`           | Private key in PEM format that matches the public key uploaded to cPanel (no passphrase recommended).       |
| `JAGOAN_SSH_PORT` _(opt)_          | SSH port; defaults to `22` when omitted.                                                                    |
| `JAGOAN_SSH_KNOWN_HOSTS` _(opt)_   | Host key fingerprint entries for strict host checking; leave blank to allow the workflow to accept any key. |
| `JAGOAN_SERVER_APP_DIR` _(opt)_    | Base directory for release folders. Defaults to `~/apps/pedavue`.                                           |
| `JAGOAN_SERVER_PUBLIC_DIR` _(opt)_ | Document root synced with the release `public/`. Defaults to `~/public_html`.                               |

### Preparing `JAGOAN_ENV_PRODUCTION`

1. Copy `.env.example` locally.
2. Update it with production database, cache, mail, and queue credentials.
3. Generate an application key via `php artisan key:generate --show` and paste it into `APP_KEY`.
4. Paste the complete file (with trailing newline) into the `JAGOAN_ENV_PRODUCTION` secret.

## Running Deployments

- **Automatic:** Push to the `main` branch.
- **Manual:** In GitHub go to _Actions_ → pick the FTP or SSH workflow → _Run workflow_.

Each run rebuilds assets and uploads only new or changed files. The FTP workflow resumes from an incremental state file (`deploy-jagoan-sync-state.json`). The SSH workflow copies only the diff thanks to `rsync` and swaps releases atomically.

## Forcing a Clean Upload

If you need to rebuild the remote tree from scratch:

- **FTP workflow:** delete the contents of `public_html` (or your custom directory), remove `deploy-jagoan-sync-state.json`, then trigger the workflow. The next run performs a full upload and recreates the state file.
- **SSH workflow:** remove old release folders under `~/apps/pedavue/releases/` (optional) and re-run the workflow. It will create a new release and swap the `current` symlink automatically.

## Storage Directories

The workflow pre-creates these writable directories so Laravel can cache data without manual permission tweaks:

- `storage/framework/cache`
- `storage/framework/sessions`
- `storage/framework/views`
- `bootstrap/cache`

Jagoan Hosting runs PHP as the same user that owns the uploaded files, so no additional permission commands are required.

## Tips

- Keep commits small to minimize the upload delta.
- Do not edit files directly via cPanel; manual edits break incremental sync (FTP) and risk release drift (SSH).
- Review the workflow logs in GitHub Actions when diagnosing deployment issues.
- When adding new Composer dependencies, expect longer uploads because the `vendor/` directory changes significantly.
- With the SSH workflow, confirm the uploaded key is **authorized** in cPanel before running the pipeline (cPanel → SSH Access → Manage → Authorize).
