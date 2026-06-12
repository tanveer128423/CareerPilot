#!/usr/bin/env bash
# Phase 7 smoke test — POST /api/mentor (grounded, non-streaming).
# Validation paths need NO Gemini key. The live answer runs only if the server
# has GEMINI_API_KEY configured (otherwise that part is skipped, not failed).
# Usage:  bash scripts/smoke-phase7.sh   (server must already be running)
set -uo pipefail

BASE="${BASE:-http://localhost:8080}"
PASS=0; FAIL=0
green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
yellow(){ printf "\033[33m%s\033[0m\n" "$1"; }
ok()    { green "PASS  $1"; PASS=$((PASS+1)); }
no()    { red   "FAIL  $1"; FAIL=$((FAIL+1)); }

GROUNDING='{"targetRole":"Backend Developer","structuredResume":{"skills":["JavaScript","Git"],"projects":[],"experience":[],"education":[]},"matchObject":{"role":"Backend Developer","requiredSkills":["JavaScript","Node.js","Express.js","REST APIs","MongoDB","Git"],"niceToHaveSkills":[],"have":["JavaScript","Git"],"missing":["Node.js","Express.js","REST APIs","MongoDB"],"matchedNiceToHave":[],"coveragePercentage":33},"rawResumeText":"BILAL - Aspiring Backend Developer"}'

code() { curl -s -o /tmp/p7.json -w "%{http_code}" -X POST "$BASE/api/mentor" -H "Content-Type: application/json" -d "$1"; }
errcode() { python3 -c "import json;print(json.load(open('/tmp/p7.json')).get('error',{}).get('code',''))" 2>/dev/null; }

echo "== CareerPilot Phase 7 smoke test against $BASE =="

# --- Validation paths (no Gemini key required) ---
c=$(code "{\"question\":\"\",\"history\":[],\"grounding\":$GROUNDING}")
[[ "$c" == "400" && "$(errcode)" == "VALIDATION_ERROR" ]] && ok "empty question -> 400 VALIDATION_ERROR" || no "empty question ($c/$(errcode))"

LONGQ=$(python3 -c "print('x'*501)")
c=$(code "{\"question\":\"$LONGQ\",\"history\":[],\"grounding\":$GROUNDING}")
[[ "$c" == "400" && "$(errcode)" == "VALIDATION_ERROR" ]] && ok "oversized question -> 400 VALIDATION_ERROR" || no "oversized question ($c/$(errcode))"

c=$(code '{"question":"What next?"}')
[[ "$c" == "400" && "$(errcode)" == "VALIDATION_ERROR" ]] && ok "missing grounding -> 400 VALIDATION_ERROR" || no "missing grounding ($c/$(errcode))"

BADROLE=$(echo "$GROUNDING" | sed 's/Backend Developer/Astronaut/g')
c=$(code "{\"question\":\"What next?\",\"grounding\":$BADROLE}")
[[ "$c" == "400" && "$(errcode)" == "INVALID_ROLE" ]] && ok "bad role -> 400 INVALID_ROLE" || no "bad role ($c/$(errcode))"

c=$(code "{\"question\":\"What next?\",\"history\":[{\"role\":\"robot\",\"text\":\"hi\"}],\"grounding\":$GROUNDING}")
[[ "$c" == "400" && "$(errcode)" == "VALIDATION_ERROR" ]] && ok "bad history -> 400 VALIDATION_ERROR" || no "bad history ($c/$(errcode))"

# --- Live answer (only if Gemini is configured) ---
gem=$(curl -s "$BASE/api/health" | python3 -c "import sys,json;print(json.load(sys.stdin)['geminiConfigured'])" 2>/dev/null)
if [[ "$gem" == "True" ]]; then
  c=$(code "{\"question\":\"What should I learn next?\",\"history\":[],\"grounding\":$GROUNDING}")
  [[ "$c" == "200" ]] && ok "live mentor answer -> 200" || no "live mentor answer ($c)"
  hasAnswer=$(python3 -c "import json;d=json.load(open('/tmp/p7.json'));print('yes' if isinstance(d.get('answer'),str) and d['answer'] else 'no')" 2>/dev/null)
  [[ "$hasAnswer" == "yes" ]] && ok "answer is a non-empty string" || no "no answer field"
  echo "--- mentor answer ---"; python3 -c "import json;print(json.load(open('/tmp/p7.json'))['answer'])" 2>/dev/null
else
  yellow "SKIP  live mentor answer (GEMINI_API_KEY not configured) — validation paths verified above"
fi

echo "------------------------------------------"
echo "Passed: $PASS   Failed: $FAIL"
[[ "$FAIL" -eq 0 ]] && green "ALL PHASE 7 CHECKS PASSED ✅" || { red "SOME CHECKS FAILED ❌"; exit 1; }
