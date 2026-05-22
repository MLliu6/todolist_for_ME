# 📅 TodoList for ME

> 一个极简、高效、美观的个人任务管理工具，以日历为主视图，融合四象限法、自定义标签、DaysMatter 重要日子等功能。

## ✨ 功能特性

- 📆 **日历主视图** — 支持月度 / 周度 / 日度切换（已移除小时视图，避免伪精细化）
- 🎯 **四象限法** — 可视化象限选择器（右上=紧急重要，左上=不紧急但重要，右下=紧急不重要，左下=不紧急不重要）
- 🏷️ **自定义标签** — 支持自定义 + 已有标签快速选用
- ⏰ **DDL 管理** — 截止日期与日历联动高亮
- 🌟 **DaysMatter** — 记录重要日子，显示距今天数
- 🎑 **节假日 & 节气** — 中国法定节假日、二十四节气（2026 年已按北京时间精确修正）、中西方重要节日
- 🟣 **紫色主题** — 偏紫/薄紫配色方案（含深色模式），主按钮带渐变，视觉更高端沉稳
- 💾 **数据说明** — 数据存储在浏览器 `localStorage`，修改样式/逻辑不会自动清空数据

## 🚀 快速开始

```bash
# 克隆仓库
git clone https://github.com/MLliu6/todolist_for_ME.git
cd todolist_for_ME

# 直接用浏览器打开即可（无需任何构建）
open index.html
# Windows 用：
start index.html
```

> **数据说明**：所有个人数据保存在浏览器 `localStorage` 中，不会上传至 GitHub。如需迁移，请在浏览器开发者工具 Console 中执行 `copy(localStorage.getItem('tasks'))` 手动导出。

## 🗂️ 项目结构
todolist_for_ME/
├── index.html # 主入口（含内联主题变量）
├── assets/
│ ├── css/
│ │ ├── base.css # 设计 token & 基础样式
│ │ ├── calendar.css # 日历模块
│ │ ├── task.css # 任务卡片/表单
│ │ ├── quadrant.css # 四象限交互
│ │ └── daysmatter.css # 重要日子模块
│ ├── js/
│ │ ├── app.js # 主逻辑、Tab 路由
│ │ ├── calendar.js # 日历渲染、节假日/节气
│ │ ├── tasks.js # 任务 CRUD
│ │ ├── quadrant.js # 四象限 GSAP 交互
│ │ ├── daysmatter.js # 重要日子
│ │ └── data.js # 数据读写（localStorage）
│ └── data/ # 本地数据（gitignored）
│ └── .gitkeep
├── .gitignore
├── README.md
├── CHANGELOG.md
└── DEV_RULES.md

## 🛠️ 技术栈

- 纯静态 HTML + CSS + Vanilla JavaScript（无需框架）
- GSAP — 动效引擎
- Lucide Icons — 图标库
- Day.js — 日期处理

## 📋 Roadmap

- [x] 日历主视图（月/周/日）
- [x] 任务 CRUD + 四象限属性
- [x] DaysMatter 重要日子
- [x] 节假日 & 节气标注（2026 年北京时间修正）
- [x] 紫色主题 + 渐变按钮（深浅双模式）
- [ ] 微信小程序版本
- [ ] 数据导入/导出
- [ ] 任务统计图表
