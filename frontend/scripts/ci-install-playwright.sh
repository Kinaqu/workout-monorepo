#!/usr/bin/env bash
# Installs the pinned Playwright chromium headless shell (all smoke runs are
# headless). Prefers Google's Chrome-for-Testing CDN because the default
# Playwright CDN intermittently slows to a crawl and stalls CI; the artifact
# is identical. Falls back to `npx playwright install` if the fast path fails.
set -euo pipefail

browsers_meta="./node_modules/playwright-core/browsers.json"
cache_dir="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"

shell_meta() {
  node -p "require('$browsers_meta').browsers.find(b => b.name === 'chromium-headless-shell').$1"
}
revision=$(shell_meta revision)
version=$(shell_meta browserVersion)
dest="$cache_dir/chromium_headless_shell-$revision"

if [ ! -f "$dest/INSTALLATION_COMPLETE" ] && [ "$(uname -sm)" = "Linux x86_64" ]; then
  url="https://storage.googleapis.com/chrome-for-testing-public/$version/linux64/chrome-headless-shell-linux64.zip"
  echo "Fetching chromium headless shell $version (revision $revision) from $url"
  tmp_zip=$(mktemp /tmp/chrome-headless-shell-XXXX.zip)
  if curl -fsSL --retry 3 --max-time 240 -o "$tmp_zip" "$url"; then
    mkdir -p "$dest"
    unzip -q -o "$tmp_zip" -d "$dest"
    touch "$dest/INSTALLATION_COMPLETE"
    echo "Installed into $dest"
  else
    echo "Fast CDN download failed"
  fi
  rm -f "$tmp_zip"
fi

# When the fast path delivered the browser, stop here: `npx playwright
# install` would still fetch ffmpeg from the slow CDN, and the headless
# smoke suite records no video, so ffmpeg is not needed.
if [ -f "$dest/INSTALLATION_COMPLETE" ] && [ -x "$dest/chrome-headless-shell-linux64/chrome-headless-shell" ]; then
  echo "Chromium headless shell $version ready in $dest"
  exit 0
fi

echo "Falling back to the default Playwright installer"
npx playwright install chromium --only-shell
