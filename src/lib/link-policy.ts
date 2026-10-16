/**
 * First-party link policy, mirrored from @hagicode/hagilight-core links.
 *
 * First-party: host `hagicode.com` or a subdomain of it, or `github.com/HagiCode-org/...`.
 * Relative and same-origin destinations count as first-party. Hosts are compared after parsing,
 * never by substring. New-tab first-party links keep the referring origin (`noopener`); every
 * other new-tab link is third-party and strips the referrer (`noopener noreferrer`).
 */

const SAME_ORIGIN_BASE = 'https://same-origin.invalid';

export function isFirstPartyHref(href: string): boolean {
  let url: URL;
  try {
    url = new URL(href, SAME_ORIGIN_BASE);
  } catch {
    return false;
  }
  if (url.origin === SAME_ORIGIN_BASE) return true;
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;

  const host = url.hostname.toLowerCase();
  if (host === 'hagicode.com' || host.endsWith('.hagicode.com')) return true;
  return host === 'github.com' && url.pathname.split('/')[1]?.toLowerCase() === 'hagicode-org';
}

/** `rel` for a link that opens a new tab. A missing destination is treated as third-party. */
export function getExternalLinkRel(href: string | null | undefined): 'noopener' | 'noopener noreferrer' {
  return href && isFirstPartyHref(href) ? 'noopener' : 'noopener noreferrer';
}
