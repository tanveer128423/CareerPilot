#!/usr/bin/env bash
# Phase 2 smoke test — POST /api/parse text extraction.
# Builds a real DOCX on the fly, then checks the happy path + error cases.
# Usage:  bash scripts/smoke-phase2.sh   (server must already be running)
set -uo pipefail

BASE="${BASE:-http://localhost:8080}"
DOCX_MIME="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
TMP="$(mktemp -d)"
DOCX="$TMP/resume.docx"
PNG="$TMP/photo.png"
PASS=0; FAIL=0

green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
check() { if [[ "$3" == "$2" ]]; then green "PASS  $1 (got $3)"; PASS=$((PASS+1)); else red "FAIL  $1 (expected $2, got $3)"; FAIL=$((FAIL+1)); fi; }

# Build a minimal valid DOCX.
python3 - "$DOCX" <<'PY'
import sys, zipfile
path = sys.argv[1]
text = "Aisha Khan Backend Developer. Skills: Node.js, Express.js, MongoDB, JavaScript, Git, REST APIs. Project: E-commerce API."
ct='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
doc='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>'+text+'</w:t></w:r></w:p></w:body></w:document>'
z=zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED)
z.writestr('[Content_Types].xml',ct); z.writestr('_rels/.rels',rels); z.writestr('word/document.xml',doc); z.close()
PY
echo "fake png content not a real image" > "$PNG"

echo "== CareerPilot Phase 2 smoke test against $BASE =="

# 1. Happy path DOCX -> 200 with rawResumeText
body=$(curl -s -X POST "$BASE/api/parse" -F "file=@$DOCX;type=$DOCX_MIME" -F "targetRole=Backend Developer")
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/parse" -F "file=@$DOCX;type=$DOCX_MIME" -F "targetRole=Backend Developer")
check "valid DOCX status" "200" "$code"
echo "$body" | grep -q '"rawResumeText"' && green "PASS  response has rawResumeText" && PASS=$((PASS+1)) || { red "FAIL  no rawResumeText"; FAIL=$((FAIL+1)); }
echo "$body" | grep -q 'Backend Developer' && green "PASS  extracted text present" && PASS=$((PASS+1)) || { red "FAIL  text not extracted"; FAIL=$((FAIL+1)); }

# 2. Missing file -> 400 MISSING_FILE
code=$(curl -s -o /tmp/p2a.json -w "%{http_code}" -X POST "$BASE/api/parse" -F "targetRole=Backend Developer")
check "missing file status" "400" "$code"
grep -q '"MISSING_FILE"' /tmp/p2a.json && green "PASS  code MISSING_FILE" && PASS=$((PASS+1)) || { red "FAIL  wrong code"; FAIL=$((FAIL+1)); }

# 3. Invalid role -> 400 INVALID_ROLE
code=$(curl -s -o /tmp/p2b.json -w "%{http_code}" -X POST "$BASE/api/parse" -F "file=@$DOCX;type=$DOCX_MIME" -F "targetRole=Astronaut")
check "invalid role status" "400" "$code"
grep -q '"INVALID_ROLE"' /tmp/p2b.json && green "PASS  code INVALID_ROLE" && PASS=$((PASS+1)) || { red "FAIL  wrong code"; FAIL=$((FAIL+1)); }

# 4. Unsupported type -> 415
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/parse" -F "file=@$PNG;type=image/png" -F "targetRole=Backend Developer")
check "unsupported type status" "415" "$code"

rm -rf "$TMP"
echo "------------------------------------------"
echo "Passed: $PASS   Failed: $FAIL"
[[ "$FAIL" -eq 0 ]] && green "ALL PHASE 2 CHECKS PASSED ✅" || { red "SOME CHECKS FAILED ❌"; exit 1; }
