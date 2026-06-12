#!/usr/bin/env bash
# Phase 6 smoke test — /api/analyze returns a schema-valid full AnalysisResult.
# Usage:  bash scripts/smoke-phase6.sh   (server must already be running)
set -uo pipefail

BASE="${BASE:-http://localhost:8080}"
PASS=0; FAIL=0
green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
ok()    { green "PASS  $1"; PASS=$((PASS+1)); }
no()    { red   "FAIL  $1"; FAIL=$((FAIL+1)); }
post()  { curl -s -X POST "$BASE/api/analyze" -H "Content-Type: application/json" -d "$1"; }

echo "== CareerPilot Phase 6 smoke test against $BASE =="

BILAL='{"targetRole":"Backend Developer","structuredResume":{"skills":["JavaScript","Git"],"projects":[],"experience":[],"education":[]}}'
AISHA='{"targetRole":"Backend Developer","structuredResume":{"skills":["JavaScript","Node.js","Express.js","REST APIs","MongoDB","Git"],"projects":[],"experience":[],"education":[]}}'

b=$(post "$BILAL")

# Full AnalysisResult: exactly 5 top-level keys.
keys=$(echo "$b" | python3 -c "import sys,json;print(','.join(sorted(json.load(sys.stdin).keys())))")
[[ "$keys" == "matchObject,readiness,resumeHealth,roadmap,targetRole" ]] && ok "5 top-level keys present (no extras)" || no "top-level keys: $keys"

# Roadmap present and every gap in missing.
gapsok=$(echo "$b" | python3 -c "
import sys,json
d=json.load(sys.stdin); miss=d['matchObject']['missing']
rm=d['roadmap']
print('yes' if rm and all(m['gapAddressed'] in miss for m in rm) else 'no')")
[[ "$gapsok" == "yes" ]] && ok "every roadmap gap is in matchObject.missing" || no "roadmap gap not in missing"

# <= 6 milestones, first phase Week 1-4.
phaseok=$(echo "$b" | python3 -c "
import sys,json
rm=json.load(sys.stdin)['roadmap']
print('yes' if len(rm)<=6 and rm[0]['phase']=='Week 1-4' else 'no')")
[[ "$phaseok" == "yes" ]] && ok "<=6 milestones, first phase Week 1-4" || no "roadmap phase layout wrong"

# Determinism.
b2=$(post "$BILAL")
[[ "$b" == "$b2" ]] && ok "deterministic (identical AnalysisResult)" || no "non-deterministic output"

# No-missing => empty roadmap.
a=$(post "$AISHA")
emptyrm=$(echo "$a" | python3 -c "import sys,json;d=json.load(sys.stdin);print('yes' if d['matchObject']['missing']==[] and d['roadmap']==[] else 'no')")
[[ "$emptyrm" == "yes" ]] && ok "no missing skills => empty roadmap" || no "expected empty roadmap"

echo "--- Bilal roadmap ---"
echo "$b" | python3 -c "import sys,json;[print(' ',m['phase'],'->',m['skill']) for m in json.load(sys.stdin)['roadmap']]"

echo "------------------------------------------"
echo "Passed: $PASS   Failed: $FAIL"
[[ "$FAIL" -eq 0 ]] && green "ALL PHASE 6 CHECKS PASSED ✅" || { red "SOME CHECKS FAILED ❌"; exit 1; }
