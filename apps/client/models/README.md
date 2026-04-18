# Whisper Models

This directory holds the `whisper.cpp` model files used by the Hands-Free Bible feature.

The desktop packaging workflow now stages the required `small.en` model into this folder before the Windows installer is built, so packaged installs can run fully offline from first launch.

Do not commit large model binaries to Git. Instead, run `pnpm run prepare:whisper-model` before `pnpm run build:desktop` so the local build includes the model in the packaged application resources.
