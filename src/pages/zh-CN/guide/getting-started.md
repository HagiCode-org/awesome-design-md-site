---
layout: ../../../layouts/BaseLayout.astro
title: 快速开始
description: Awesome Design MD Site 的起步说明。
lang: zh-CN
nav:
  - label: 首页
    href: /zh-CN/
  - label: 指南
    href: /zh-CN/guide/getting-started
  - label: English
    href: /guide/getting-started
  - label: GitHub
    href: https://github.com/HagiCode-org/awesome-design-md-site
currentPath: /zh-CN/guide/getting-started
---

<div class="markdown-shell shell-panel">

# 快速开始

此仓库已初始化为一个轻量 Astro 模板，结构参考 `repos/site`，但去掉了与现有业务绑定的部分。

## 已包含

- Astro 6 静态站点骨架
- 局部 React islands
- MDX / Markdown 内容支持
- 中英双语路径
- 一套可扩展的设计变量与首页结构

## 建议先做

1. 修改 `src/config/site.ts` 中的站点文案与链接。
2. 构建前设置真实 `SITE_URL`。
3. 替换首页示例区块。
4. 按需继续增加 `.md` 或 `.mdx` 页面。

## 命令

```bash
npm install
npm run dev
npm run build
```

</div>
