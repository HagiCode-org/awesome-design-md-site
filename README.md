# awesome-design-md-site

基于 `repos/site` 提炼的 Astro 站点模板。目标不是复制现有官网，而是保留可复用的壳层能力：

- Astro 静态优先
- React islands
- Markdown / MDX 页面
- 中英双语路由
- 一套偏设计感的落地页骨架

## 使用

```bash
npm install
npm run dev
```

默认端口为 `4321`。可用 `PORT_WEBSITE` 覆盖。

## 关键文件

- `src/config/site.ts`：站点文案、导航、首页数据
- `src/layouts/BaseLayout.astro`：通用页面骨架
- `src/pages/index.astro`：英文首页
- `src/pages/zh-CN/index.astro`：中文首页
- `src/styles/global.css`：全局设计变量与样式

## 构建

```bash
SITE_URL=https://your-domain.example npm run build
```
