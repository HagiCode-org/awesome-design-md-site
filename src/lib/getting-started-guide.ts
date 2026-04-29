import type { SupportedLocale } from '@/config/site';

export interface GettingStartedGuideSection {
  title: string;
  items: string[];
}

export interface GettingStartedGuideContent {
  title: string;
  description: string;
  heading: string;
  intro: string;
  sections: GettingStartedGuideSection[];
  commandsTitle: string;
  commands: string[];
}

const englishGuide: GettingStartedGuideContent = {
  title: 'Getting Started',
  description: 'Setup notes for the Awesome Design MD Gallery Astro site shell.',
  heading: 'Getting Started',
  intro:
    'This site is a static Astro gallery shell for the upstream awesome-design-md catalog. English stays unprefixed, and the site shell now exposes the same Desktop-aligned locale range as HagiCode Desktop.',
  sections: [
    {
      title: 'What is included',
      items: [
        'Astro 6 static output with React islands for small interactive controls.',
        'Desktop-aligned locale routes for zh-CN, zh-Hant, ja-JP, ko-KR, de-DE, fr-FR, es-ES, pt-BR, and ru-RU.',
        'hagi18n YAML source files under src/i18n/locales and generated runtime resources under src/i18n/generated.',
        'Vendor gallery content from vendor/awesome-design-md stays outside the hagi18n UI source tree.',
      ],
    },
    {
      title: 'i18n workflow',
      items: [
        'Edit first-party UI strings and locale metadata in src/i18n/locales/<locale>/*.yml.',
        'Run npm run i18n:audit or npm run i18n:doctor before regenerating runtime resources.',
        'Run npm run i18n:generate to refresh src/i18n/generated/site-locale-resources.ts.',
        'Run npm run i18n:check to combine audit, doctor, generation, and stale-resource verification.',
      ],
    },
    {
      title: 'Shell stylesheet source of truth',
      items: [
        'Runtime shell and header styles live in public/global.css because BaseLayout.astro links /global.css directly.',
        'Treat src/styles/global.css as a reference copy unless the layout import path changes.',
      ],
    },
    {
      title: 'First edits',
      items: [
        'Update YAML locale sources instead of editing a hand-written localeCopy object.',
        'Point SITE_URL at the real deployment domain before production builds.',
        'Replace or extend the gallery shell sections in src/components and src/pages as needed.',
        'Keep generated runtime resources committed and refresh them after YAML changes.',
      ],
    },
  ],
  commandsTitle: 'Commands',
  commands: [
    'npm install',
    'git submodule update --init --recursive',
    'npm run i18n:check',
    'npm run test',
    'npm run typecheck',
    'SITE_URL=https://your-domain.example npm run build',
  ],
};

const simplifiedChineseGuide: GettingStartedGuideContent = {
  title: '快速开始',
  description: 'Awesome Design MD 画廊站点壳层的初始化说明。',
  heading: '快速开始',
  intro:
    '此站点是一个面向 awesome-design-md 上游目录的静态 Astro 画廊壳层。英文保持无前缀默认路由，站点壳层已扩展到与 HagiCode Desktop 一致的语言范围。',
  sections: [
    {
      title: '已包含',
      items: [
        'Astro 6 静态输出与少量 React islands 交互控件。',
        '与 Desktop 对齐的路由前缀：zh-CN、zh-Hant、ja-JP、ko-KR、de-DE、fr-FR、es-ES、pt-BR、ru-RU。',
        '位于 src/i18n/locales 的 hagi18n YAML 源文件，以及位于 src/i18n/generated 的运行时生成资源。',
        'vendor/awesome-design-md 下的上游画廊内容仍然属于内容源，不进入 hagi18n UI 源树。',
      ],
    },
    {
      title: 'i18n 维护流程',
      items: [
        '在 src/i18n/locales/<locale>/*.yml 中维护第一方 UI 文案与语言元数据。',
        '生成运行时资源前，先运行 npm run i18n:audit 或 npm run i18n:doctor。',
        '通过 npm run i18n:generate 刷新 src/i18n/generated/site-locale-resources.ts。',
        '通过 npm run i18n:check 串联 audit、doctor、生成与资源陈旧校验。',
      ],
    },
    {
      title: '壳层样式来源',
      items: [
        '运行时页头与壳层样式应修改 public/global.css，因为 BaseLayout.astro 直接链接 /global.css。',
        '除非布局导入路径发生变化，否则将 src/styles/global.css 视为参考副本。',
      ],
    },
    {
      title: '建议先做',
      items: [
        '修改 YAML 语言源，而不是回到手写 localeCopy 对象。',
        '生产构建前先把 SITE_URL 指向真实部署域名。',
        '按需调整 src/components 与 src/pages 中的画廊壳层结构。',
        'YAML 变更后同步提交生成后的运行时资源。',
      ],
    },
  ],
  commandsTitle: '命令',
  commands: [
    'npm install',
    'git submodule update --init --recursive',
    'npm run i18n:check',
    'npm run test',
    'npm run typecheck',
    'SITE_URL=https://your-domain.example npm run build',
  ],
};

export function getGettingStartedGuideContent(locale: SupportedLocale): GettingStartedGuideContent {
  return locale === 'zh-CN' ? simplifiedChineseGuide : englishGuide;
}
