# awesome-design-md-site

`awesome-design-md-site` 是一个基于 Astro 的静态画廊站点，用于浏览上游 `awesome-design-md` 仓库中的设计系统条目。站点会在构建期扫描子模块内容，为每个设计条目生成：

- 画廊首页卡片
- `/designs/<slug>/` 详情页
- `/previews/<slug>/<variant>.html` 预览资源

## 站点级设计参考

仓库根目录的 [`design.md`](./design.md) 记录的是当前画廊站点壳层本身的设计系统，包括双主题配色、排版、搜索栏、预览切换、README / DESIGN 标签页，以及面向维护者与 AI 的设计约束。

它与上游条目自带的 `vendor/awesome-design-md/design-md/*/DESIGN.md` 不同：

- 根目录 `design.md`：描述本仓库站点 shell，不会作为某个画廊条目被渲染
- `vendor/.../DESIGN.md`：属于上游设计条目内容，会在详情页中作为 DESIGN 文档展示

## 内容来源

站点唯一内容源是仓库内的 git submodule：

- 路径：`vendor/awesome-design-md`
- 上游：`https://github.com/VoltAgent/awesome-design-md.git`

首次克隆后，先初始化子模块：

```bash
git submodule update --init --recursive
```

若站点仓库已存在，只想同步上游最新内容：

```bash
git submodule update --remote --merge
```

若未初始化子模块，站点仍可构建，但首页会显示显式空状态，提示缺少上游内容。

## 本地开发

```bash
npm install
git submodule update --init --recursive
npm run dev
```

默认端口为 `4321`。可用 `PORT_WEBSITE` 覆盖。

## 验证命令

```bash
npm test
npm run typecheck
SITE_URL=https://your-domain.example npm run build
```

## 画廊架构

核心内容管线位于 `src/lib/content/awesomeDesignCatalog.ts`，负责：

1. 扫描 `vendor/awesome-design-md/design-md/*`
2. 校验每个条目的 `README.md`、`DESIGN.md` 与至少一个预览 HTML
3. 渲染 README / DESIGN 为静态 HTML
4. 生成搜索文本、标题、摘要与预览 URL
5. 为详情页与预览静态路由提供统一数据模型

主要页面与组件：

- `src/pages/index.astro`：画廊首页
- `src/pages/designs/[slug].astro`：设计详情页
- `src/pages/previews/[slug]/[variant].html.ts`：预览静态资源发布
- `src/components/gallery/SearchToolbar.tsx`：实时搜索与 `?q=` 状态同步
- `src/components/gallery/DocumentTabs.astro`：README / DESIGN 切换
- `src/components/gallery/PreviewSwitcher.astro`：亮 / 暗预览切换

## 预览行为

- 若条目同时存在 `preview.html` 与 `preview-dark.html`，站点会分别发布 light / dark 两个稳定路径。
- 若条目只存在一个预览文件，站点仍会发布两个稳定路径，并在缺失主题时回退到可用预览。
- 首页卡片默认加载 light 路径；详情页会根据当前站点主题优先切到对应预览。

## 维护流程

当上游新增或更新设计条目时：

1. 同步子模块
2. 运行 `npm test`
3. 运行 `npm run typecheck`
4. 运行 `npm run build`
5. 提交 `.gitmodules`、submodule gitlink、站点代码和锁文件
