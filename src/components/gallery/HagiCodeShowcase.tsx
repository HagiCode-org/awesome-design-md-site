import React from 'react';
import { localeCopy, type SupportedLocale } from '@/config/site';
import VideoPromo from '@/components/gallery/VideoPromo';

interface Props {
  locale?: SupportedLocale;
}

const storeBadgeLanguages: Record<SupportedLocale, string> = {
  en: 'en-us',
  'zh-CN': 'zh-cn',
  'zh-Hant': 'zh-tw',
  'ja-JP': 'ja',
  'ko-KR': 'ko',
  'de-DE': 'de',
  'fr-FR': 'fr',
  'es-ES': 'es',
  'pt-BR': 'pt-br',
  'ru-RU': 'ru',
};

export default function HagiCodeShowcase({ locale = 'en' }: Props) {
  const copy = localeCopy[locale].home;
  const storeBadgeLanguage = storeBadgeLanguages[locale];

  return (
    <section className="gallery-showcase shell-panel" aria-label={copy.showcaseTitle}>
      <div className="gallery-showcase-content">
        <div className="gallery-showcase-head">
          <div>
            <p className="gallery-meta-label">{copy.showcaseEyebrow}</p>
            <h2>{copy.showcaseTitle}</h2>
          </div>
        </div>

        <div className="gallery-showcase-copy">
          <p>{copy.showcaseLead}</p>
          <p>{copy.showcaseSubHeadline}</p>
        </div>

        <ul className="gallery-showcase-triad" aria-label={copy.showcaseTitle}>
          {copy.showcaseTriad.map((item) => (
            <li key={item.label}>
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </li>
          ))}
        </ul>

        <div className="gallery-showcase-actions">
          <a
            className="gallery-showcase-cta button-primary"
            href={copy.showcaseCtaHref}
            target="_blank"
            rel="noreferrer"
            aria-label={copy.showcaseCtaLabel}
          >
            {copy.showcaseCtaLabel}
          </a>
          <a
            className="gallery-showcase-learn-more"
            href={copy.showcaseLearnMoreHref}
            target="_blank"
            rel="noreferrer"
            aria-label={copy.showcaseLearnMoreLabel}
          >
            {copy.showcaseLearnMoreLabel}
          </a>
          <span className="gallery-showcase-store" data-store-entry="gallery-hagicode">
            {React.createElement('ms-store-badge', {
              productid: '9N3PM0N3SVDW',
              productname: 'HagiCode',
              'window-mode': 'direct',
              theme: 'auto',
              size: 'small',
              language: storeBadgeLanguage,
              animation: 'on',
              'aria-label': 'Open HagiCode in Microsoft Store',
              title: 'Open HagiCode in Microsoft Store',
            })}
          </span>
        </div>
      </div>

      <VideoPromo locale={locale} />
    </section>
  );
}