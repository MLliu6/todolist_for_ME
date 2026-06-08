# GitHub Pages 部署说明

## 推荐部署方式

仓库设置路径：

Settings → Pages → Build and deployment → Source: Deploy from a branch

推荐配置：

- Branch: main
- Folder: /root

保存后，GitHub Pages 会从 main 分支根目录发布静态站点。

默认访问地址一般为：

https://MLliu6.github.io/todolist_for_ME/

## 本地预览

在 WSL 中执行：

    cd /home/lml/vibecoding/todolist_for_ME
    python3 -m http.server 5173

浏览器打开：

    http://localhost:5173/

不要直接双击 index.html。部分浏览器能力在 file:// 环境下表现不一致。

## 发布前检查

执行：

    bash scripts/check_pages_ready.sh

检查内容包括：

- index.html 是否存在。
- 是否包含基本 SEO 描述。
- 是否存在 .nojekyll。
- 是否没有临时检查目录。
- 内联 JavaScript 是否通过 node --check。
