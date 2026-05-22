#!/usr/bin/env python3
"""
patch_todolist.py - 3 enhancements in one run
Usage: python3 patch_todolist.py
Outputs: index_patched.html
"""
import re, sys

SRC = "index.html"
DST = "index_patched.html"

with open(SRC, encoding="utf-8") as f:
    html = f.read()

# ==============================================================
# PATCH 1: redesign landing page
# ==============================================================
OLD_LANDING = re.compile(r'<!-- LANDING PAGE -->.*?<!-- NAV -->', re.DOTALL)

NEW_LANDING = (
'<!-- LANDING PAGE -->\n'
'<div id="landing-page" style="position:fixed;inset:0;z-index:9000;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;">\n'
'  <div style="position:absolute;inset:0;background:linear-gradient(135deg,#0d0b1a 0%,#1a1035 40%,#0f1e2e 100%);"></div>\n'
'  <div style="position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(124,92,255,.22) 0%,transparent 70%);top:-120px;left:-100px;pointer-events:none;animation:lpOrb1 8s ease-in-out infinite alternate;"></div>\n'
'  <div style="position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(56,189,248,.15) 0%,transparent 70%);bottom:-80px;right:-60px;pointer-events:none;animation:lpOrb2 10s ease-in-out infinite alternate;"></div>\n'
'  <canvas id="landing-particles" style="position:absolute;inset:0;pointer-events:none;opacity:0.6"></canvas>\n'
'  <div style="position:relative;z-index:1;text-align:center;padding:48px 32px;max-width:640px;width:100%">\n'
'    <div style="display:inline-flex;align-items:center;justify-content:center;width:80px;height:80px;border-radius:24px;background:linear-gradient(135deg,#7c5cff,#38bdf8);margin-bottom:32px;box-shadow:0 0 40px rgba(124,92,255,.5),0 0 80px rgba(56,189,248,.2);">\n'
'      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">\n'
'        <path d="M11 20l6 6L29 13" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>\n'
'        <rect x="4" y="9" width="7" height="7" rx="2.5" fill="rgba(255,255,255,.3)"/>\n'
'        <rect x="4" y="24" width="7" height="7" rx="2.5" fill="rgba(255,255,255,.18)"/>\n'
'      </svg>\n'
'    </div>\n'
'    <p style="font-family:\'Georgia\',\'Times New Roman\',serif;font-size:0.78rem;letter-spacing:.22em;text-transform:uppercase;color:rgba(167,139,250,.7);margin-bottom:12px;font-style:italic">Personal Planner</p>\n'
'    <h1 id="landing-title" style="font-family:\'Georgia\',\'Times New Roman\',serif;font-size:clamp(2.6rem,6vw,4rem);font-weight:700;letter-spacing:-.01em;color:#fff;line-height:1.1;margin-bottom:0;font-style:italic">My Todo</h1>\n'
'    <div style="display:flex;align-items:center;gap:12px;justify-content:center;margin:20px auto 24px;">\n'
'      <div style="height:1px;width:48px;background:linear-gradient(90deg,transparent,rgba(167,139,250,.5));"></div>\n'
'      <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="rgba(167,139,250,.6)"/></svg>\n'
'      <div style="height:1px;width:48px;background:linear-gradient(90deg,rgba(167,139,250,.5),transparent);"></div>\n'
'    </div>\n'
'    <p style="font-family:\'Georgia\',serif;font-size:clamp(0.92rem,2vw,1.05rem);color:rgba(212,210,224,.6);margin-bottom:44px;line-height:1.85;letter-spacing:.01em;font-style:italic">Put every important thing in its rightful place.</p>\n'
'    <button id="landing-enter-btn" aria-label="Start" style="position:relative;display:inline-flex;align-items:center;gap:12px;padding:16px 40px;border-radius:9999px;background:linear-gradient(135deg,#7c5cff,#5b8af6);color:#fff;font-size:1rem;font-weight:600;border:none;cursor:pointer;box-shadow:0 4px 24px rgba(124,92,255,.5),inset 0 0 0 1px rgba(255,255,255,.12);overflow:hidden;transition:transform .2s,box-shadow .2s;letter-spacing:.06em">\n'
'      <span style="position:relative;z-index:1">Start</span>\n'
'      <svg id="landing-arrow" style="position:relative;z-index:1;width:18px;height:18px;transition:transform .2s" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h12M10 4l6 6-6 6"/></svg>\n'
'      <span id="landing-shine" style="position:absolute;inset:0;background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.22) 50%,transparent 62%);transform:translateX(-120%);pointer-events:none;"></span>\n'
'    </button>\n'
'    <p style="margin-top:28px;font-size:0.7rem;color:rgba(255,255,255,.25);letter-spacing:.12em;text-transform:uppercase">Press <kbd style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:4px;padding:1px 7px;font-size:.65rem;letter-spacing:0">Enter</kbd> to continue</p>\n'
'  </div>\n'
'</div>\n'
'<style>\n'
'@keyframes lpOrb1{from{transform:translate(0,0) scale(1)}to{transform:translate(40px,30px) scale(1.12)}}\n'
'@keyframes lpOrb2{from{transform:translate(0,0) scale(1)}to{transform:translate(-30px,20px) scale(1.08)}}\n'
'</style>\n\n'
'<!-- NAV -->'
)

if not OLD_LANDING.search(html):
    print("ERROR: landing block not found"); sys.exit(1)
html = OLD_LANDING.sub(NEW_LANDING, html)
print("Patch 1 done: landing redesigned")

# ==============================================================
# PATCH 2: Home FAB
# ==============================================================
HOME_BTN = (
'<!-- HOME FAB -->\n'
'<button id="home-fab" aria-label="Back to home" style="position:fixed;right:24px;bottom:24px;z-index:8500;width:48px;height:48px;border-radius:50%;background:var(--color-primary);color:#fff;border:none;cursor:pointer;display:none;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(124,92,255,.45);transition:transform .2s,box-shadow .2s,opacity .3s;opacity:0;">\n'
'  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\n'
'    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>\n'
'    <polyline points="9 21 9 12 15 12 15 21"/>\n'
'  </svg>\n'
'</button>\n\n'
)

if '<!-- TOAST -->' in html:
    html = html.replace('<!-- TOAST -->', HOME_BTN + '<!-- TOAST -->', 1)
    print("Patch 2 done: home FAB inserted")
else:
    print("WARN: TOAST marker not found")

# ==============================================================
# PATCH 3a: DM CSS - two col + centered titles
# ==============================================================
CSS_MARKER = ".dm-section-title{"
if CSS_MARKER in html:
    start = html.index(CSS_MARKER)
    end = html.index("\n.dm-grid{", start)
    NEW_DM_CSS = (
'.dm-split{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-8);align-items:start}\n'
'@media(max-width:700px){.dm-split{grid-template-columns:1fr;gap:var(--space-6)}}\n'
'.dm-col{display:flex;flex-direction:column}\n'
".dm-section-title{font-family:'Georgia','Times New Roman',serif;font-size:clamp(.95rem,1.6vw,1.15rem);font-weight:400;letter-spacing:.15em;color:var(--color-text-faint);text-transform:uppercase;font-style:italic;text-align:center;margin-bottom:var(--space-5);padding-bottom:var(--space-3);border-bottom:1px solid var(--color-divider);position:relative}\n"
'.dm-section-title::before,.dm-section-title::after{content:"";display:inline-block;width:20px;height:1px;background:var(--color-primary);opacity:.4;vertical-align:middle;margin:0 8px}\n'
'.dm-section{margin-bottom:var(--space-8)}\n'
)
    html = html[:start] + NEW_DM_CSS + html[end:]
    print("Patch 3a done: DM CSS two-col + titles")
else:
    print("WARN: .dm-section-title not found")

# ==============================================================
# PATCH 3b: DM JS render - two columns
# ==============================================================
JS_MARKER = "    var h='';\n    if(upcoming.length){"
if JS_MARKER in html:
    start = html.index(JS_MARKER)
    end_m = "    list.innerHTML=h;\n"
    end = html.index(end_m, start) + len(end_m)
    NEW_DM_JS = (
'    var h=\'<div class="dm-split">\';\n'
'    h+=\'<div class="dm-col"><div class="dm-section-title">Upcoming</div>\';\n'
'    if(upcoming.length){\n'
'      h+=\'<div class="dm-grid">\';\n'
'      upcoming.forEach(function(item){ h+=renderCard(item); });\n'
"      h+='</div>';\n"
'    } else {\n'
"      h+='<div style=\"color:var(--color-text-faint);font-size:var(--text-xs);text-align:center;padding:var(--space-10) 0;font-style:italic;font-family:Georgia,serif\">Nothing yet</div>';\n"
'    }\n'
"    h+='</div>';\n"
'    h+=\'<div class="dm-col"><div class="dm-section-title">Memories</div>\';\n'
'    if(past.length){\n'
'      h+=\'<div class="dm-grid">\';\n'
'      past.forEach(function(item){ h+=renderCard(item); });\n'
"      h+='</div>';\n"
'    } else {\n'
"      h+='<div style=\"color:var(--color-text-faint);font-size:var(--text-xs);text-align:center;padding:var(--space-10) 0;font-style:italic;font-family:Georgia,serif\">Nothing yet</div>';\n"
'    }\n'
"    h+='</div>';\n"
"    h+='</div>';\n"
'    list.innerHTML=h;\n'
)
    html = html[:start] + NEW_DM_JS + html[end:]
    print("Patch 3b done: DM render two-col")
else:
    print("WARN: DM JS marker not found")

# ==============================================================
# PATCH 4: FAB JS + particle fix
# ==============================================================
OLD_BOOT = "  setTimeout(function(){ if(window.lucide) lucide.createIcons(); }, 200);\n});"
NEW_BOOT = (
"  setTimeout(function(){ if(window.lucide) lucide.createIcons(); }, 200);\n\n"
"  // Home FAB logic\n"
"  (function(){\n"
"    var fab=document.getElementById('home-fab'); if(!fab) return;\n"
"    function showFab(){ fab.style.display='flex'; setTimeout(function(){ fab.style.opacity='1'; },30); }\n"
"    var enterBtn=document.getElementById('landing-enter-btn');\n"
"    if(enterBtn) enterBtn.addEventListener('click',function(){ setTimeout(showFab,550); });\n"
"    document.addEventListener('keydown',function onLK(e){\n"
"      if(e.key==='Enter'){ setTimeout(showFab,550); document.removeEventListener('keydown',onLK); }\n"
"    });\n"
"    fab.addEventListener('mouseenter',function(){ fab.style.transform='scale(1.12) translateY(-2px)'; fab.style.boxShadow='0 8px 28px rgba(124,92,255,.65)'; });\n"
"    fab.addEventListener('mouseleave',function(){ fab.style.transform=''; fab.style.boxShadow='0 4px 16px rgba(124,92,255,.45)'; });\n"
"    fab.addEventListener('click',function(){\n"
"      var lp=document.getElementById('landing-page'); if(!lp) return;\n"
"      lp.style.transition='opacity .4s ease,transform .4s ease';\n"
"      lp.style.display='flex'; lp.style.opacity='0'; lp.style.transform='scale(0.97)';\n"
"      fab.style.opacity='0'; setTimeout(function(){ fab.style.display='none'; },420);\n"
"      setTimeout(function(){ lp.style.opacity='1'; lp.style.transform='scale(1)'; },20);\n"
"    });\n"
"  })();\n"
"});"
)
if OLD_BOOT in html:
    html = html.replace(OLD_BOOT, NEW_BOOT, 1)
    print("Patch 4 done: FAB JS injected")
else:
    print("WARN: boot end not matched")

# particle colours for dark bg
old_pc = "ctx.fillStyle=isDark?'rgba(167,139,250,0.5)':'rgba(124,92,255,0.35)';"
if old_pc in html:
    html = html.replace(old_pc, "ctx.fillStyle='rgba(180,148,255,0.65)';", 1)
    print("Patch 5a: particle fill fixed")

old_pa = "var alpha=(1-dist/120)*(document.documentElement.getAttribute('data-theme')==='dark'?0.25:0.12);"
if old_pa in html:
    html = html.replace(old_pa, "var alpha=(1-dist/120)*0.30;", 1)
    print("Patch 5b: particle line alpha fixed")

with open(DST, "w", encoding="utf-8") as f:
    f.write(html)

print(f"\nAll done!  Output: {DST}")
print("Preview OK?  Run:  cp index_patched.html index.html")
