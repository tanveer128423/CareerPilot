#!/usr/bin/env bash
# Phase 4 smoke test — POST /api/analyze returns a deterministic matchObject.
# Usage:  bash scripts/smoke-phase4.sh   (server must already be running)
set -uo pipefail

BASE="${BASE:-http://localhost:8080}"
PASS=0; FAIL=0
green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
ok()    { green "PASS  $1"; PASS=$((PASS+1)); }
no()    { red   "FAIL  $1"; FAIL=$((FAIL+1)); }

post() { curl -s -X POST "$BASE/api/analyze" -H "Content-Type: application/json" -d "$1"; }
code() { curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/analyze" -H "Content-Type: application/json" -d "$1"; }

echo "== CareerPilot Phase 4 smoke test against $BASE =="

# 1. Aisha (strong backend) — all 6 skills -> coverage 100, no missing.
AISHA='{"targetRole":"Backend Developer","structuredResume":{"skills":["JavaScript","Node.js","Express.js","REST APIs","MongoDB","Git"],"projects":[],"experience":[],"education":[]}}'
b=$(post "$AISHA")
cov=$(echo "$b" | python3 -c "import sys,json;print(json.load(sys.stdin)['matchObject']['coveragePercentage'])")
mis=$(echo "$b" | python3 -c "import sys,json;print(len(json.load(sys.stdin)['matchObject']['missing']))")
[[ "$cov" == "100" ]] && ok "Aisha coverage 100 (got $cov)" || no "Aisha coverage (expected 100, got $cov)"
[[ "$mis" == "0" ]] && ok "Aisha missing == 0" || no "Aisha missing (expected 0, got $mis)"

# 2. Bilal (weak backend) — missing Node.js, Express.js, REST APIs, MongoDB.
BILAL='{"targetRole":"Backend Developer","structuredResume":{"skills":["JavaScript","Git","HTML","CSS"],"projects":[],"experience":[],"education":[]}}'
b=$(post "$BILAL")
echo "$b" | grep -q '"Node.js"' && ok "Bilal missing includes Node.js" || no "Bilal missing Node.js"
echo "$b" | grep -q '"MongoDB"' && ok "Bilal missing includes MongoDB" || no "Bilal missing MongoDB"

# 3. Invariant: have ∪ missing == required, disjoint.
inv=$(echo "$b" | python3 -c "
import sys,json
m=json.load(sys.stdin)['matchObject']
union=sorted(m['have']+m['missing']); req=sorted(m['requiredSkills'])
disjoint=set(m['have']).isdisjoint(set(m['missing']))
print('ok' if union==req and disjoint else 'bad')")
[[ "$inv" == "ok" ]] && ok "invariant have∪missing==required, disjoint" || no "invariant broken"

# 4. Determinism: two identical requests => identical matchObject.
a1=$(post "$BILAL"); a2=$(post "$BILAL")
[[ "$a1" == "$a2" ]] && ok "deterministic (identical output)" || no "non-deterministic output"

# 5. Alias resolution: nodejs / Express JS resolve to canonical.
ALIAS='{"targetRole":"Backend Developer","structuredResume":{"skills":["nodejs","Express JS","git","javascript"],"projects":[],"experience":[],"education":[]}}'
b=$(post "$ALIAS")
echo "$b" | python3 -c "import sys,json;h=json.load(sys.stdin)['matchObject']['have'];import sys as s;s.exit(0 if 'Node.js' in h and 'Express.js' in h else 1)" \
  && ok "aliases resolve (nodejs->Node.js, Express JS->Express.js)" || no "alias resolution failed"

# 6. Errors.
[[ "$(code '{"targetRole":"Astronaut","structuredResume":{"skills":["JavaScript"]}}')" == "400" ]] && ok "invalid role -> 400" || no "invalid role status"
[[ "$(code '{"targetRole":"Backend Developer","structuredResume":{"skills":[]}}')" == "400" ]] && ok "empty skills -> 400" || no "empty skills status"

echo "------------------------------------------"
echo "Passed: $PASS   Failed: $FAIL"
[[ "$FAIL" -eq 0 ]] && green "ALL PHASE 4 CHECKS PASSED ✅" || { red "SOME CHECKS FAILED ❌"; exit 1; }
