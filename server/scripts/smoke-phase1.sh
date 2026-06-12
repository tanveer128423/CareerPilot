#!/usr/bin/env bash
# Phase 1 smoke test — verifies the backend foundation endpoints.
# Usage:  bash scripts/smoke-phase1.sh   (server must already be running)
set -uo pipefail

BASE="${BASE:-http://localhost:8080}"
PASS=0
FAIL=0

green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }

check() {
  local name="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    green "PASS  $name (got $actual)"; PASS=$((PASS+1))
  else
    red   "FAIL  $name (expected $expected, got $actual)"; FAIL=$((FAIL+1))
  fi
}

echo "== CareerPilot Phase 1 smoke test against $BASE =="

# 1. Health endpoint returns 200
code=$(curl -s -o /tmp/cp_health.json -w "%{http_code}" "$BASE/api/health")
check "GET /api/health status" "200" "$code"
grep -q '"ok":true' /tmp/cp_health.json && green "PASS  health body has ok:true" && PASS=$((PASS+1)) \
  || { red "FAIL  health body missing ok:true"; FAIL=$((FAIL+1)); }

# 2. Roles endpoint returns 200 with 6 roles
code=$(curl -s -o /tmp/cp_roles.json -w "%{http_code}" "$BASE/api/roles")
check "GET /api/roles status" "200" "$code"
count=$(grep -o '"name"' /tmp/cp_roles.json | wc -l | tr -d ' ')
check "roles count" "6" "$count"

# 3. Unknown route returns 404 + error envelope
code=$(curl -s -o /tmp/cp_404.json -w "%{http_code}" "$BASE/api/does-not-exist")
check "unknown route status" "404" "$code"
grep -q '"error"' /tmp/cp_404.json && green "PASS  404 uses error envelope" && PASS=$((PASS+1)) \
  || { red "FAIL  404 missing error envelope"; FAIL=$((FAIL+1)); }

# 4. X-Request-Id header present
hdr=$(curl -s -D - -o /dev/null "$BASE/api/health" | grep -ic "^x-request-id:" | tr -d ' ')
check "X-Request-Id header present" "1" "$hdr"

# 5. Body > 1MB rejected with 413
code=$(head -c 1100000 /dev/zero | tr '\0' 'a' \
  | curl -s -X POST -H "Content-Type: application/json" --data-binary @- \
    -o /dev/null -w "%{http_code}" "$BASE/api/roles")
check "oversized body rejected" "413" "$code"

echo "------------------------------------------"
echo "Passed: $PASS   Failed: $FAIL"
[[ "$FAIL" -eq 0 ]] && green "ALL PHASE 1 CHECKS PASSED ✅" || { red "SOME CHECKS FAILED ❌"; exit 1; }
