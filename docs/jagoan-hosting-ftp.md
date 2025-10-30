# Jagoan Hosting Deployment Guide

This guide covers the GitHub Actions workflow stored at `.github/workflows/deploy-jagoan-hosting.yml`. The workflow automates uploads to a Jagoan Hosting cPanel account using incremental FTP transfers.

## Workflow Overview

- Checks out the repository on Ubuntu.
- Installs PHP 8.4 dependencies using Composer with production flags.
- Installs Node.js 22 dependencies, builds the Vite assets, and mirrors the output to `public/build`.
- Flattens the Laravel `public/` directory into the hosting document root and rewrites `index.php` for shared hosting.
- Ensures the Vite build output is available from both `/build` and `/public/build` as required by Laravel.
- Writes the production `.env` file from a GitHub secret.
- Uploads the prepared tree to `public_html` (or a custom directory) via `SamKirkland/FTP-Deploy-Action` with incremental syncing.

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

### Preparing `JAGOAN_ENV_PRODUCTION`

1. Copy `.env.example` locally.
2. Update it with production database, cache, mail, and queue credentials.
3. Generate an application key via `php artisan key:generate --show` and paste it into `APP_KEY`.
4. Paste the complete file (with trailing newline) into the `JAGOAN_ENV_PRODUCTION` secret.

## Running Deployments

- **Automatic:** Push to the `main` branch.
- **Manual:** In GitHub go to _Actions_ → _Deploy Laravel to Jagoan Hosting_ → _Run workflow_.

Each run rebuilds assets and uploads only new or changed files. If Jagoan Hosting drops the FTP session mid-transfer, re-run the workflow; the incremental state file (`deploy-jagoan-sync-state.json`) lets the action resume from the previous progress.

## Forcing a Clean Upload

If you need to rebuild the remote tree from scratch:

1. Delete the contents of `public_html` (or your custom directory) through cPanel File Manager.
2. Remove `deploy-jagoan-sync-state.json` from the same directory.
3. Trigger the workflow again. The next run performs a full upload and recreates the state file.

Avoid doing this regularly because it takes longer and increases the chance of hitting FTP timeouts.

## Storage Directories

The workflow pre-creates these writable directories so Laravel can cache data without manual permission tweaks:

- `storage/framework/cache`
- `storage/framework/sessions`
- `storage/framework/views`
- `bootstrap/cache`

Jagoan Hosting runs PHP as the same user that owns the uploaded files, so no additional permission commands are required.

## Tips

- Keep commits small to minimize the upload delta.
- Do not edit files directly via cPanel; manual edits break the incremental sync state.
- Review the workflow logs in GitHub Actions when diagnosing deployment issues.
- When adding new Composer dependencies, expect longer uploads because the `vendor/` directory changes significantly.
