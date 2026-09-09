import { localeCopy, type SupportedLocale } from '@/config/site';
import {
  getHomepageFallbackProvider,
  getVideoEmbedUrl,
  type VideoProvider,
  type VideoShowcaseItem,
} from '@/components/gallery/video-promo-model';

interface Props {
  locale: SupportedLocale;
}

export default function VideoPromo({ locale }: Props) {
  const copy = localeCopy[locale].home;
  const featuredProvider = getHomepageFallbackProvider(locale);
  const providers: VideoProvider[] = [featuredProvider, featuredProvider === 'youtube' ? 'bilibili' : 'youtube'];
  const videos = copy.videoPromoProviders as Record<VideoProvider, Omit<VideoShowcaseItem, 'provider'>>;
  const featuredVideo: VideoShowcaseItem = { provider: featuredProvider, ...videos[featuredProvider] };
  const alternateVideo: VideoShowcaseItem = { provider: providers[1], ...videos[providers[1]] };

  return (
    <section className="gallery-video-promo" aria-labelledby="gallery-video-promo-title">
      <div className="gallery-video-promo-heading">
        <h3 id="gallery-video-promo-title">{copy.videoPromoTitle}</h3>
        <p>{copy.videoPromoDescription}</p>
      </div>
      <div className="gallery-video-promo-featured">
        <span className="gallery-video-promo-platform">{featuredVideo.title}</span>
        <div className="gallery-video-promo-frame">
          <iframe
            src={getVideoEmbedUrl(featuredVideo)}
            title={featuredVideo.title}
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox={featuredProvider === 'bilibili' ? 'allow-scripts allow-same-origin allow-presentation' : undefined}
          />
        </div>
        <p>{featuredVideo.description}</p>
        <a href={featuredVideo.watchUrl} target="_blank" rel="noreferrer">
          {featuredVideo.ctaLabel}
        </a>
      </div>
      <a className="gallery-video-promo-alternate" href={alternateVideo.watchUrl} target="_blank" rel="noreferrer">
        {alternateVideo.ctaLabel}
      </a>
    </section>
  );
}