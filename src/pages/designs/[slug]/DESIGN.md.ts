import type { APIContext } from 'astro';
import {
  getAwesomeDesignCatalog,
  loadPublishedDesignMarkdown,
} from '@/lib/content/awesomeDesignCatalog';

export const prerender = true;

export async function getStaticPaths() {
  const catalog = await getAwesomeDesignCatalog();

  return catalog.entries.map((entry) => ({
    params: {
      slug: entry.slug,
    },
  }));
}

export async function GET({ params }: APIContext) {
  const slug = params.slug;

  if (!slug) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const markdown = await loadPublishedDesignMarkdown(slug);

    return new Response(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': 'attachment; filename="DESIGN.md"; filename*=UTF-8\'\'DESIGN.md',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
