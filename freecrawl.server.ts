/**
 * Free replacement for the old Lovable/Firecrawl connector.
 * It uses ordinary HTTP fetches, robots.txt, sitemap.xml and same-domain links.
 * This intentionally avoids a paid crawling API.
 */

export type SearchResult = { url: string; title?: string; description?: string };
export type ScrapedPage = { url: string; title: string; markdown: string };

const USER_AGENT = "Eduvanta-University-Intelligence/1.0 (+https://eduvantaglobal.com)";

function absoluteUrl(base: string, href: string): string | null {
  try {
    const u = new URL(href, base);
    if (!/^https?:$/.test(u.protocol)) return null;
    u.hash = "";
    return u.toString();
  } catch { return null; }
}

function cleanText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/section|\/article)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function titleFromHtml(html: string, fallback: string) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? cleanText(m[1]).slice(0, 300) : fallback;
}

async function fetchText(url: string, timeoutMs = 20000): Promise<{ text: string; contentType: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml,application/xml,text/xml,*/*;q=0.8" },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { text: await res.text(), contentType: res.headers.get("content-type") || "" };
  } finally { clearTimeout(timer); }
}

export async function freecrawlSearch(_query: string, _limit = 6): Promise<SearchResult[]> {
  // Search is now handled by Gemini's free Google Search grounding in research.server.ts.
  return [];
}

export async function freecrawlMap(url: string, search?: string, limit = 200): Promise<string[]> {
  const root = new URL(url);
  const host = root.hostname.replace(/^www\./, "");
  const candidates = new Set<string>();
  const add = (href: string) => {
    const u = absoluteUrl(url, href);
    if (!u) return;
    const parsed = new URL(u);
    if (parsed.hostname.replace(/^www\./, "") !== host) return;
    if (/\.(jpg|jpeg|png|gif|svg|webp|zip|mp4|css|js|woff2?|ttf|ico|pdf)$/i.test(parsed.pathname)) return;
    if (search) {
      const words = search.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const haystack = `${parsed.pathname} ${parsed.search}`.toLowerCase();
      if (words.length && !words.some((w) => haystack.includes(w))) return;
    }
    candidates.add(u);
  };

  for (const path of ["/sitemap.xml", "/sitemap_index.xml"]) {
    try {
      const { text } = await fetchText(new URL(path, root).toString(), 12000);
      for (const m of text.matchAll(/<loc[^>]*>([\s\S]*?)<\/loc>/gi)) add(m[1].trim());
    } catch { /* sitemap optional */ }
  }

  try {
    const { text } = await fetchText(url);
    for (const m of text.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi)) add(m[1]);
  } catch { /* homepage optional */ }

  candidates.add(url);
  return [...candidates].slice(0, limit);
}

export async function freecrawlScrape(url: string): Promise<ScrapedPage> {
  const { text, contentType } = await fetchText(url, 30000);
  if (!/html|xhtml|text\//i.test(contentType) && !/<html/i.test(text)) {
    throw new Error("Unsupported page format");
  }
  return { url, title: titleFromHtml(text, url), markdown: cleanText(text) };
}
