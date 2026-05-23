#!/usr/bin/env bash
set -euo pipefail

# Usage: ./upload-firebase-secret-to-gh.sh owner/repo /path/to/service-account.json [SECRET_NAME]
# Example: ./upload-firebase-secret-to-gh.sh your-org/your-repo ~/secrets/firebase-sa.json FIREBASE_SERVICE_ACCOUNT_FAMILY_ACTIVITY_SCHEDULER

REPO="$1"
FILE_PATH="$2"
SECRET_NAME="${3:-FIREBASE_SERVICE_ACCOUNT_FAMILY_ACTIVITY_SCHEDULER}"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required. Install from https://cli.github.com/"
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to compact JSON. Install via brew install jq"
  exit 1
fi
if [ -z "$REPO" ] || [ -z "$FILE_PATH" ]; then
  echo "Usage: $0 owner/repo /path/to/service-account.json [SECRET_NAME]"
  exit 1
fi
if [ ! -f "$FILE_PATH" ]; then
  echo "Service account file not found: $FILE_PATH"
  exit 1
fi

# Compact the JSON and set as secret
SECRET_VALUE=$(jq -c . "$FILE_PATH")

echo "Setting secret '$SECRET_NAME' in repo '$REPO'..."
# Use gh secret set --body "$SECRET_VALUE"
# Wrap in printf to avoid issues with very large env expansion
printf "%s" "$SECRET_VALUE" | gh secret set "$SECRET_NAME" --body - --repo "$REPO"

if [ $? -eq 0 ]; then
  echo "Secret '$SECRET_NAME' set successfully in $REPO"
else
  echo "Failed to set secret"
  exit 1
fi
