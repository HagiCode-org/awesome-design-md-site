export type SupportedLocale = 'en' | 'zh-CN';

export interface NavItem {
  label: string;
  href: string;
}

export interface MetricItem {
  value: string;
  label: string;
}

export interface FeatureItem {
  title: string;
  description: string;
}

export interface StepItem {
  title: string;
  description: string;
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
  features: FeatureItem[];
  steps: StepItem[];
}

export const siteMeta = {
  name: 'Awesome Design MD Site',
  shortName: 'ADMS',
  repository: 'https://github.com/HagiCode-org/awesome-design-md-site',
};

export const homeContent: Record<SupportedLocale, HomeContent> = {
  en: {
    lang: 'en',
    title: 'Awesome Design MD Site',
    description:
      'A polished Astro starter for design-heavy markdown sites, with bilingual routing, MDX support, and a site-like marketing shell.',
    eyebrow: 'Astro starter inspired by repos/site',
    heroTitle: 'Build a design-driven markdown site without rebuilding the foundation.',
    heroLead:
      'This template keeps the useful parts from the HagiCode site stack: Astro-first rendering, React islands, MDX-ready content, bilingual routes, and a presentable landing shell.',
    heroNote: 'Replace copy, wire content collections later, and keep shipping.',
    primaryCtaLabel: 'Read the guide',
    primaryCtaHref: '/guide/getting-started',
    secondaryCtaLabel: 'Open GitHub',
    secondaryCtaHref: 'https://github.com/HagiCode-org/awesome-design-md-site',
    nav: [
      { label: 'Home', href: '/' },
      { label: 'Guide', href: '/guide/getting-started' },
      { label: 'Chinese', href: '/zh-CN/' },
      { label: 'GitHub', href: 'https://github.com/HagiCode-org/awesome-design-md-site' },
    ],
    metrics: [
      { value: 'Astro 6', label: 'Static-first shell' },
      { value: 'MDX', label: 'Markdown with components' },
      { value: '2 locales', label: 'English and Chinese' },
    ],
    features: [
      {
        title: 'Site-style project layout',
        description: 'Configuration, sections, and shared styles are split cleanly so the repo stays readable when the site grows.',
      },
      {
        title: 'React only where it helps',
        description: 'Interactive pieces use islands instead of forcing the whole site into client rendering.',
      },
      {
        title: 'Design system first',
        description: 'Color tokens, spacing, typography, and surfaces are ready before content starts sprawling.',
      },
      {
        title: 'Markdown-friendly routes',
        description: 'Drop in `.md` or `.mdx` pages now, and later migrate to content collections when the information architecture settles.',
      },
    ],
    steps: [
      {
        title: 'Tune metadata',
        description: 'Set `SITE_URL`, page titles, and repository links before shipping preview builds.',
      },
      {
        title: 'Replace showcase copy',
        description: 'Swap the sample sections with your own product narrative and screenshots.',
      },
      {
        title: 'Scale content',
        description: 'Add docs, blog, or collections once the structure becomes clear enough to formalize.',
      },
    ],
  },
  'zh-CN': {
    lang: 'zh-CN',
    title: 'Awesome Design MD Site',
    description:
      '一个参考 repos/site 抽出的 Astro 模板，适合做偏设计感的 Markdown 站点，含双语路由、MDX 与可直接扩展的落地页壳层。',
    eyebrow: '基于 repos/site 提炼',
    heroTitle: '先把站点骨架搭稳，再写内容。',
    heroLead:
      '此模板保留了 HagiCode 站点里真正有复用价值的部分：Astro 静态优先、React islands、MDX 支持、双语路径，以及一套可直接替换内容的首页结构。',
    heroNote: '先能跑，再细化。结构比堆组件重要。',
    primaryCtaLabel: '查看指南',
    primaryCtaHref: '/zh-CN/guide/getting-started',
    secondaryCtaLabel: '打开 GitHub',
    secondaryCtaHref: 'https://github.com/HagiCode-org/awesome-design-md-site',
    nav: [
      { label: '首页', href: '/zh-CN/' },
      { label: '指南', href: '/zh-CN/guide/getting-started' },
      { label: 'English', href: '/' },
      { label: 'GitHub', href: 'https://github.com/HagiCode-org/awesome-design-md-site' },
    ],
    metrics: [
      { value: 'Astro 6', label: '静态优先' },
      { value: 'MDX', label: '内容即页面' },
      { value: '双语', label: '中英双入口' },
    ],
    features: [
      {
        title: '沿用 site 的核心约定',
        description: '保留配置、分层和样式系统，不带入现有业务耦合，后续扩展更轻。',
      },
      {
        title: '交互按需上岛',
        description: '只有需要交互的局部走 React，默认仍是静态输出，性能更稳。',
      },
      {
        title: '先有设计变量',
        description: '颜色、间距、字体、表面层级先定义，后续页面不会越写越乱。',
      },
      {
        title: 'Markdown 直接可用',
        description: '当前即可新增 `.md` 和 `.mdx` 页面，信息架构稳定后再收敛到内容集合。',
      },
    ],
    steps: [
      {
        title: '先改站点信息',
        description: '优先设置 `SITE_URL`、标题、仓库链接与描述文案。',
      },
      {
        title: '替换示例区块',
        description: '把示例卖点、流程与按钮换成你的真实内容。',
      },
      {
        title: '再扩展内容层',
        description: '文档、博客、案例页都可后加，不必一开始就过度设计。',
      },
    ],
  },
};
