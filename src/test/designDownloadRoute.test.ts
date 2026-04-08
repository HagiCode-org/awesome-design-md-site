import { afterEach, describe, expect, it, vi } from 'vitest';

const { getAwesomeDesignCatalog, loadPublishedDesignMarkdown } = vi.hoisted(() => ({
  getAwesomeDesignCatalog: vi.fn(),
  loadPublishedDesignMarkdown: vi.fn(),
}));

vi.mock('@/lib/content/awesomeDesignCatalog', () => ({
  getAwesomeDesignCatalog,
  loadPublishedDesignMarkdown,
}));

import { GET, getStaticPaths } from '@/pages/designs/[slug]/DESIGN.md';

describe('DESIGN download route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('publishes static paths for dotted slugs', async () => {
    getAwesomeDesignCatalog.mockResolvedValue({
      entries: [{ slug: 'linear.app' }, { slug: 'x.ai' }],
    });

    await expect(getStaticPaths()).resolves.toEqual([
      { params: { slug: 'linear.app' } },
      { params: { slug: 'x.ai' } },
    ]);
  });

  it('returns markdown with download-friendly headers', async () => {
    loadPublishedDesignMarkdown.mockResolvedValue('# Design\n');

    const response = await GET({
      params: { slug: 'linear.app' },
    } as never);

    await expect(response.text()).resolves.toBe('# Design\n');
    expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    expect(response.headers.get('Content-Disposition')).toContain('attachment; filename="DESIGN.md"');
    expect(loadPublishedDesignMarkdown).toHaveBeenCalledWith('linear.app');
  });

  it('returns not found when the slug cannot be resolved', async () => {
    loadPublishedDesignMarkdown.mockRejectedValue(new Error('Unknown design entry'));

    const response = await GET({
      params: { slug: 'missing.slug' },
    } as never);

    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toBe('Not found');
  });
});
