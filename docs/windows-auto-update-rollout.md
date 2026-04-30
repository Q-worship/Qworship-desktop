# Windows Auto-Update Rollout

Qworship Live Console now has the core pieces needed for installed-user Windows updates without sending users back to the downloads page each time. The current implementation uses a **generic HTTPS update feed** with the default stable feed URL set to:

`https://downloads.qworship.com/live-console-updates/win/stable`

The packaged app can also be pointed at another feed during staged testing by setting the `QWORSHIP_UPDATE_FEED_URL` environment variable before launching the app. This makes it possible to validate updates against a staging channel before publishing the same build to stable.

## Required publishing secrets

The release workflow expects the following secrets or environment variables:

| Variable | Purpose |
|---|---|
| `QWORSHIP_UPDATE_BUCKET` | S3 or R2 bucket used to store update files |
| `QWORSHIP_UPDATE_REGION` | Bucket region or `auto` for compatible providers |
| `QWORSHIP_UPDATE_ENDPOINT` | Optional custom endpoint for Cloudflare R2 or another S3-compatible provider |
| `QWORSHIP_UPDATE_PREFIX` | Base prefix, for example `live-console-updates/win` |
| `QWORSHIP_UPDATE_PUBLIC_BASE_URL` | Public HTTPS base URL, for example `https://downloads.qworship.com/live-console-updates/win` |
| `AWS_ACCESS_KEY_ID` | Storage access key |
| `AWS_SECRET_ACCESS_KEY` | Storage secret key |

## Stable release flow

For stable releases, build the desktop app, verify that `latest.yml` and the installer files exist, then publish with `QWORSHIP_UPDATE_CHANNEL=stable`. The GitHub Actions workflow `publish-desktop-update.yml` automates that sequence on Windows.

## Staged verification flow

Before pushing an update to all users, Qworship should test the update loop in a controlled way.

| Step | Action |
|---|---|
| 1 | Publish the newer build to the `staging` channel by setting `QWORSHIP_UPDATE_CHANNEL=staging` |
| 2 | Install an older packaged version of Qworship Live Console on a test machine |
| 3 | Launch the installed app with `QWORSHIP_UPDATE_FEED_URL=https://downloads.qworship.com/live-console-updates/win/staging` |
| 4 | Trigger `window.api.updates.checkForUpdates(true)` from the renderer integration or a QA harness |
| 5 | Confirm the app reports `checking`, `available`, `downloading`, and `downloaded` states |
| 6 | Confirm `window.api.updates.quitAndInstall()` restarts into the newer build |
| 7 | Re-test Online HFB, Offline HFB, Bible rendering, and NDI after the update is installed |

## Important current guardrail

Because code signing is being deferred for now, Windows may still show trust warnings during installation or update application. The update pipeline can still be wired and tested, but Qworship should treat it as a **controlled rollout** until a stable signing certificate is added later.
