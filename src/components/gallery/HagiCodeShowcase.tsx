import { startTransition, useEffect, useEffectEvent, useState } from 'react';
import { localeCopy, type SupportedLocale } from '@/config/site';

interface Props {
  locale?: SupportedLocale;
}

export default function HagiCodeShowcase({ locale = 'en' }: Props) {
  const copy = localeCopy[locale].home;
  const slides = copy.showcaseSlides;
  const [activeIndex, setActiveIndex] = useState(0);

  const stepSlide = useEffectEvent((direction: number) => {
    startTransition(() => {
      setActiveIndex((current) => (current + direction + slides.length) % slides.length);
    });
  });

  useEffect(() => {
    if (slides.length < 2) {
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const timerId = window.setInterval(() => {
      stepSlide(1);
    }, 4800);

    return () => window.clearInterval(timerId);
  }, [slides.length, stepSlide]);

  return (
    <section className="gallery-showcase shell-panel" aria-label={copy.showcaseTitle}>
      <div className="gallery-showcase-head">
        <div>
          <p className="gallery-meta-label">{copy.showcaseEyebrow}</p>
          <h2>{copy.showcaseTitle}</h2>
        </div>
        {slides.length > 1 ? (
          <div className="preview-switcher-controls">
            <button
              type="button"
              className="gallery-showcase-nav"
              onClick={() => stepSlide(-1)}
              aria-label={copy.showcasePrev}
            >
              {copy.showcasePrev}
            </button>
            <button
              type="button"
              className="gallery-showcase-nav"
              onClick={() => stepSlide(1)}
              aria-label={copy.showcaseNext}
            >
              {copy.showcaseNext}
            </button>
          </div>
        ) : null}
      </div>

      <p className="gallery-showcase-copy">{copy.showcaseLead}</p>
      <a className="gallery-link-chip" href={copy.showcaseCtaHref} target="_blank" rel="noreferrer">
        {copy.showcaseCtaLabel}
      </a>

      <div className="gallery-showcase-stage" aria-live="polite">
        {slides.map((slide, index) => (
          <article
            className={`gallery-showcase-slide ${index === activeIndex ? 'is-active' : ''}`}
            key={slide.title}
            aria-hidden={index === activeIndex ? undefined : 'true'}
          >
            <div className="gallery-showcase-media">
              <img
                src={slide.imageSrc}
                alt={slide.imageAlt}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </div>
            <div className="gallery-showcase-body">
              <h3>{slide.title}</h3>
              <p>{slide.description}</p>
            </div>
          </article>
        ))}
      </div>

      {slides.length > 1 ? (
        <div className="preview-switcher-controls">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              className={`gallery-showcase-nav ${index === activeIndex ? 'is-active' : ''}`}
              onClick={() => {
                startTransition(() => {
                  setActiveIndex(index);
                });
              }}
              aria-label={`${copy.showcaseJumpLabel} ${index + 1}`}
              aria-pressed={index === activeIndex}
            >
              {index + 1}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
