import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { gaEventAttributes } from '@hagicode/hagilight-core/analytics-events';
import { interpolate } from '@/i18n';
import { localeCopy, type SupportedLocale } from '@/config/site';
import { getExternalLinkRel } from '@/lib/link-policy';
import type { FusionStage } from '@/lib/content/fusionHeroData';
import './FusionHero.css';

interface Props {
  locale?: SupportedLocale;
  stages: FusionStage[];
  entryCount: number;
  catalogHref?: string;
}

// Click tracking: stable ids (never localized text) so reports can compare locales.
const GA_LOCATION = 'design_hero';
const gaBrowse = gaEventAttributes({ category: 'navigation', label: 'heroBrowse', location: GA_LOCATION });
const gaHagicode = gaEventAttributes({ category: 'navigation', label: 'heroHagicode', location: GA_LOCATION });

type ThemeName = 'light' | 'dark';

type StyleVars = CSSProperties & Record<`--${string}`, string | number>;

function readTheme(): ThemeName {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function ArrowDown() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M8 2.5v10M3.5 8.5 8 13l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
    </svg>
  );
}

function ArrowUpRight() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <rect x="3.5" y="3" width="3" height="10" fill="currentColor" />
      <rect x="9.5" y="3" width="3" height="10" fill="currentColor" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M4.5 3v10L13 8z" fill="currentColor" />
    </svg>
  );
}

export default function FusionHero({ locale = 'en', stages, entryCount, catalogHref = '#gallery-catalog' }: Props) {
  const copy = localeCopy[locale];
  const fx = copy.home.fusion;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<ThemeName>('dark');
  const stageRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const stage = stages[index];
  const count = String(entryCount);

  // Theme, reduced motion and off-screen pausing. All of it is progressive: the SSR markup is already the finished state.
  useEffect(() => {
    setMounted(true);
    setTheme(readTheme());

    const themeObserver = new MutationObserver(() => setTheme(readTheme()));
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setPlaying(false);
    }

    const root = stageRef.current;
    const visibility =
      root && 'IntersectionObserver' in window
        ? new IntersectionObserver(
            ([entry]) => {
              root.dataset.offscreen = entry.isIntersecting ? 'false' : 'true';
            },
            { threshold: 0.15 },
          )
        : null;
    if (root) {
      visibility?.observe(root);
    }

    return () => {
      themeObserver.disconnect();
      visibility?.disconnect();
    };
  }, []);

  // Advance when the active tab's clock animation finishes. If it already finished before hydration, move on shortly.
  useEffect(() => {
    if (!playing || stages.length < 2) {
      return undefined;
    }

    const advance = () => setIndex((current) => (current + 1) % stages.length);
    const animations = clockRef.current?.getAnimations?.() ?? [];

    if (animations.length === 0) {
      const timer = window.setTimeout(advance, 1500);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    animations[0].finished
      .then(() => {
        if (!cancelled) {
          advance();
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [index, playing, stages.length]);

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = stages.length - 1;
    const keys: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const next = keys[event.key];

    if (next === undefined) {
      return;
    }

    event.preventDefault();
    setIndex(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section className="fx-hero container" aria-labelledby="fx-title">
      <div className="fx-grid" data-has-stage={stage ? 'true' : 'false'}>
        <div className="fx-copy">
          <h1 id="fx-title">
            <span>{fx.titleLead}</span>
            <span className="fx-accent">{fx.titleAccent}</span>
          </h1>
          <p className="fx-lead">{interpolate(fx.lead, { count })}</p>
          <div className="fx-actions">
            <a className="button-primary fx-cta" href={catalogHref} {...gaBrowse}>
              {interpolate(fx.primaryCta, { count })}
              <ArrowDown />
            </a>
            <a
              className="button-secondary fx-cta"
              href={copy.home.showcaseCtaHref}
              target="_blank"
              rel={getExternalLinkRel(copy.home.showcaseCtaHref)}
              {...gaHagicode}
            >
              {fx.secondaryCta}
              <ArrowUpRight />
            </a>
          </div>
        </div>

        {stage ? (
          <div className="fx-stage-wrap">
            <div
              ref={stageRef}
              className="fx-stage shell-panel"
              data-playing={playing ? 'true' : 'false'}
              role="group"
              aria-label={fx.stageLabel}
            >
              <div className="fx-tabbar">
                <div className="fx-tabs" role="tablist" aria-label={fx.tabsLabel} onKeyDown={onTabKeyDown}>
                  {stages.map((item, i) => (
                    <button
                      key={item.slug}
                      ref={(node) => {
                        tabRefs.current[i] = node;
                      }}
                      type="button"
                      role="tab"
                      id={`fx-tab-${i}`}
                      className="fx-tab"
                      aria-selected={i === index}
                      aria-controls="fx-panel"
                      tabIndex={i === index ? 0 : -1}
                      onClick={() => setIndex(i)}
                    >
                      {item.title}
                      {i === index ? (
                        <span key={item.slug} ref={clockRef} className="fx-tab-clock fx-anim" aria-hidden="true" />
                      ) : null}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="fx-toggle"
                  aria-label={playing ? fx.stop : fx.play}
                  title={playing ? fx.stop : fx.play}
                  onClick={() => setPlaying((value) => !value)}
                >
                  {playing ? <PauseGlyph /> : <PlayGlyph />}
                </button>
              </div>

              <div key={stage.slug} id="fx-panel" className="fx-run" role="tabpanel" aria-labelledby={`fx-tab-${index}`}>
                <div className="fx-body">
                  <div className="fx-doc">
                    <div className="fx-pane-bar">
                      <span className="fx-file">DESIGN.md</span>
                      <span className="fx-path">{stage.slug}</span>
                    </div>
                    <pre className="fx-lines">
                      <code>
                        {stage.lines.map((line, i) => (
                          <span
                            key={`${line.kind}-${i}`}
                            className={`fx-line fx-line-${line.kind} fx-anim`}
                            style={{ '--i': i } as StyleVars}
                          >
                            {line.text}
                          </span>
                        ))}
                      </code>
                    </pre>
                    {stage.palette.length > 0 ? (
                      <ul className="fx-palette">
                        {stage.palette.map((hex, i) => (
                          <li key={hex} className="fx-swatch fx-anim" style={{ '--i': i, '--c': hex } as StyleVars}>
                            <span className="fx-chip" aria-hidden="true" />
                            {hex}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="fx-ui">
                    <div className="fx-bands" aria-hidden="true">
                      {(stage.palette.length > 0 ? stage.palette : ['#faff69']).map((hex, i) => (
                        <span key={hex} className="fx-band fx-anim" style={{ '--i': i, '--c': hex } as StyleVars} />
                      ))}
                    </div>
                    <div className="fx-frame fx-anim">
                      <iframe
                        title={interpolate(copy.preview.frameTitle, { title: stage.title })}
                        src={mounted ? (theme === 'light' ? stage.lightUrl : stage.darkUrl) : undefined}
                        sandbox="allow-same-origin allow-scripts"
                        tabIndex={-1}
                      />
                    </div>
                    <span className="fx-scan fx-anim" aria-hidden="true" />
                    <a className="fx-open" href={stage.href} aria-label={interpolate(fx.openDesign, { title: stage.title })}>
                      <span className="fx-open-chip" aria-hidden="true">
                        {stage.title}
                        <ArrowUpRight />
                      </span>
                    </a>
                  </div>
                </div>

                <div className="fx-footer">
                  <p className="fx-prompt">
                    <span className="fx-prompt-mark" aria-hidden="true">
                      ›
                    </span>
                    <span className="fx-prompt-text fx-anim" style={{ '--n': Array.from(fx.prompt).length } as StyleVars}>
                      {fx.prompt}
                    </span>
                  </p>
                  <div className="fx-pipeline">
                    <span className="fx-brand">
                      <img src="/logo.png" alt="" width="20" height="20" />
                      HagiCode
                    </span>
                    <ol className="fx-steps" aria-label={fx.pipelineLabel}>
                      {fx.steps.map((label, i) => (
                        <li key={label} className="fx-step fx-anim" style={{ '--i': i } as StyleVars}>
                          {label}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
            <p className="fx-note">{fx.note}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
