import { resolveAwesomeDesignFooterSiteLinks } from '@/lib/footer-site-links';

export type SupportedLocale = 'en' | 'zh-CN';

export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

export interface MetricItem {
  value: string;
  label: string;
}

export interface HomeContent {
  lang: SupportedLocale;
  title: string;
  description: string;
  eyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroNote: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  nav: NavItem[];
  metrics: MetricItem[];
}

export interface LanguageLink extends NavItem {
  locale: SupportedLocale;
}

export interface ShowcaseSlide {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
}

export interface HeroReadmeExcerpt {
  excerpt: string;
  translation?: string;
}

export interface LocaleCopy {
  chrome: {
    brandSubtitle: string;
    skipToContent: string;
    galleryLabel: string;
    siteRepoLabel: string;
    sourceRepoLabel: string;
    footerCopy: string;
    languageEnglish: string;
    languageChinese: string;
    themeLight: string;
    themeDark: string;
    switchToLight: string;
    switchToDark: string;
  };
  home: {
    title: string;
    heroEyebrow: string;
    heroTitle: string;
    heroLead: string;
    heroReadmeKicker: string;
    heroReadmeExcerpts: HeroReadmeExcerpt[];
    showcaseEyebrow: string;
    showcaseTitle: string;
    showcaseLead: string;
    showcaseCtaLabel: string;
    showcaseCtaHref: string;
    showcasePrev: string;
    showcaseNext: string;
    showcaseJumpLabel: string;
    showcaseSlides: ShowcaseSlide[];
    emptyKicker: string;
    emptyTitle: string;
    emptyCopy: string;
  };
  card: {
    preview: string;
    lightDark: string;
    fallbackAware: string;
  };
  search: {
    searchCatalog: string;
    indexedNounSingular: string;
    indexedNounPlural: string;
    indexedSuffix: string;
    resultNounSingular: string;
    resultNounPlural: string;
    resultPrefix: string;
    note: string;
    keywordLabel: string;
    placeholder: string;
    noMatchingTitle: string;
    noMatchingCopy: string;
    clearSearch: string;
  };
  detail: {
    pageTitleSuffix: string;
    backToGallery: string;
    kicker: string;
    slugPrefix: string;
    readmeRendered: string;
    designRendered: string;
  };
  preview: {
    kicker: string;
    heading: string;
    light: string;
    dark: string;
    openDarkTitle: string;
    fallbackDarkTitle: string;
    bothAvailableNote: string;
    fallbackNote: string;
  };
  documents: {
    kicker: string;
    heading: string;
    readme: string;
    design: string;
    copyDesign: string;
    copyDesignTitle: string;
    copied: string;
    copyFailed: string;
  };
  adjacent: {
    previous: string;
    next: string;
  };
}

export const siteMeta = {
  name: 'Awesome Design MD Gallery',
  shortName: 'ADMG',
  repository: 'https://github.com/HagiCode-org/awesome-design-md-site',
  sourceRepository: 'https://github.com/VoltAgent/awesome-design-md',
  hagicodeWebsite: 'https://hagicode.com',
  defaultSocialImagePath: '/img/hagicode/light-main.png',
};

export const localeCopy: Record<SupportedLocale, LocaleCopy> = {
  en: {
    chrome: {
      brandSubtitle: 'Powered by HagiCode',
      skipToContent: 'Skip to content',
      galleryLabel: 'Gallery',
      siteRepoLabel: 'Site Repo',
      sourceRepoLabel: 'Source Repo',
      footerCopy:
        'Static gallery for README, DESIGN, and live preview assets from the upstream source.',
      languageEnglish: 'English',
      languageChinese: '简体中文',
      themeLight: 'Light',
      themeDark: 'Dark',
      switchToLight: 'Switch to light mode',
      switchToDark: 'Switch to dark mode',
    },
    home: {
      title: 'Awesome Design MD Gallery',
      heroEyebrow: 'Design system gallery',
      heroTitle: 'Awesome Design',
      heroLead:
        'A gallery site for browsing design systems through live previews, README references, and DESIGN.md documentation. The experience and presentation of this site were designed and built with HagiCode.',
      heroReadmeKicker: 'From the upstream README',
      heroReadmeExcerpts: [
        {
          excerpt:
            'Curated collection of DESIGN.md files inspired by developer focused websites.',
        },
        {
          excerpt:
            'Copy a DESIGN.md into your project, tell your AI agent "build me a page that looks like this" and get pixel-perfect UI that actually matches.',
        },
        {
          excerpt:
            "It's just a markdown file. No Figma exports, no JSON schemas, no special tooling.",
        },
      ],
      showcaseEyebrow: 'Built with HagiCode',
      showcaseTitle: 'Hagicode',
      showcaseLead:
        'OpenSpec workflow, multi-agent execution, and Hero Dungeon interfaces are the product ideas reused to build this gallery shell.',
      showcaseCtaLabel: 'Visit HagiCode',
      showcaseCtaHref: siteMeta.hagicodeWebsite,
      showcasePrev: 'Previous slide',
      showcaseNext: 'Next slide',
      showcaseJumpLabel: 'Go to slide',
      showcaseSlides: [
        {
          title: 'OpenSpec workflow',
          description:
            'Turn ideas into proposal, design, tasks, implementation, and archive in one continuous track.',
          imageSrc: '/img/hagicode/light-main.png',
          imageAlt: 'HagiCode light theme main interface screenshot',
        },
        {
          title: 'Multi-agent workspace',
          description:
            'Different agents can draft, fix, and review in parallel instead of waiting on one serial thread.',
          imageSrc: '/img/hagicode/multi-agent-workspace.svg',
          imageAlt: 'HagiCode multi-agent workspace illustration',
        },
        {
          title: 'Hero Dungeon view',
          description:
            'Dungeons, captains, and visual workspaces make long-running AI coding sessions easier to coordinate.',
          imageSrc: '/img/hagicode/hero-dungeon-workspace.svg',
          imageAlt: 'HagiCode Hero Dungeon workspace illustration',
        },
      ],
      emptyKicker: 'No designs available',
      emptyTitle: 'The gallery is ready, but the source content is missing.',
      emptyCopy:
        'Initialize the submodule with `git submodule update --init --recursive`, then rebuild the site.',
    },
    card: {
      preview: 'Preview',
      lightDark: 'Light + dark',
      fallbackAware: 'Fallback aware',
    },
    search: {
      searchCatalog: 'Search the catalog',
      indexedNounSingular: 'design',
      indexedNounPlural: 'designs',
      indexedSuffix: 'indexed',
      resultNounSingular: 'result',
      resultNounPlural: 'results',
      resultPrefix: 'for',
      note: 'Title, summary, README, and DESIGN text are indexed.',
      keywordLabel: 'Keyword',
      placeholder: 'Search Stripe, docs, fintech, gradients...',
      noMatchingTitle: 'No matching designs',
      noMatchingCopy: 'Clear the current query to restore the full gallery.',
      clearSearch: 'Clear search',
    },
    detail: {
      pageTitleSuffix: 'Awesome Design MD Gallery',
      backToGallery: 'Back to gallery',
      kicker: 'Design detail',
      slugPrefix: 'Slug:',
      readmeRendered: 'README rendered',
      designRendered: 'DESIGN rendered',
    },
    preview: {
      kicker: 'Live preview',
      heading: 'Theme-aware preview frame',
      light: 'Light',
      dark: 'Dark',
      openDarkTitle: 'Open dark preview',
      fallbackDarkTitle: 'Dark uses the available preview fallback',
      bothAvailableNote: 'Both light and dark preview assets are available.',
      fallbackNote: 'Dark mode falls back to the available preview asset for this entry.',
    },
    documents: {
      kicker: 'Documentation',
      heading: 'README and DESIGN in one place',
      readme: 'README',
      design: 'DESIGN',
      copyDesign: 'Copy DESIGN.md',
      copyDesignTitle: 'Copy raw DESIGN.md markdown',
      copied: 'Copied',
      copyFailed: 'Copy failed',
    },
    adjacent: {
      previous: 'Previous',
      next: 'Next',
    },
  },
  'zh-CN': {
    chrome: {
      brandSubtitle: 'Powered by HagiCode',
      skipToContent: '跳转到正文',
      galleryLabel: '画廊',
      siteRepoLabel: '站点仓库',
      sourceRepoLabel: '上游仓库',
      footerCopy: '用于浏览上游 README、DESIGN 与实时预览资源的静态画廊站点。',
      languageEnglish: 'English',
      languageChinese: '简体中文',
      themeLight: '浅色',
      themeDark: '深色',
      switchToLight: '切换到浅色模式',
      switchToDark: '切换到深色模式',
    },
    home: {
      title: 'Awesome Design MD 画廊',
      heroEyebrow: '设计系统画廊',
      heroTitle: 'Awesome Design',
      heroLead:
        '这是一个用于浏览设计系统的画廊站点，支持直接查看实时预览、README 参考内容与 DESIGN.md 文档。当前站点本身的设计与构建，也由 HagiCode 完成。',
      heroReadmeKicker: '摘自上游 README',
      heroReadmeExcerpts: [
        {
          excerpt:
            'Curated collection of DESIGN.md files inspired by developer focused websites.',
          translation: '收录了一组受开发者网站启发的 DESIGN.md 精选集合。',
        },
        {
          excerpt:
            'Copy a DESIGN.md into your project, tell your AI agent "build me a page that looks like this" and get pixel-perfect UI that actually matches.',
          translation:
            '把一个 DESIGN.md 放进你的项目，再告诉 AI Agent “按这个风格给我做一个页面”，就能更直接地生成贴近目标设计的界面。',
        },
        {
          excerpt:
            "It's just a markdown file. No Figma exports, no JSON schemas, no special tooling.",
          translation:
            '它本质上只是一个 Markdown 文件，不依赖 Figma 导出、JSON Schema，或额外专用工具。',
        },
      ],
      showcaseEyebrow: '由 HagiCode 构建',
      showcaseTitle: 'Hagicode',
      showcaseLead:
        '这个画廊壳层沿用了 HagiCode 的 OpenSpec 工作流、多 Agent 并行执行，以及 Hero Dungeon 可视化交互思路。',
      showcaseCtaLabel: '访问 HagiCode',
      showcaseCtaHref: siteMeta.hagicodeWebsite,
      showcasePrev: '上一张',
      showcaseNext: '下一张',
      showcaseJumpLabel: '跳转到第',
      showcaseSlides: [
        {
          title: 'OpenSpec 工作流',
          description: '把想法、提案、设计、任务、实现与归档放进同一条连续链路里。',
          imageSrc: '/img/hagicode/light-main.png',
          imageAlt: 'HagiCode 浅色主题主界面截图',
        },
        {
          title: '多 Agent 工作台',
          description: '不同 Agent 可并行起草、修复与审阅，不再被单线程串行等待卡住。',
          imageSrc: '/img/hagicode/multi-agent-workspace.svg',
          imageAlt: 'HagiCode 多 Agent 工作台插画',
        },
        {
          title: 'Hero Dungeon 视图',
          description: '用地牢、队长与可视化工作台组织长时间运行的 AI 编码协作。',
          imageSrc: '/img/hagicode/hero-dungeon-workspace.svg',
          imageAlt: 'HagiCode Hero Dungeon 工作台插画',
        },
      ],
      emptyKicker: '暂无可用设计',
      emptyTitle: '画廊壳层已就绪，但上游内容尚未初始化。',
      emptyCopy:
        '先执行 `git submodule update --init --recursive` 初始化子模块，再重新构建站点。',
    },
    card: {
      preview: '预览',
      lightDark: '浅色 + 深色',
      fallbackAware: '含回退',
    },
    search: {
      searchCatalog: '搜索画廊',
      indexedNounSingular: '个设计',
      indexedNounPlural: '个设计',
      indexedSuffix: '已收录',
      resultNounSingular: '个结果',
      resultNounPlural: '个结果',
      resultPrefix: '匹配',
      note: '标题、摘要、README 与 DESIGN 正文都会参与搜索。',
      keywordLabel: '关键词',
      placeholder: '搜索 Stripe、文档、金融科技、渐变…',
      noMatchingTitle: '没有匹配结果',
      noMatchingCopy: '清空当前关键词，即可恢复完整画廊。',
      clearSearch: '清空搜索',
    },
    detail: {
      pageTitleSuffix: 'Awesome Design MD 画廊',
      backToGallery: '返回画廊',
      kicker: '设计详情',
      slugPrefix: '标识：',
      readmeRendered: 'README 已渲染',
      designRendered: 'DESIGN 已渲染',
    },
    preview: {
      kicker: '实时预览',
      heading: '预览效果',
      light: '浅色',
      dark: '深色',
      openDarkTitle: '打开深色预览',
      fallbackDarkTitle: '深色模式将回退到现有预览',
      bothAvailableNote: '此条目同时提供浅色与深色预览资源。',
      fallbackNote: '此条目的深色模式会回退到当前可用的预览资源。',
    },
    documents: {
      kicker: '文档',
      heading: 'README & DESIGN',
      readme: 'README',
      design: 'DESIGN',
      copyDesign: '复制 DESIGN.md',
      copyDesignTitle: '复制原始 DESIGN.md Markdown',
      copied: '已复制',
      copyFailed: '复制失败',
    },
    adjacent: {
      previous: '上一个',
      next: '下一个',
    },
  },
};

export function getGalleryNav(locale: SupportedLocale): NavItem[] {
  const chrome = localeCopy[locale].chrome;

  return [
    { label: chrome.galleryLabel, href: getLocaleHomePath(locale) },
    { label: chrome.siteRepoLabel, href: siteMeta.repository },
    { label: chrome.sourceRepoLabel, href: siteMeta.sourceRepository },
  ];
}

export function getFooterLinks(locale: SupportedLocale): NavItem[] {
  return resolveAwesomeDesignFooterSiteLinks(locale);
}

export function getFooterMetaLinks(locale: SupportedLocale): NavItem[] {
  const chrome = localeCopy[locale].chrome;

  return [
    { label: chrome.galleryLabel, href: getLocaleHomePath(locale) },
    { label: chrome.siteRepoLabel, href: siteMeta.repository },
    { label: chrome.sourceRepoLabel, href: siteMeta.sourceRepository },
  ];
}

export function getLanguageLinks(currentPath: string): LanguageLink[] {
  return [
    {
      label: localeCopy.en.chrome.languageEnglish,
      href: toLocalePath(currentPath, 'en'),
      locale: 'en',
    },
    {
      label: localeCopy['zh-CN'].chrome.languageChinese,
      href: toLocalePath(currentPath, 'zh-CN'),
      locale: 'zh-CN',
    },
  ];
}

export function getLocaleHomePath(locale: SupportedLocale): string {
  return locale === 'en' ? '/' : '/zh-CN/';
}

export function toLocalePath(currentPath: string, locale: SupportedLocale): string {
  const basePath = stripLocalePrefix(normalizeInternalPath(currentPath));

  if (locale === 'en') {
    return basePath;
  }

  return basePath === '/' ? '/zh-CN/' : `/zh-CN${basePath}`;
}

export function stripLocalePrefix(path: string): string {
  const normalized = normalizeInternalPath(path);

  if (normalized === '/zh-CN' || normalized === '/en') {
    return '/';
  }

  if (normalized.startsWith('/zh-CN/')) {
    return normalized.slice('/zh-CN'.length) || '/';
  }

  if (normalized.startsWith('/en/')) {
    return normalized.slice('/en'.length) || '/';
  }

  return normalized;
}

export function getHomeDescription(locale: SupportedLocale, count: number): string {
  return locale === 'en'
    ? count > 0
      ? `${count} design references indexed from the awesome-design-md source repository.`
      : 'A static gallery for awesome-design-md previews, README files, and DESIGN documentation.'
    : count > 0
      ? `已从 awesome-design-md 上游仓库收录 ${count} 个设计参考条目。`
      : '一个用于浏览 awesome-design-md 预览、README 与 DESIGN 文档的静态画廊站点。';
}

export function getDetailDescription(locale: SupportedLocale, title: string): string {
  return locale === 'en'
    ? `${title} preview, README, and DESIGN documentation.`
    : `${title} 的预览、README 与 DESIGN 文档详情。`;
}

export function toAbsoluteSiteUrl(path: string, site?: URL | string): string {
  const siteUrl =
    typeof site === 'string' ? new URL(site) : site ?? new URL('https://design.hagicode.com');
  return new URL(path, siteUrl).toString();
}

function normalizeInternalPath(path: string): string {
  if (!path) {
    return '/';
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return new URL(path).pathname || '/';
  }

  return path.startsWith('/') ? path : `/${path}`;
}
