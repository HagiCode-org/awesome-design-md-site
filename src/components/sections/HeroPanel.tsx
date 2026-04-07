import type { HomeContent } from '@/config/site';

interface Props {
  content: HomeContent;
}

export default function HeroPanel({ content }: Props) {
  return (
    <section className="hero-grid">
      <div className="hero-copy shell-panel">
        <p className="hero-eyebrow">{content.eyebrow}</p>
        <h1>{content.heroTitle}</h1>
        <p className="hero-lead">{content.heroLead}</p>
        <div className="hero-actions">
          <a className="button-primary" href={content.primaryCtaHref}>
            {content.primaryCtaLabel}
          </a>
          <a className="button-secondary" href={content.secondaryCtaHref} target="_blank" rel="noreferrer">
            {content.secondaryCtaLabel}
          </a>
        </div>
        <p className="hero-note">{content.heroNote}</p>
      </div>

      <div className="hero-aside shell-panel">
        <div className="status-row">
          <span className="status-dot" />
          <span>Design system active</span>
        </div>
        <div className="code-card">
          <div className="code-head">
            <span>Starter checklist</span>
            <span>ready</span>
          </div>
          <pre>
            <code>{`npm install
npm run dev
edit src/config/site.ts
replace sample sections`}</code>
          </pre>
        </div>
        <div className="metric-list">
          {content.metrics.map((item) => (
            <article className="metric-card" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
