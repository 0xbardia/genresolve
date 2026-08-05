/**
 * Safe HTML / text extraction — no JS execution.
 */

export function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html: string, name: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`,
    "i"
  );
  const m = html.match(re) || html.match(re2);
  return m?.[1]?.trim() || null;
}

export function extractTitle(html: string): string | undefined {
  const og = metaContent(html, "og:title");
  if (og) return og.slice(0, 200);
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (m) return stripTags(m[1]).slice(0, 200) || undefined;
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return stripTags(h1[1]).slice(0, 200) || undefined;
  return undefined;
}

export function extractMetaDescription(html: string): string | undefined {
  const d =
    metaContent(html, "description") ||
    metaContent(html, "og:description") ||
    metaContent(html, "twitter:description");
  if (!d) return undefined;
  return stripTags(d).slice(0, 400);
}

/** First ~2 paragraph-ish blocks of text content. */
export function extractParagraphSnippets(html: string, maxLen = 400): string {
  const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => stripTags(m[1]))
    .filter((t) => t.length > 40);
  if (paras.length >= 2) {
    return `${paras[0]} ${paras[1]}`.slice(0, maxLen);
  }
  if (paras.length === 1) return paras[0].slice(0, maxLen);
  // Fallback: stripped body text
  return stripTags(html).slice(0, maxLen);
}

export function buildSnippet(html: string, isPlain = false): string {
  if (isPlain) {
    return html.replace(/\s+/g, " ").trim().slice(0, 400);
  }
  const meta = extractMetaDescription(html);
  if (meta && meta.length >= 40) return meta;
  return extractParagraphSnippets(html, 400);
}

export function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}
