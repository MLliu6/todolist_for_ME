#!/usr/bin/env bash
set -euo pipefail

echo "== check: key action buttons exist =="
grep -q 'id="vault-toggle"' index.html
grep -q 'id="theme-toggle"' index.html

echo "== check: key lucide icon declarations exist =="
grep -q 'data-lucide="shield' index.html
grep -q 'data-lucide="moon\|data-lucide="sun' index.html
grep -q 'data-lucide="circle"' index.html
grep -q 'data-lucide="loader-circle"' index.html
grep -q 'data-lucide="circle-check"' index.html

echo "== check: icon fallback css exists =="
grep -q 'BEGIN lucide icon fallback' quadrant-theme.css
grep -q 'i\[data-lucide="shield"\]' quadrant-theme.css
grep -q 'i\[data-lucide="moon"\]' quadrant-theme.css
grep -q 'i\[data-lucide="sun"\]' quadrant-theme.css
grep -q 'i\[data-lucide="circle"\]' quadrant-theme.css
grep -q 'i\[data-lucide="loader-circle"\]' quadrant-theme.css
grep -q 'i\[data-lucide="circle-check"\]' quadrant-theme.css

echo "== check: timeline fallback blocks should not contain broken external enhancer =="
! grep -q 'timeline-enhance\|__timelineEnhanced' index.html quadrant-theme.css

echo "== check: passed =="
