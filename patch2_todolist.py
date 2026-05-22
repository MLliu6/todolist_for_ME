#!/usr/bin/env python3
"""
patch2_todolist.py - 在 index_patched.html 基础上再修两处
Usage: python3 patch2_todolist.py
Outputs: index_patched3.html
"""
import re, sys

SRC = "index_patched.html"
DST = "index_patched3.html"

with open(SRC, encoding="utf-8") as f:
    html = f.read()

# ==============================================================
# PATCH A: 重要日子 - 真正左右均分
#   问题：dm-grid 用 auto-fill minmax(220px,1fr) 导致每列里
#         卡片只有一张时仍然顶宽，整体看起来不对称。
#   方案：每列内 dm-grid 设为单列(1fr)，卡片全宽，
#         同时给 dm-split 加 padding 让两列有呼吸感。
# ==============================================================
OLD_DM_GRID_CSS = ".dm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:var(--space-4)}"
NEW_DM_GRID_CSS = ".dm-grid{display:grid;grid-template-columns:1fr;gap:var(--space-3)}"

# also try with spaces
if OLD_DM_GRID_CSS not in html:
    # Try flexible match
    pat = re.compile(r'\.dm-grid\s*\{[^}]*\}')
    m = pat.search(html)
    if m:
        html = html[:m.start()] + ".dm-grid{display:grid;grid-template-columns:1fr;gap:var(--space-3)}" + html[m.end():]
        print("Patch A done (regex): dm-grid single column per col")
    else:
        print("WARN: .dm-grid not found")
else:
    html = html.replace(OLD_DM_GRID_CSS, NEW_DM_GRID_CSS, 1)
    print("Patch A done: dm-grid single column per col")

# Add padding to dm-split so columns breathe
OLD_DM_SPLIT = ".dm-split{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-8);align-items:start}"
NEW_DM_SPLIT = ".dm-split{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);align-items:start;padding:0 var(--space-2)}"
if OLD_DM_SPLIT in html:
    html = html.replace(OLD_DM_SPLIT, NEW_DM_SPLIT, 1)
    print("Patch A2 done: dm-split padding added")
else:
    pat2 = re.compile(r'\.dm-split\s*\{[^}]*\}')
    m2 = pat2.search(html)
    if m2:
        html = html[:m2.start()] + ".dm-split{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);align-items:start;padding:0 var(--space-2)}" + html[m2.end():]
        print("Patch A2 done (regex): dm-split updated")
    else:
        print("WARN: .dm-split not found")

# ==============================================================
# PATCH B: 暗色模式背景 = 封面渐变
#   把 body 的 background 改成渐变，同时用 ::before 伪元素
#   把装饰光晕也带进来（纯 CSS，不依赖 canvas）
# ==============================================================

# 1. 修改 dark mode 的 --color-bg 和 --color-surface 让卡片能区分
OLD_DARK_BG = "--color-bg:#131218;"
NEW_DARK_BG = "--color-bg:transparent;"
if OLD_DARK_BG in html:
    html = html.replace(OLD_DARK_BG, NEW_DARK_BG, 1)
    print("Patch B1: --color-bg dark set to transparent")
else:
    # try without spaces
    pat_bg = re.compile(r'--color-bg\s*:\s*#131218')
    m_bg = pat_bg.search(html)
    if m_bg:
        html = html[:m_bg.start()] + "--color-bg:transparent" + html[m_bg.end():]
        print("Patch B1 (regex): --color-bg dark set to transparent")
    else:
        print("WARN: dark --color-bg not found, trying inline token block")

# 2. Add a CSS rule that sets the dark-mode body gradient background
DARK_BG_CSS = """
/* Dark mode: landing-style gradient background */
[data-theme="dark"] body {
  background: linear-gradient(135deg, #0d0b1a 0%, #1a1035 45%, #0f1e2e 100%) fixed;
  background-attachment: fixed;
}
[data-theme="dark"] body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(ellipse 60% 50% at 15% 20%, rgba(124,92,255,.14) 0%, transparent 70%),
    radial-gradient(ellipse 55% 45% at 85% 80%, rgba(56,189,248,.09) 0%, transparent 70%);
}
"""

# Insert before closing </style> of the main style block (first one)
STYLE_END = "</style>"
idx = html.index(STYLE_END)
html = html[:idx] + DARK_BG_CSS + html[idx:]
print("Patch B2: dark mode gradient body CSS injected")

# 3. make dark-mode cards/panels slightly transparent so gradient shows through
CARD_OVERLAY_CSS = """
/* Dark mode: semi-transparent surfaces so gradient peeks through */
[data-theme="dark"] .cal-shell,
[data-theme="dark"] .q-panel,
[data-theme="dark"] .dm-card,
[data-theme="dark"] .task-card,
[data-theme="dark"] .modal-box,
[data-theme="dark"] .drawer {
  background: rgba(28, 24, 40, 0.82);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
[data-theme="dark"] .top-nav {
  background: rgba(20, 17, 30, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
"""

# insert right after the previous injection
idx2 = html.index(STYLE_END, idx + 1)
html = html[:idx2] + CARD_OVERLAY_CSS + html[idx2:]
print("Patch B3: dark mode card transparency injected")

with open(DST, "w", encoding="utf-8") as f:
    f.write(html)

print(f"\nAll done! Output: {DST}")
print("Preview OK? Run:  cp index_patched3.html index.html")
