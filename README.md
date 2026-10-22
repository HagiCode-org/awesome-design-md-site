# awesome-design-md-site

[![last commit](https://img.shields.io/github/last-commit/HagiCode-org/awesome-design-md-site)](https://github.com/HagiCode-org/awesome-design-md-site/commits/main)

`awesome-design-md-site` 是一个基于 Astro 的静态画廊站点，用于浏览上游 `awesome-design-md` 仓库中的设计系统条目。站点会在构建期扫描子模块内容，为每个设计条目生成：

- 画廊首页卡片
- `/designs/<slug>/` 详情页
- `/preview-images/<slug>/<variant>-<fit|tablet|mobile|thumb>.avif` 预先渲染好的整页预览图（卡片与详情页使用）
- `/previews/<slug>/<variant>.html` 原始预览页（仅用于“新标签页打开”与预览图加载失败时的回退）

站点页脚与 favicon 统一使用 `@hagicode/hagilight` 0.5.0 的共享 chrome；plain-Astro integration 默认生成有效的空 `/rss.xml`、`/rss.en.xml` 和 `/rss.<locale>.xml` feeds，不会自动读取画廊目录生成条目。

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

## hagi18n 维护

站点壳层的第一方 UI 文案与语言元数据现在由仓库内的 `@hagicode/hagi18n` 和 `hagi18n.yaml` 管理，语言范围与 Desktop 对齐：

- 默认源语言：`en-US`
- 目标语言：`zh-CN`、`zh-Hant`、`ja-JP`、`ko-KR`、`de-DE`、`fr-FR`、`es-ES`、`pt-BR`、`ru-RU`
- YAML 源目录：`src/i18n/locales/<locale>/`
- 运行时生成资源：`src/i18n/generated/site-locale-resources.ts`

先确认本地 CLI 可用：

```bash
npx hagi18n info
```

常用维护命令：

```bash
npm run i18n:audit
npm run i18n:doctor
npm run i18n:generate
npm run i18n:check
```

建议流程：

1. 修改 `src/i18n/locales/<locale>/*.yml`
2. 先运行 `npm run i18n:audit` 或 `npm run i18n:doctor`
3. 再运行 `npm run i18n:generate`
4. 最后运行 `npm run i18n:check`、`npm test`、`npm run typecheck`

### sync / prune 约定

`sync` 和 `prune` 默认都只做预览，不会改动源文件；只有显式 `:write` 变体才允许写回：

```bash
npm run i18n:sync
npm run i18n:sync:write
npm run i18n:prune
npm run i18n:prune:write
```

### 翻译边界

hagi18n 只负责第一方站点 UI 字符串与语言元数据，例如：

- 页头、页脚、语言切换、SEO 语言元数据
- 画廊搜索、卡片标签、详情页动作、推广回退文案
- React islands 使用的交互标签

以下内容仍然属于画廊内容源，不进入 `src/i18n/locales`：

- `vendor/awesome-design-md/**/README.md`
- `vendor/awesome-design-md/**/DESIGN.md`
- `vendor/awesome-design-md/**/preview*.html`

生成后的 `src/i18n/generated/site-locale-resources.ts` 已纳入版本控制，YAML 源变更后应一并刷新并提交。

## 验证命令

```bash
npm run i18n:check
npm run previews:verify
npm test
npm run typecheck
SITE_URL=https://your-domain.example npm run build
```

## 生产部署

- 权威工作流：`.github/workflows/awesome-design-md-site-deploy-gh-pages.yml`
- 生产 source of truth：`gh-pages` 分支，只允许 CI 发布经过验证的快照
- 发布 payload 契约：分支根目录保留 `esa.jsonc`，静态画廊产物统一位于 `dist/`
- 所需 GitHub 权限：deploy job 需要 `contents: write`
- 所需托管设置：生产托管读取 `gh-pages/esa.jsonc`，并把 `gh-pages/dist/` 作为站点目录
- 首次部署检查：确认 Actions 产出包含 `esa.jsonc` 与 `dist/`，确认子模块内容已进入构建产物，并验证 `https://design.hagicode.com`
- 回滚方式：回退 source 变更或从旧提交重新运行工作流，让 CI 重新发布上一个通过验证的分支快照

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
- `src/components/gallery/PreviewSwitcher.astro`：亮 / 暗、Fit / Tablet / Mobile 的预览图切换
- `scripts/render-preview-images.mjs`：维护者运行的整页渲染与 AVIF 编码
- `scripts/verify-preview-images.mjs`：构建前校验预览图与清单

## 预览行为

- 若条目同时存在 `preview.html` 与 `preview-dark.html`，站点会分别为 light / dark 生成一套预览图。
- 若条目只存在一个预览文件，缺失的主题会复用另一主题的预览图（清单中记为 `reuses`）。
- 首页卡片默认显示 light 缩略图；详情页会根据当前站点主题优先切到对应预览图，并随 Fit / Tablet / Mobile 切换渲染宽度。
- `/previews/<slug>/<variant>.html` 仍然发布，供“新标签页打开”使用；它会从 Google Fonts 加载字体，因为这是访问者主动打开的页面。

## 预览图渲染

画廊的预览不再实时加载上游 `preview.html`，而是使用预先渲染的 AVIF 整页图。渲染由维护者在本机执行（需要已安装的 Chromium，并且能访问 `fonts.googleapis.com`），普通 `npm run build` 与 CI 部署都不需要浏览器或网络。

更新子模块后的流程：

```bash
git submodule update --remote --merge
npm run previews:render                    # 只渲染内容哈希已变化的条目
npm run previews:render -- --only apple    # 只渲染一个条目
npm run previews:render -- --force         # 忽略哈希，全部重新渲染
npm run previews:verify                    # 检查图片、清单与源文件是否一致
npm run build                              # build 会先自动执行 previews:verify
```

渲染输出：

- `public/preview-images/<slug>/<variant>-<name>.avif`：每个条目、每个主题 4 张图（`fit` 1440 px、`tablet` 820 px、`mobile` 390 px 整页图，`thumb` 为卡片比例 4 : 5.8 的顶部裁切）
- `src/data/preview-images.json`：清单，记录每张图的尺寸、字节数与源 HTML 的 SHA-256
- 渲染过程会列出被拦截的外部请求（除字体域名外），请在提交前确认它们无害

`npm run build` 与 `npm run previews:verify` 会在以下情况直接失败，并指出条目与渲染命令：

- `Preview images are missing for design entry "<slug>". Run: npm run previews:render -- --only <slug>`：新增条目没有渲染记录
- `Preview images for "<slug>" (light|dark) are stale`：上游 HTML 已变化，但图片没有重新渲染
- `Missing preview image ...` / `is not AVIF` / `has the wrong dimensions`：图片缺失、不是 AVIF 或尺寸与清单不符
- `Orphan preview image ...` / `Non-AVIF file ...` / `Orphan preview record ...`：残留文件或已删除条目的清单记录

渲染阶段的失败包括：某个已声明的字体未能加载（`Fonts did not load for ...`），以及单文件超过 1 MB 或图片目录超过 60 MB（会列出超标文件）。

## 维护流程

当上游新增或更新设计条目时：

1. 同步子模块
2. 运行 `npm run previews:render`，并确认输出中的拦截请求可以接受
3. 运行 `npm run previews:verify`
4. 如有第一方 UI 文案变更，先运行 `npm run i18n:check`
5. 运行 `npm test`
6. 运行 `npm run typecheck`
7. 运行 `npm run build`
8. 提交 `.gitmodules`、submodule gitlink、`public/preview-images/`、`src/data/preview-images.json`、站点代码、生成的 i18n 资源和锁文件
