#!/usr/bin/env bash
# Phase 3 smoke test — POST /api/parse returns a schema-valid StructuredResume.
# Builds a properly sectioned multi-paragraph DOCX, then checks structure + skills.
# Usage:  bash scripts/smoke-phase3.sh   (server must already be running)
set -uo pipefail

BASE="${BASE:-http://localhost:8080}"
DOCX_MIME="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
TMP="$(mktemp -d)"
DOCX="$TMP/resume.docx"
PASS=0; FAIL=0

green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
ok()    { green "PASS  $1"; PASS=$((PASS+1)); }
no()    { red   "FAIL  $1"; FAIL=$((FAIL+1)); }

# Build a multi-paragraph DOCX (one <w:p> per resume line).
python3 - "$DOCX" <<'PY'
import sys, zipfile
path = sys.argv[1]
lines = [
  "AISHA KHAN", "Backend Developer", "",
  "SKILLS", "JavaScript, Node, Express, React, Git, MongoDB", "",
  "PROJECTS", "E-commerce API - Built a REST API with Node and Express for products and orders.", "",
  "EXPERIENCE", "Software Intern at TechCorp (3 months) - Built internal tooling and REST endpoints.", "",
  "EDUCATION", "BS Computer Science, State University, 2026",
]
paras = "".join("<w:p><w:r><w:t xml:space=\"preserve\">%s</w:t></w:r></w:p>" % l for l in lines)
ct='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
doc='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+paras+'</w:body></w:document>'
z=zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED)
z.writestr('[Content_Types].xml',ct); z.writestr('_rels/.rels',rels); z.writestr('word/document.xml',doc); z.close()
PY

echo "== CareerPilot Phase 3 smoke test against $BASE =="

body=$(curl -s -X POST "$BASE/api/parse" -F "file=@$DOCX;type=$DOCX_MIME" -F "targetRole=Backend Developer")
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/parse" -F "file=@$DOCX;type=$DOCX_MIME" -F "targetRole=Backend Developer")

[[ "$code" == "200" ]] && ok "status 200 (got $code)" || no "status (expected 200, got $code)"
echo "$body" | grep -q '"structuredResume"' && ok "structuredResume present" || no "structuredResume missing"
echo "$body" | grep -q '"skills"' && ok "skills present" || no "skills missing"
echo "$body" | grep -q 'Node.js' && ok "skill normalized: Node.js" || no "Node.js not normalized"
echo "$body" | grep -q 'Express.js' && ok "skill normalized: Express.js" || no "Express.js not normalized"
echo "$body" | grep -q '"rawResumeText"' && ok "rawResumeText sibling present" || no "rawResumeText missing"
# rawResumeText must NOT be nested inside structuredResume.
nested=$(echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); print('yes' if 'rawResumeText' in d.get('structuredResume',{}) else 'no')")
[[ "$nested" == "no" ]] && ok "rawResumeText is a sibling (not nested)" || no "rawResumeText nested inside structuredResume"

echo "--- parsed structuredResume ---"
echo "$body" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['structuredResume'], indent=1))"

rm -rf "$TMP"
echo "------------------------------------------"
echo "Passed: $PASS   Failed: $FAIL"
[[ "$FAIL" -eq 0 ]] && green "ALL PHASE 3 CHECKS PASSED ✅" || { red "SOME CHECKS FAILED ❌"; exit 1; }
