#!/usr/bin/env python3
"""Structural regression checks for the Today-first product upgrade."""

from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"


class AppParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.tabs = []
        self.assets = []

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if "id" in data:
            self.ids.append(data["id"])
        if data.get("data-tab"):
            self.tabs.append(data["data-tab"])
        if tag == "link" and data.get("rel") == "stylesheet":
            self.assets.append(data.get("href"))
        if tag == "script" and data.get("src"):
            self.assets.append(data.get("src"))


html = INDEX.read_text(encoding="utf-8")
parser = AppParser()
parser.feed(html)

duplicates = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
assert not duplicates, f"duplicate HTML ids: {duplicates}"

for tab in parser.tabs:
    assert f'id="panel-{tab}"' in html, f"tab has no panel: {tab}"

required_ids = {
    "panel-home",
    "quick-capture",
    "home-focus",
    "home-today-list",
    "home-archive-list",
    "task-estimate",
}
missing_ids = required_ids.difference(parser.ids)
assert not missing_ids, f"missing product UI: {sorted(missing_ids)}"

for asset in parser.assets:
    if not asset or re.match(r"https?://", asset):
        continue
    assert (ROOT / asset).is_file(), f"missing local asset: {asset}"

source = (ROOT / "assets/js/home.js").read_text(encoding="utf-8")
assert "Tasks.createQuickTask" in source, "quick capture is not wired"
assert "plannedDate:$('#quick-capture-date')" in source, "quick capture still invents a hard deadline"
assert "data-task-action=\"restore\"" in source, "archive restore is not wired"
assert "tdm:storage-error" in source, "storage failure state is not surfaced"
assert "prefers-reduced-motion" in (ROOT / "assets/css/atelier.css").read_text(encoding="utf-8")

assert "if(isLockedTask(t))" in html, "locked tasks can still enter edit flow"
assert "var generated=[]" in html and "tasks.slice().forEach" in html, "template generation still mutates its active iteration"
assert "return wr(KEYS.tasks,a)" in html, "task writes do not expose failure"
assert "if(!writeSnapshot(next))" in html and "restoreRawSnapshot()" in html, "vault import is not transactional"
assert "hasStorageError:function()" in html and "writeFailure" in html, "storage failure state is not latched"
assert "showUndoToast('任务已删除'" in html, "task deletion has no recovery path"
assert "Tasks.toggleDone(id,true)" in source, "Today completion does not force a completed state"

print("product upgrade structural checks passed")
