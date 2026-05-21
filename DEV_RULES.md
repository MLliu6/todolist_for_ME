# DEV_RULES.md

## 代码规范

### 文件命名
- HTML/CSS/JS 文件：`kebab-case.ext`
- 常量：`UPPER_SNAKE_CASE`
- 函数/变量：`camelCase`
- CSS 类名：`kebab-case`（BEM 风格：`block__element--modifier`）

### 文件大小
- 单个 JS 文件不超过 300 行
- 超出则拆分为子模块

### 注释规范
```js
// 单行注释：解释「为什么」而非「做什么」
/**
 * 函数级注释：描述功能、参数、返回值
 * @param {string} id - 任务 ID
 * @returns {Object} 任务对象
 */
```

### 数据文件
- 所有用户数据存放在 `assets/data/` 目录
- 该目录已在 `.gitignore` 中排除，不会提交到 GitHub
- 数据格式为 JSON

### Git 提交格式
```
type(scope): description

type: init | feat | fix | style | refactor | docs | chore
```

### 环境变量 / 敏感信息
- 无后端，无 API Key，纯本地运行
- 用户数据文件（assets/data/*.json）绝不提交
