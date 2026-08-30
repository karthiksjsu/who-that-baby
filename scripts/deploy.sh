#!/usr/bin/env bash
#
# One-shot deploy to Vercel.
#
# Reads secrets from .env.local and pushes them to the Vercel project, so there
# is no copying values by hand into a web form. Values are piped straight from
# the file into the CLI and never echoed to the terminal.
#
# Usage:  bash scripts/deploy.sh
#
# You will be asked to log in via the browser once. Everything else is
# automatic. Safe to re-run: env vars are replaced, not duplicated.

set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE=".env.local"
# NEXT_PUBLIC_SITE_URL is deliberately absent here — it can only be set once we
# know the deployed address, so it is handled at the end.
VARS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  ADMIN_PASSCODE
  ADMIN_COOKIE_SECRET
)

say() { printf "\n\033[1;35m==> %s\033[0m\n" "$1"; }
die() { printf "\n\033[1;31mx %s\033[0m\n" "$1" >&2; exit 1; }

[ -f "$ENV_FILE" ] || die "No $ENV_FILE found. Run this from the project folder."

# Pull a value out of .env.local without printing it.
read_var() {
  grep -m1 "^$1=" "$ENV_FILE" | cut -d= -f2- | sed 's/^"//; s/"$//'
}

say "Checking your secrets are all present"
missing=()
for v in "${VARS[@]}"; do
  [ -n "$(read_var "$v")" ] || missing+=("$v")
done
if [ ${#missing[@]} -gt 0 ]; then
  die "Missing from $ENV_FILE: ${missing[*]}"
fi
echo "All ${#VARS[@]} found."

# Build first. A failure here is far cheaper to read locally than in a deploy log.
say "Building locally first (this is the risky step)"
npm run build || die "Build failed. Send me the error above and stop here — deploying now would only fail the same way."

say "Logging in to Vercel (a browser window will open)"
npx --yes vercel@latest login

say "Linking this folder to a Vercel project"
npx --yes vercel@latest link --yes

say "Uploading secrets"
for v in "${VARS[@]}"; do
  # Remove any previous value so re-running doesn't error or stack duplicates.
  npx --yes vercel@latest env rm "$v" production --yes >/dev/null 2>&1 || true
  printf '%s' "$(read_var "$v")" | npx --yes vercel@latest env add "$v" production >/dev/null
  echo "  set $v"
done

say "Deploying"
URL=$(npx --yes vercel@latest deploy --prod --yes | tail -1)
[ -n "$URL" ] || die "Deploy did not return a URL."

# The QR code on /admin/share renders this value. Left unset it points at
# localhost, and every guest who scans it lands nowhere.
say "Pointing the QR code at $URL"
npx --yes vercel@latest env rm NEXT_PUBLIC_SITE_URL production --yes >/dev/null 2>&1 || true
printf '%s' "$URL" | npx --yes vercel@latest env add NEXT_PUBLIC_SITE_URL production >/dev/null

say "Redeploying so the QR code picks that up"
FINAL=$(npx --yes vercel@latest deploy --prod --yes | tail -1)

printf "\n\033[1;32m✓ Live at %s\033[0m\n\n" "${FINAL:-$URL}"
echo "Next:"
echo "  1. Open ${FINAL:-$URL}/admin and log in with your ADMIN_PASSCODE"
echo "  2. Check your babies are all there"
echo "  3. Open /admin/share for the QR code to show guests"
echo "  4. Flip the status to live when everyone has joined"
