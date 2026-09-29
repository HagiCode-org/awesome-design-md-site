declare module '@hagicode/hagilight/rss' {
  export interface HagilightRssItem {
    title: string;
    description?: string;
    link: string;
    pubDate?: Date | string;
    date?: Date | string;
  }

  export function generateRssFeed(options: {
    site: URL | string;
    baseUrl?: string;
    language?: string;
    title: string;
    description: string;
    items: HagilightRssItem[];
  }): Promise<Response>;
}
