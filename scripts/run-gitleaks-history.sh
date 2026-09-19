#!/usr/bin/env bash
set -euo pipefail

readonly GITLEAKS_VERSION="8.30.1"
readonly GITLEAKS_SHA256="551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb"
readonly ARCHIVE="gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz"
readonly DOWNLOAD_URL="https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/${ARCHIVE}"

scan_tmp="$(mktemp -d)"
cleanup() {
  [[ "$scan_tmp" == /tmp/* ]] && rm -r -- "$scan_tmp"
}
trap cleanup EXIT

curl --fail --silent --show-error --location "$DOWNLOAD_URL" --output "$scan_tmp/$ARCHIVE"
printf '%s  %s\n' "$GITLEAKS_SHA256" "$scan_tmp/$ARCHIVE" | sha256sum --check --status
tar --extract --gzip --no-same-owner --file "$scan_tmp/$ARCHIVE" --directory "$scan_tmp" gitleaks

"$scan_tmp/gitleaks" git . \
  --log-opts=--all \
  --redact=100 \
  --no-banner \
  --no-color
