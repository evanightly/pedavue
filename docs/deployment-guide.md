# InfinityFree Deployment Guide

This guide explains how to configure and operate the GitHub Actions workflow that deploys Pedavue to InfinityFree (or similar shared hosting). The workflow file lives at `.github/workflows/deploy-infinityfree.yml`.

## What the Workflow Does

- Checks out the repository on Ubuntu.
- Installs PHP 8.4 dependencies via Composer (production flags only).
- Installs Node.js 22 dependencies and builds the Vite assets.
- Folds the `public/` directory into the root so the app can run from `/htdocs`.
- Writes the production `.env` supplied as a GitHub secret.
- Uploads the prepared tree to InfinityFree using `SamKirkland/FTP-Deploy-Action`.

Because InfinityFree enforces very strict FTP time and file-transfer limits, the workflow uses **incremental uploads** (`dangerous-clean-slate: false`). The deploy action keeps a small state file (`deploy-sync-state.json`) to resume from where the last run finished. This is the only practical way to upload the large `vendor/` tree without hitting the host limits.

## GitHub Secrets

Add the following repository secrets before running the workflow:

| Secret                           | Description                                              |
| -------------------------------- | -------------------------------------------------------- |
| `FTP_HOST`                       | InfinityFree FTP hostname (for example `ftpupload.net`). |
| `FTP_USER`                       | Full FTP username from the hosting control panel.        |
| `FTP_PASS`                       | FTP password.                                            |
| `FTP_PORT` _(optional)_          | FTP port number. Defaults to `21`.                       |
| `FTP_PROTOCOL` _(optional)_      | `ftps` (default) or `ftp` if the host rejects TLS.       |
| `SERVER_HTDOCS_DIR` _(optional)_ | Remote target directory. Defaults to `/htdocs/`.         |
| `ENV_PRODUCTION`                 | Full contents of the production `.env` file.             |

### Preparing `ENV_PRODUCTION`

1. Copy `.env.example` locally.
2. Fill in the production credentials (database, mail, cache, etc.).
3. Generate an app key with `php artisan key:generate --show` and paste it into `APP_KEY`.
4. Paste the complete file into the `ENV_PRODUCTION` secret (including newlines).

## Running a Deployment

- **Automatic:** Push to the `main` branch.
- **Manual:** Open GitHub → _Actions_ → _Deploy Laravel to InfinityFree_ → _Run workflow_.

The job will take several minutes. If the FTP step stops mid-way because the host closed the connection, simply run the workflow again. Incremental mode means only the remaining files will be transferred.

## Incremental Uploads Explained

- InfinityFree tears down FTP sessions after a few minutes or after too many files.
- Uploading the entire project (especially `vendor/`) every time regularly exceeds that limit.
- `SamKirkland/FTP-Deploy-Action` stores hash data in `deploy-sync-state.json`. Each rerun compares the remote state and uploads only the missing or changed files.
- Do **not** delete the state file on the server unless you intentionally need a clean slate.

### Forcing a Full Sync

If you want to rebuild the remote tree from scratch:

1. Delete everything inside the remote `htdocs` directory manually (one time action).
2. Remove `deploy-sync-state.json` from the remote root.
3. Trigger the workflow. The first run will re-upload everything and regenerate the state file.

Full resets should be rare because they take a long time and risk hitting the host limits again.

## Deploying Updated Code

1. Merge or push your code to `main` (or trigger manually).
2. The workflow will rebuild assets and upload only modified files.
3. If you add new Composer packages, the vendor directory will be re-synced. This may require multiple reruns; keep re-triggering until the run succeeds.

### Handling Repeated Timeouts

- Re-run the workflow; the incremental state keeps progress.
- If the workflow fails on a file that keeps retrying, check if there is enough quota and that the file name is valid (InfinityFree blocks some extensions like `.phar`).
- When the server reports “disk full”, clear unused files or upgrade the hosting plan.

## Storage and Permissions

The workflow creates these directories inside `deploy-htdocs` so the application can write cache files:

- `storage/framework/cache`
- `storage/framework/sessions`
- `storage/framework/views`
- `bootstrap/cache`

InfinityFree runs PHP as the same user that owns the files, so no extra permission fixes are required.

## Tips for Developers

- Keep commits small so the upload set stays manageable.
- Avoid adding unnecessary large binary assets to the repository.
- Always verify the latest successful deployment in GitHub Actions before editing files directly through cPanel; direct edits bypass the incremental state and can lead to drift.
- When debugging, use the workflow logs; they show which files were uploaded in each run.

With the above setup the team can deploy reliably to InfinityFree while working around the host’s FTP limits.
