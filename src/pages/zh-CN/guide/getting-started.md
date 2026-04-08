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
- 由 `public/global.css` 提供的站点壳层样式

## 壳层样式来源

- 运行时页头与壳层样式应修改 `public/global.css`，因为 `BaseLayout.astro` 直接链接的是 `/global.css`。
- `src/styles/global.css` 当前不是构建产物实际加载的样式文件；若布局导入方式不变，应将其视为参考副本。

## 移动端页头约定

- 窄屏使用紧凑品牌标签 `ADMG`，不再显示完整站点名。
- 语言与主题切换继续直接留在 sticky 页头中。
- 仓库链接在移动端收进 `details` 展开面板，平板与桌面仍保持内联展示。

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
