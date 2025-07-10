# VitePress 网站构建与部署指南

> 作者：Kislate
> 日期：2025年7月10日
> 标签：VitePress, GitHub Pages, 静态网站

## 1. VitePress 简介

VitePress 是一个基于 Vite 构建的静态网站生成器，特别适合用于构建文档类网站。它拥有以下特点：

- **快速构建**：基于 Vite，享受极速的开发体验
- **Markdown 支持**：直接使用 Markdown 编写内容
- **Vue 集成**：可以在 Markdown 中使用 Vue 组件
- **主题定制**：默认主题美观易用，也可以自定义主题
- **自动生成目录**：支持侧边栏和导航栏自动生成

## 2. 环境准备

在开始前，请确保你的环境满足以下条件：

- Node.js 版本 18 或更高
- 一个文本编辑器（推荐 VS Code）
- 基本的命令行操作知识

## 3. 项目初始化

### 3.1 安装 VitePress

```bash
# 创建项目文件夹（如已有项目可跳过）
mkdir WebNote
cd WebNote

# 安装 VitePress 作为开发依赖
npm add -D vitepress
```

### 3.2 使用初始化向导

VitePress 提供了一个命令行向导帮助你快速设置项目：

```bash
npx vitepress init
```

在初始化过程中，你会看到以下问题：
- VitePress 配置应该放在哪个目录？(推荐 `./docs`)
- 在哪里查找 Markdown 文件？(推荐 `./docs`)
- 网站标题：(例如 `Kislate's Note`)
- 网站描述：(例如 `Kislate's web note powered by VitePress`)
- 主题选择：(默认主题)
- 是否使用 TypeScript？(建议选 Yes)
- 是否添加 npm 脚本到 package.json？(建议选 Yes)
- 是否为 VitePress 脚本添加前缀？(建议选 Yes)
- 脚本前缀：(建议用 `docs`)

## 4. 项目结构

完成初始化后，项目结构应该如下：

```
WebNote/
├── docs/
│   ├── .vitepress/
│   │   └── config.mts (或 config.js)
│   ├── index.md
│   ├── api-examples.md
│   └── markdown-examples.md
└── package.json
```

### 4.1 配置文件

`config.mts` 是 VitePress 的核心配置文件，包含网站标题、描述、主题配置等。以下是一个基本示例：

```typescript
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Kislate's Note",
  description: "Kislate's web note powered by VitePress",
  base: '/WebNote/', // 对于部署到 GitHub Pages 的子路径，这非常重要
  
  themeConfig: {
    // 导航栏配置
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/vitepress-guide' }
    ],

    // 侧边栏配置
    sidebar: [
      {
        text: '指南',
        items: [
          { text: 'VitePress 指南', link: '/vitepress-guide' }
        ]
      }
    ],

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/你的用户名/WebNote' }
    ]
  }
})
```

## 5. 本地开发

在项目根目录运行以下命令启动开发服务器：

```bash
npm run docs:dev
```

这会启动一个本地开发服务器（默认在 `http://localhost:5173`）。每当你修改文件时，页面会自动更新。

## 6. 创建和编辑笔记

### 6.1 Markdown 基础

VitePress 使用 Markdown 编写内容。每个 `.md` 文件都会被转换为一个 HTML 页面。

基本语法示例：

```markdown
# 一级标题

## 二级标题

**粗体** *斜体*

- 列表项1
- 列表项2

[链接](https://example.com)

![图片](./images/example.png)

> 引用块
```

### 6.2 创建新笔记

要创建新笔记，只需在 `docs` 目录下创建一个新的 Markdown 文件：

1. 在 `docs` 目录创建 `my-new-note.md`
2. 添加内容，以 Markdown 格式编写
3. 在配置文件中添加链接，让用户能够找到它：

```typescript
// 在 .vitepress/config.mts 的 sidebar 部分添加
sidebar: [
  {
    text: '指南',
    items: [
      { text: 'VitePress 指南', link: '/vitepress-guide' },
      { text: '我的新笔记', link: '/my-new-note' }
    ]
  }
]
```

## 7. 部署到 GitHub Pages

### 7.1 构建网站

在推送到 GitHub 之前，应该先在本地构建网站以确保所有内容正确无误：

```bash
# 构建网站
npm run docs:build

# 可以使用预览命令在本地检查构建后的网站
npm run docs:preview
```

构建完成后，你可以在 `docs/.vitepress/dist` 目录中查看生成的静态文件。确认一切正常后，再将代码推送到 GitHub。

### 7.2 创建 GitHub 仓库

1. 在 GitHub 创建一个名为 `WebNote` 的新仓库
2. 将本地项目推送到 GitHub：

```bash
git init
git add .
git commit -m "初始化 VitePress 项目"
git remote add origin https://github.com/你的用户名/WebNote.git
git push -u origin main
```

### 7.3 配置 GitHub Actions

在项目根目录创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy VitePress site to Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Install dependencies
        run: npm ci
      - name: Build with VitePress
        run: npm run docs:build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 7.4 启用 GitHub Pages

1. 进入 GitHub 仓库的 Settings 页面
2. 在左侧菜单中找到 "Pages"
3. 在 "Build and deployment" 部分，选择 "Source" 为 "GitHub Actions"

现在，每次你推送更改到 `main` 分支，GitHub Actions 会自动构建并部署你的网站。

## 8. 更新和维护笔记

### 8.1 修改现有笔记

直接编辑对应的 Markdown 文件，保存后本地开发服务器会实时更新。

### 8.2 添加新笔记

1. 在 `docs` 目录创建新的 Markdown 文件
2. 更新 `config.mts` 中的导航或侧边栏配置
3. 提交并推送到 GitHub：

```bash
git add .
git commit -m "添加新笔记：xxx"
git push
```

### 8.3 组织笔记结构

对于较大的笔记集合，可以使用文件夹组织结构：

```
docs/
├── index.md            # 首页
├── guide/              # 指南文件夹
│   ├── index.md        # 指南首页
│   └── getting-started.md  # 入门指南
└── topics/             # 主题文件夹
    ├── index.md        # 主题首页
    └── markdown.md     # Markdown 主题
```

然后在配置文件中相应地组织侧边栏：

```typescript
sidebar: [
  {
    text: '指南',
    items: [
      { text: '指南', link: '/guide/' },
      { text: '入门', link: '/guide/getting-started' }
    ]
  },
  {
    text: '主题',
    items: [
      { text: 'Markdown', link: '/topics/markdown' }
    ]
  }
]
```

## 9. 高级功能

VitePress 还提供了许多高级功能，可以进一步提升你的笔记体验：

- **代码高亮**：自动支持多种编程语言的语法高亮
- **自定义容器**：创建提示、警告、危险等特殊内容块
- **frontmatter**：在 Markdown 文件顶部添加元数据
- **搜索功能**：内置的全文搜索
- **Vue 组件**：在 Markdown 中使用 Vue 组件
- **主题定制**：修改默认主题或创建自己的主题

## 10. 总结

通过 VitePress 构建笔记网站是一种高效且现代的方式。它不仅提供了优雅的界面，还支持丰富的功能来组织和展示你的知识。结合 GitHub Pages 的自动部署，你可以专注于内容创作，而不必担心复杂的部署流程。

希望这个指南能帮助你开始使用 VitePress 构建自己的笔记网站！如有任何问题，可以参考 [VitePress 官方文档](https://vitepress.dev/)。
