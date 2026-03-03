import { NextRequest, NextResponse } from "next/server";

/** Extract a URL from a raw Instagram embed code (blockquote) if the user pasted it */
function extractInstagramUrlFromEmbed(input: string): string | null {
  const match = input.match(/data-instgrm-permalink=["']([^"'?]+)/i);
  return match?.[1] ?? null;
}

/** Returns true if the URL is an Instagram post/reel */
function isInstagramUrl(url: string): boolean {
  return /instagram\.com\/(p|reel|tv)\//i.test(url);
}

async function tryInstagramOEmbed(postUrl: string): Promise<string | null> {
  // Instagram's public oEmbed endpoint — returns thumbnail_url for public posts
  const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(postUrl)}&omitscript=true`;
  try {
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail_url ?? null;
  } catch {
    return null;
  }
}

async function tryOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(6000),
    });

    const html = await res.text();

    const ogMatch =
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch?.[1]) return ogMatch[1];

    const twitterMatch =
      html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
    if (twitterMatch?.[1]) return twitterMatch[1];

    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  let input = request.nextUrl.searchParams.get("url");
  if (!input) return NextResponse.json({ imageUrl: null });

  // If user pasted a full embed code, extract the post URL from it
  const embedExtracted = extractInstagramUrlFromEmbed(input);
  const url = embedExtracted ?? input;

  let imageUrl: string | null = null;

  if (isInstagramUrl(url)) {
    // Try Instagram's oEmbed endpoint first (returns thumbnail_url for public posts)
    imageUrl = await tryInstagramOEmbed(url);
  }

  // Fallback: og:image / twitter:image scraping (works for YouTube, TikTok, LinkedIn, etc.)
  if (!imageUrl) {
    imageUrl = await tryOgImage(url);
  }

  return NextResponse.json({ imageUrl });
}
