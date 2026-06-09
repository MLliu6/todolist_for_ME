# 发布检查清单

这份清单用于每次把 TodoList for ME 推送到 main 分支或 GitHub Pages 前检查。目标是避免页面无法进入、Start 按钮失效、缓存污染、文档与功能不一致等问题。

## 1. 分支与工作区检查

发布前确认当前分支和工作区状态：

    git branch --show-current
    git status --short

要求：

- 当前分支为准备发布的功能分支或 main。
- 没有意外的临时文件。
- 没有 `.tmp_inline_scripts/`。
- 没有 `.local_backups/` 被加入提交。
- 没有无关截图、压缩包、测试输出被加入提交。

## 2. 自动检查脚本

执行：

    bash scripts/check_pages_ready.sh

要求脚本通过。

如果脚本失败，先修复失败项，不要继续 push 到 main。

## 3. 本地预览检查

启动本地服务：

    python3 -m http.server 5173

用无痕窗口打开：

    http://localhost:5173/

不要直接双击 `index.html` 做最终验收。

## 4. 启动页检查

检查：

- 页面能正常加载。
- Start 或进入应用按钮能点击。
- 点击后能进入主应用界面。
- 控制台没有红色 JavaScript 报错。
- 刷新后仍可正常进入。

## 5. 日历检查

检查：

- 月视图能正常显示。
- 周视图能正常切换。
- 日视图能正常切换。
- 点击日期能打开当天详情。
- 日期中的任务摘要能正常显示。
- 日历颜色仍保持系统主题色，不被四象限语义色污染。

## 6. 任务看板检查

检查：

- 新建任务能成功保存。
- 编辑任务能成功保存。
- 删除任务能生效。
- 勾选完成能生效。
- 拖拽排序能生效。
- 跨象限拖拽能更新任务象限。
- 四象限颜色语义正确：
  - 紧急重要：红色。
  - 紧急不重要：绿色。
  - 重要不紧急：黄色。
  - 不重要不紧急：白色或米白色。

## 7. DDL 与重复任务检查

检查：

- DDL 能正常选择。
- 逾期任务能显示逾期状态。
- 重复任务完成后能生成下一次任务。
- 修改重复规则后保存正常。

## 8. DaysMatter 检查

检查：

- 能新增重要日子。
- 能编辑重要日子。
- 能删除重要日子。
- 倒计时或已过天数显示正确。
- 提前提醒任务能按规则生成。
- 不会重复生成同一个提醒任务。

## 9. 高级视图检查

检查：

- 任务统计能显示。
- 历史周/月统计能切换。
- 平行时间线能显示任务。
- 时间线 hover 展开正常。
- 任务能量场能显示气泡。
- 能量匹配推荐能根据精力滑杆更新。

## 10. 数据保险箱检查

至少在测试数据上检查一次：

- 能输入口令。
- 能导出加密备份。
- 导出的文件不应包含明文任务内容。
- 能重新导入备份。
- 错误口令不能解密。
- 导入后任务、标签、重要日子可恢复。

## 11. 文档一致性检查

检查 README 和 docs 是否与当前功能一致：

- README 中的在线体验地址正确。
- README 不再建议直接双击 `index.html` 作为主要使用方式。
- 主题说明与实际一致。
- 产品说明与当前功能一致。
- 隐私说明明确 localStorage、本地优先、口令不可找回。
- 部署说明与 GitHub Pages 设置一致。

## 12. GitHub Pages 检查

推送 main 后，检查 GitHub Pages 设置：

    Settings → Pages → Build and deployment

推荐配置：

- Source: Deploy from a branch
- Branch: main
- Folder: /root

等待 Pages 部署完成后，访问：

    https://MLliu6.github.io/todolist_for_ME/

检查线上版本：

- 能正常打开。
- Start 能正常进入。
- 控制台无红色报错。
- 最新 README 中描述的功能与线上一致。

## 13. 不建议在同一次发布中混合的改动

为降低风险，以下改动不要混在同一个 commit 中：

- 页面主逻辑重构。
- service worker / PWA 注册。
- localStorage 数据结构迁移。
- UI 主题系统大改。
- 任务生成规则改动。
- 数据保险箱加密逻辑改动。

推荐一次只做一个可验证变更。

## 14. 回滚建议

如果本地改坏但还没有 commit：

    git restore index.html
    git clean -fd

如果已经 commit 但没 push：

    git reset --hard origin/main

如果已经 push 到 main：

    git log --oneline -n 8

找到问题 commit 后使用 revert，而不是直接强推：

    git revert <commit_sha>
    git push origin main
