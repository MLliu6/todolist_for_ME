# Changelog

All notable changes to this project will be documented in this file.
Format based on Keep a Changelog.

## [Unreleased]
### Added
- Add a landing-inspired animated gradient and connected particle field behind the dark-mode workspace, with reduced-motion support.
- Add a Today-first decision dashboard with quick capture, a single next-move recommendation, daily workload signals, week completion feedback, and direct routes into planning views.
- Add a keyboard command center (`Ctrl/Cmd + K`) plus `/` quick-capture focus.
- Add optional 15–120 minute task estimates and surface estimated daily effort without automatic rescheduling.
- Separate optional `plannedDate` from the hard `ddl`; quick capture schedules work without inventing a deadline.
- Add a recoverable archive panel so Burnout-archived tasks can be restored.
- Add the responsive Atelier design system with a desktop workspace rail, mobile bottom navigation, warm neutral surfaces, restrained semantic motion, and reduced-motion support.
- Add structural release checks for the Today dashboard, local assets, tab/panel relationships, data reliability guards, and duplicate DOM ids.
- Add encrypted Data Vault for exporting current tasks, tags, and DaysMatter data into a password-protected HTML copy or JSON vault.
- Support restoring encrypted data from another exported HTML/JSON file, including auto-detecting an embedded vault when the current browser has no local data.
- Add application icon assets (`mytodo-logo.ico`, `mytodo-logo.png`, `mytodo-logo.svg`) for browser/app branding.
- Add task search across names, descriptions, tags, dates, status, quadrant, and repeat labels.
- Add daily, weekly, and monthly repeating tasks that generate the next occurrence when completed.
- Add a statistics tab with weekly/monthly completions, current overdue count, repeating task count, quadrant distribution, and tag distribution.
- Show up to two task titles directly in month calendar cells, with overflow counts for busy dates.
- Add solar-term task suggestion cards that can create a task on demand without automatic writes.
- Add DaysMatter reminder rules that create linked tasks ahead of important dates with source-based duplicate protection.
- Add task inheritance templates for generating follow-up tasks by date cycle or relative to a DaysMatter entry.
- Add lightweight subtasks/checklists with progress badges on task cards.
- Add drag sorting within the quadrant board and drag-to-change-quadrant behavior.
- Add parallel timeline, task field visualization, and energy-based recommendation views.
- Add time capsule tasks with `unlockDate`, hiding task title and description until the unlock date.
- Add Burnout deceleration reminders for overloaded Q1 overdue tasks, with non-destructive archiving for tasks overdue by 7+ days.
- Add previous/next week and month navigation in the statistics view.
- Add editable solar-term ritual text stored in `tdm_solar_rituals`; one-click solar-term task creation now uses the saved ritual text.
- Add `tdm_ui_prefs` for lightweight UI state such as statistics cursors.
- Add related-task display on DaysMatter cards, limited to tasks explicitly linked by source, tags, or text.

### Security
- Encrypt portable backups with Web Crypto AES-GCM and PBKDF2-SHA256 so task data is not stored as plaintext inside exported HTML files.
- Validate encrypted vault format and restored snapshot shape before importing browser data.
- Ignore local backup data and Windows Zone.Identifier metadata to avoid accidentally uploading private task data or OS download markers.
- Include solar rituals and UI preferences in encrypted export/import snapshots without requiring a destructive migration.

### Changed
- Unify dark mode around a violet night palette across navigation, surfaces, primary actions, task quadrants, charts, and focus states while preserving semantic warning and error colors.
- Make task edit actions visible without hover so mobile and touch users can edit tasks reliably.
- Prevent long task content from breaking the two-column quadrant board layout.
- Restart the landing particle animation when returning to the home screen from the app.
- Allow the expanded navigation to scroll horizontally on small screens.
- Update the quadrant color system so Q1 uses the deepest purple and lower-priority quadrants step down toward low-saturation pink-purple.
- Match task completion circle color to each task's quadrant color.
- Show quadrant board counts as completed/total instead of remaining/total.
- Improve the parallel timeline with same-track layering and hover/focus expansion for full task details.
- Rework task field bubble sizing to reflect energy, subtask count, and overdue pressure while showing all unarchived unfinished tasks.
- Replace the stiff sweeping mirror highlight with subtler glass surfaces, edge highlights, and localized hover glow.
- Change solar-term styling from green to blue-purple/indigo to better fit the app theme.
- Merge solar-term suggestion and ritual editing into a single inline-editable card.
- Limit DaysMatter related-task display to real relationships instead of showing every nearby task by date.

### Fixed
- Surface localStorage write failures instead of silently claiming a successful save.
- Prevent locked time-capsule tasks from exposing their title and description through the edit modal.
- Generate due task-template instances after iteration instead of mutating the array being traversed.
- Persist theme and active-view preferences for returning users while keeping the welcome screen available on every visit.
- Fix timeline task overlap making titles hard to read.
- Fix task field bubbles appearing too similar in size.
- Fix ambiguous task field scope by making it an all-unfinished-task overview rather than a current-week-only view.
- Fix stale green visual accents in solar-term suggestion UI.
- Fix noisy DaysMatter "emotional timeline" entries that were unrelated to the recorded day.

## [0.1.1] - 2026-05-22
### Changed
- **主题配色**：从米白/暖灰（teal 主色）全面切换为偏紫配色方案（`#7c5cff` light / `#a78bfa` dark）
- **深色模式**：修复深色模式下 `--color-primary` 残留暗绿色（`#4fa897` → `#a78bfa`）的问题，DaysMatter「已过/还有」天数颜色也随之修正
- **四象限坐标系**：统一说明标注为「右侧=紧急，左侧=不紧急；上方=重要，下方=不重要」，与正确的艾森豪威尔矩阵方位一致
- **日历视图**：移除「时」精度视图按钮（小时视图），日历现仅支持月/周/日三级切换，避免误导用户认为可精确到小时
- **主按钮样式**：`.btn-primary` 改为紫色渐变 + 彩色阴影，悬停时上移效果更明显
- **节气日期**：2026 年二十四节气全部改为精确的北京时间对应日期，修正原算法在部分年份偏移一天的问题（影响 `index.html` 与 `assets/js/calendar.js` 双份逻辑）
- **README**：更新功能描述、数据说明、Roadmap 以反映最新配色与功能状态

## [0.1.0] - 2026-05-22
### Added
- Initial project scaffolding
- Calendar main view (month/week/day precision)
- Task CRUD with quadrant, tags, DDL, status fields
- GSAP quadrant particle selector
- DaysMatter module
- Chinese holidays, 24 solar terms, major Western festivals
- Warm beige light theme with smooth animations
