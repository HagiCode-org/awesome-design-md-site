export interface OutlineItem {
  label: string;
  heading: HTMLElement;
}

/** Fewer sections than this and a jump strip is noise, not navigation. */
const MIN_OUTLINE_ITEMS = 2;

export function collectOutline(panel: HTMLElement): OutlineItem[] {
  return Array.from(panel.querySelectorAll<HTMLElement>('h2'))
    .map((heading) => ({ heading, label: (heading.textContent ?? '').trim() }))
    .filter((item) => item.label.length > 0);
}

/** Index of the last heading whose top edge has passed `threshold`, or -1 before the first one. */
export function pickActiveIndex(tops: number[], threshold: number): number {
  let active = -1;

  tops.forEach((top, index) => {
    if (top <= threshold) {
      active = index;
    }
  });

  return active;
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Keeps a strip of section buttons in sync with the active document panel and the scroll position.
 * `anchor` is the sticky bar the strip lives in; headings count as read once they pass its bottom edge.
 */
export function createDocOutline(nav: HTMLElement, anchor: HTMLElement) {
  let items: OutlineItem[] = [];
  let buttons: HTMLButtonElement[] = [];
  let activeIndex = -1;
  let frame = 0;

  const setActive = (index: number) => {
    if (index === activeIndex) {
      return;
    }

    activeIndex = index;
    buttons.forEach((button, buttonIndex) => {
      const active = buttonIndex === index;
      button.classList.toggle('is-active', active);

      if (active) {
        button.setAttribute('aria-current', 'location');
        // Move the strip itself rather than the page, so reading never jumps.
        const left = button.offsetLeft - (nav.clientWidth - button.offsetWidth) / 2;
        nav.scrollTo?.({ left: Math.max(0, left), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      } else {
        button.removeAttribute('aria-current');
      }
    });
  };

  const measure = () => {
    frame = 0;

    if (items.length === 0) {
      return;
    }

    const threshold = anchor.getBoundingClientRect().bottom + 24;
    setActive(
      pickActiveIndex(
        items.map((item) => item.heading.getBoundingClientRect().top),
        threshold,
      ),
    );
  };

  const schedule = () => {
    if (!frame) {
      frame = window.requestAnimationFrame(measure);
    }
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);

  return {
    show(panel: HTMLElement | null) {
      items = panel ? collectOutline(panel) : [];
      activeIndex = -1;
      nav.replaceChildren();
      buttons = [];

      const visible = items.length >= MIN_OUTLINE_ITEMS;
      nav.hidden = !visible;

      if (!visible) {
        return;
      }

      buttons = items.map((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'detail-outline-link';
        button.textContent = item.label;
        button.title = item.label;
        button.addEventListener('click', () => {
          item.heading.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
        });
        return button;
      });
      nav.append(...buttons);
      nav.scrollTo?.({ left: 0 });
      schedule();
    },
  };
}
