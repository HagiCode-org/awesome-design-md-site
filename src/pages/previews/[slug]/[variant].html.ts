import type { APIContext } from 'astro';
import {
  getAwesomeDesignCatalog,
  loadPublishedPreviewHtml,
  type PreviewVariant,
} from '@/lib/content/awesomeDesignCatalog';

export const prerender = true;

export async function getStaticPaths() {
  const catalog = await getAwesomeDesignCatalog();

  return catalog.entries.flatMap((entry) =>
    (['light', 'dark'] as const).map((variant) => ({
      params: {
        slug: entry.slug,
        variant,
      },
    })),
  );
}

export async function GET({ params }: APIContext) {
  const slug = params.slug;
  const variant = params.variant;

  if (!slug || (variant !== 'light' && variant !== 'dark')) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const html = await loadPublishedPreviewHtml(slug, variant as PreviewVariant);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
