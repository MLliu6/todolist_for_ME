#!/usr/bin/env bash
set -euo pipefail

echo "== check: required files =="
test -f index.html
test -f .nojekyll
test -f docs/PRODUCT.md
test -f docs/DEPLOYMENT.md

echo "== check: no temporary script dir =="
if [ -d .tmp_inline_scripts ]; then
  echo "ERROR: .tmp_inline_scripts should not be committed."
  exit 1
fi

echo "== check: SEO/product meta =="
grep -q 'name="description"' index.html
grep -q 'property="og:title"' index.html
grep -q 'property="og:description"' index.html

echo "== check: inline JavaScript syntax =="
rm -rf .tmp_inline_scripts
mkdir -p .tmp_inline_scripts

python3 <<'PY'
from pathlib import Path
import re

html = Path("index.html").read_text(encoding="utf-8")
scripts = re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", html, flags=re.S | re.I)

for i, code in enumerate(scripts):
    Path(f".tmp_inline_scripts/script_{i}.js").write_text(code, encoding="utf-8")

print(f"extracted {len(scripts)} inline scripts")
PY

for f in .tmp_inline_scripts/*.js; do
  node --check "$f"
done

rm -rf .tmp_inline_scripts

echo "== check: passed =="
