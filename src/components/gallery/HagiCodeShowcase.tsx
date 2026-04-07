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
    <a
      className="gallery-showcase gallery-showcase-link shell-panel"
      href={copy.showcaseCtaHref}
      aria-label={copy.showcaseCtaLabel}
      target="_blank"
      rel="noreferrer"
    >
      <div className="gallery-showcase-head">
        <div>
          <p className="gallery-meta-label">{copy.showcaseEyebrow}</p>
          <h2>{copy.showcaseTitle}</h2>
        </div>
      </div>

      <p className="gallery-showcase-copy">{copy.showcaseLead}</p>

      <div className="gallery-showcase-stage">
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
    </a>
  );
}
