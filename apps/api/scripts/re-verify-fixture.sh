#!/usr/bin/env bash
# re-verify-fixture.sh
# Re-verifies the persistent prod test fixture's email via the SuperTokens Core admin API.
# Run when the email verification claim has lapsed (e.g., after a Core reset).
#
# Reads: command-center/testing/test-accounts.md (gitignored) for password + userId.
# Requires: Railway CLI authenticated via APP_RAILWAY_TOKEN env var.
# Requires: npx (Node.js + npm) for @railway/cli.
#
# Usage:
#   APP_RAILWAY_TOKEN=<token> bash apps/api/scripts/re-verify-fixture.sh
#
# The script:
#  1. Gets the SuperTokens API key from Railway CLI.
#  2. Temporarily creates a public domain on the supertokens Railway service.
#  3. Sets PORT=3567 so the Railway proxy routes to the Core.
#  4. Generates + consumes an email verification token via the Core admin API.
#  5. Confirms isVerified=true.
#  6. Removes the public domain and PORT variable (cleanup).
#
# SECURITY: Never commit the API key. The domain is live for <30 seconds during the script.

set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
ST_SERVICE_ID="73ca977a-912b-4cba-af46-39cd4cf3d328"
USER_ID="21984eb2-8029-4c1b-9e73-bc586a0be4d2"
EMAIL="studyhall-e2e-fixture@example.com"

# ── Validate env ────────────────────────────────────────────────────────────
if [[ -z "${APP_RAILWAY_TOKEN:-}" ]]; then
  echo "ERROR: APP_RAILWAY_TOKEN is required." >&2
  exit 1
fi

echo "Step 1: Reading API key from Railway..."
ST_API_KEY=$(RAILWAY_TOKEN="$APP_RAILWAY_TOKEN" npx --yes @railway/cli variables \
  --service "$ST_SERVICE_ID" 2>/dev/null \
  | grep "API_KEYS" \
  | sed 's/.*│[[:space:]]*//' \
  | sed 's/[[:space:]]*║.*//' \
  | tr -d '[:space:]')

if [[ -z "$ST_API_KEY" ]]; then
  echo "ERROR: Could not read API_KEYS from SuperTokens service variables." >&2
  exit 1
fi
echo "  API key obtained (${#ST_API_KEY} chars)"

echo "Step 2: Setting PORT=3567 on SuperTokens service..."
RAILWAY_TOKEN="$APP_RAILWAY_TOKEN" npx @railway/cli variables set \
  --service "$ST_SERVICE_ID" PORT=3567 2>/dev/null
sleep 3

echo "Step 3: Creating temporary public domain..."
DOMAIN_OUTPUT=$(RAILWAY_TOKEN="$APP_RAILWAY_TOKEN" npx @railway/cli domain \
  --service "$ST_SERVICE_ID" 2>/dev/null)
DOMAIN_ID=$(echo "$DOMAIN_OUTPUT" | grep "ID:" | awk '{print $2}')
DOMAIN_URL=$(echo "$DOMAIN_OUTPUT" | grep "URL:" | awk '{print $2}' | sed 's|https://||')
echo "  Domain: https://$DOMAIN_URL (ID: $DOMAIN_ID)"

# Wait for domain to become live
echo "Step 4: Waiting for Core to respond..."
for i in $(seq 1 20); do
  result=$(curl -s --connect-timeout 3 "https://$DOMAIN_URL/hello" 2>/dev/null)
  if echo "$result" | grep -q "Hello"; then
    echo "  Core is live!"
    break
  fi
  sleep 2
done

# ── Email verification ───────────────────────────────────────────────────────
echo "Step 5: Generating email verification token..."
VERIFY_TOKEN=$(curl -s -X POST "https://$DOMAIN_URL/recipe/user/email/verify/token" \
  -H "api-key: $ST_API_KEY" \
  -H "Content-Type: application/json" \
  -H "cdi-version: 5.4" \
  -d "{\"userId\":\"$USER_ID\",\"email\":\"$EMAIL\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))")

if [[ -z "$VERIFY_TOKEN" ]]; then
  echo "ERROR: Failed to generate verification token." >&2
  # Cleanup before exit
  RAILWAY_TOKEN="$APP_RAILWAY_TOKEN" npx @railway/cli domain delete \
    --service "$ST_SERVICE_ID" --yes "$DOMAIN_URL" 2>/dev/null || true
  RAILWAY_TOKEN="$APP_RAILWAY_TOKEN" npx @railway/cli variable delete \
    --service "$ST_SERVICE_ID" PORT 2>/dev/null || true
  exit 1
fi
echo "  Token generated"

echo "Step 6: Consuming token (marks email as verified)..."
VERIFY_RESULT=$(curl -s -X POST "https://$DOMAIN_URL/recipe/user/email/verify" \
  -H "api-key: $ST_API_KEY" \
  -H "Content-Type: application/json" \
  -H "cdi-version: 5.4" \
  -d "{\"method\":\"token\",\"token\":\"$VERIFY_TOKEN\"}")
echo "  Result: $VERIFY_RESULT"

echo "Step 7: Confirming verification status..."
IS_VERIFIED=$(curl -s "https://$DOMAIN_URL/recipe/user/email/verify?userId=$USER_ID&email=$EMAIL" \
  -H "api-key: $ST_API_KEY" -H "cdi-version: 5.4" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('isVerified', False))")
echo "  isVerified: $IS_VERIFIED"

# ── Cleanup ──────────────────────────────────────────────────────────────────
echo "Step 8: Removing temporary public domain..."
RAILWAY_TOKEN="$APP_RAILWAY_TOKEN" npx @railway/cli domain delete \
  --service "$ST_SERVICE_ID" --yes "$DOMAIN_URL" 2>/dev/null
echo "  Domain deleted"

echo "Step 9: Removing PORT variable..."
RAILWAY_TOKEN="$APP_RAILWAY_TOKEN" npx @railway/cli variable delete \
  --service "$ST_SERVICE_ID" PORT 2>/dev/null
echo "  PORT variable removed"

if [[ "$IS_VERIFIED" == "True" ]]; then
  echo ""
  echo "SUCCESS: studyhall-e2e-fixture@example.com is email-verified."
else
  echo ""
  echo "WARNING: Verification may not have succeeded. isVerified=$IS_VERIFIED"
  exit 1
fi
