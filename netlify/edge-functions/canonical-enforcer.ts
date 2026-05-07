import type { Context, Config } from "@netlify/edge-functions";

const CANONICAL_HOST = "askbobai.org";
const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;

/* Compute the canonical pathname for a request in a single pass so that
   any combination of non-canonical signals (wrong protocol, wrong host, .html suffix,
   /index.html, trailing slash) collapses to ONE 301 hop. Multi-hop
   chains caused Google Search Console to flag URL variants with
   "Page with redirect" — the validation failure this fix addresses. */
function canonicalPath(pathname: string): string {
  let p = pathname;

  if (p === "/index.html") return "/";
  if (p.endsWith("/index.html")) p = p.slice(0, -"index.html".length);
  if (p.endsWith(".html")) p = p.slice(0, -".html".length);
  if (p.length > 1) p = p.replace(/\/+$/, "");
  if (p === "") p = "/";

  return p;
}

function isHtml(response: Response): boolean {
  const contentType = response.headers.get("content-type") || "";
  return /^text\/html\b/i.test(contentType);
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const cleanPath = canonicalPath(url.pathname);

  const needsProtocolFix = url.protocol !== "https:";
  const needsHostFix = url.hostname !== CANONICAL_HOST;
  const needsPathFix = cleanPath !== url.pathname;

  if (needsProtocolFix || needsHostFix || needsPathFix) {
    const target = `${CANONICAL_ORIGIN}${cleanPath}${url.search}`;
    return new Response(null, {
      status: 301,
      headers: { Location: target },
    });
  }

  const response = await context.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  if (response.status >= 400) {
    response.headers.delete("Link");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  if (isHtml(response)) {
    const canonical =
      url.pathname === "/"
        ? `${CANONICAL_ORIGIN}/`
        : `${CANONICAL_ORIGIN}${url.pathname}`;

    response.headers.set("Link", `<${canonical}>; rel="canonical"`);
    response.headers.set("X-Robots-Tag", "index, follow");
  } else {
    response.headers.delete("Link");
    response.headers.delete("X-Robots-Tag");
  }

  return response;
};

export const config: Config = {
  path: "/*",
  excludedPath: [
    "/.netlify/*",
    "/node_modules/*",
    "/deno.lock",
    "/netlify.toml",
    "/netlify/*",
    "/package.json",
    "/package-lock.json",
    "/ads.txt",
    "/robots.txt",
    "/sitemap.xml",
    "/api/*",
    "/*.css",
    "/*.js",
    "/*.png",
    "/*.jpg",
    "/*.jpeg",
    "/*.gif",
    "/*.svg",
    "/*.ico",
    "/*.woff",
    "/*.woff2",
    "/*.ttf",
    "/*.webp",
    "/*.webmanifest",
  ],
  onError: "bypass",
};
