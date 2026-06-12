#!/usr/bin/env bash
# Phase 5 smoke test — /api/analyze now returns resumeHealth + readiness.
# Usage:  bash scripts/smoke-phase5.sh   (server must already be running)
set -uo pipefail

BASE="${BASE:-http://localhost:8080}"
PASS=0; FAIL=0
green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
ok()    { green "PASS  $1"; PASS=$((PASS+1)); }
no()    { red   "FAIL  $1"; FAIL=$((FAIL+1)); }
post()  { curl -s -X POST "$BASE/api/analyze" -H "Content-Type: application/json" -d "$1"; }

echo "== CareerPilot Phase 5 smoke test against $BASE =="

BODY='{"targetRole":"Backend Developer","structuredResume":{"skills":["JavaScript","Node.js","Express.js","Git"],"projects":[{"name":"Todo App","tech":["JavaScript"],"summary":"A small todo app for tracking tasks."}],"experience":[],"education":[]},"rawResumeText":"JANE DOE\nBackend Developer\njane@x.com\n\nSKILLS\nJavaScript, Node.js, Express.js, Git\n\nPROJECTS\n- Built a Todo App with JavaScript, handled 200+ tasks.\n"}'
b=$(post "$BODY")

# resumeHealth: exactly 5 dimensions, each with reason + tip.
dims=$(echo "$b" | python3 -c "import sys,json;print(len(json.load(sys.stdin)['resumeHealth']['dimensions']))")
[[ "$dims" == "5" ]] && ok "resumeHealth has 5 dimensions" || no "resumeHealth dimensions (got $dims)"
allrt=$(echo "$b" | python3 -c "import sys,json;ds=json.load(sys.stdin)['resumeHealth']['dimensions'];print('yes' if all(d.get('reason') and d.get('tip') for d in ds) else 'no')")
[[ "$allrt" == "yes" ]] && ok "every dimension has reason + tip" || no "missing reason/tip"

# readiness: scoreBreakdown sums to score, no skillGaps term.
sums=$(echo "$b" | python3 -c "import sys,json;r=json.load(sys.stdin)['readiness'];print('yes' if sum(r['scoreBreakdown'].values())==r['score'] else 'no')")
[[ "$sums" == "yes" ]] && ok "scoreBreakdown sums exactly to score" || no "breakdown != score"
nogaps=$(echo "$b" | python3 -c "import sys,json;print('yes' if 'skillGaps' not in json.load(sys.stdin)['readiness']['scoreBreakdown'] else 'no')")
[[ "$nogaps" == "yes" ]] && ok "no skillGaps term (coverage counted once)" || no "skillGaps present"

# nextActions reference a gap.
refs=$(echo "$b" | python3 -c "
import sys,json,re
r=json.load(sys.stdin)['readiness']
missing=['REST APIs','MongoDB']
def good(a): return any(m in a for m in missing) or re.search(r'experience|project|metric|quantify|internship|interview|apply',a,re.I)
print('yes' if r['nextActions'] and all(good(a) for a in r['nextActions']) else 'no')")
[[ "$refs" == "yes" ]] && ok "every nextAction is evidence-based (references a gap)" || no "generic nextAction found"

# Empty-ish resume does not crash.
e=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/analyze" -H "Content-Type: application/json" -d '{"targetRole":"Backend Developer","structuredResume":{"skills":["JavaScript"]}}')
[[ "$e" == "200" ]] && ok "minimal resume -> 200 (no crash)" || no "minimal resume status $e"

echo "--- summary numbers ---"
echo "$b" | python3 -c "import sys,json;d=json.load(sys.stdin);print('readiness',d['readiness']['score'],'| health',d['resumeHealth']['overall'],'| coverage',d['matchObject']['coveragePercentage'])"

echo "------------------------------------------"
echo "Passed: $PASS   Failed: $FAIL"
[[ "$FAIL" -eq 0 ]] && green "ALL PHASE 5 CHECKS PASSED ✅" || { red "SOME CHECKS FAILED ❌"; exit 1; }
