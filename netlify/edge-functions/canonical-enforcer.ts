import type { Context, Config } from "@netlify/edge-functions";

const CANONICAL_HOST = "askbobai.org";
const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);

  // 0) Strip .html extension → 301 to pretty URL (except bare /index.html)
  //    Google has discovered .html URL variants; canonicalize them
  //    aggressively to the pretty form so duplicate-signal noise clears.
  if (url.pathname.endsWith(".html") && url.pathname !== "/index.html") {
    const pretty = url.pathname.replace(/\.html$/, "");
    const targetHost = url.hostname === CANONICAL_HOST ? CANONICAL_ORIGIN : CANONICAL_ORIGIN;
    return new Response(null, {
      status: 301,
      headers: { Location: `${targetHost}${pretty}${url.search}` },
    });
  }
  if (url.pathname === "/index.html") {
    return new Response(null, {
      status: 301,
      headers: { Location: `${CANONICAL_ORIGIN}/${url.search}` },
    });
  }

  // 1) Non-canonical hostname → 301 redirect to canonical domain
  //    Covers: *.netlify.app, www.askbobai.org, deploy previews, etc.
  if (url.hostname !== CANONICAL_HOST) {
    const target = `${CANONICAL_ORIGIN}${url.pathname}${url.search}`;
    return new Response(null, {
      status: 301,
      headers: { Location: target },
    });
  }

  // 2) Trailing-slash normalization (except root "/")
  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    const cleanPath = url.pathname.replace(/\/+$/, "");
    return new Response(null, {
      status: 301,
      headers: { Location: `${CANONICAL_ORIGIN}${cleanPath}${url.search}` },
    });
  }

  // 3) Pass through to origin, then add HTTP-level canonical + SEO headers
  //    (netlify.toml headers are NOT applied to edge-function responses,
  //     so we replicate the essential ones here)
  const response = await context.next();

  const canonical =
    url.pathname === "/"
      ? `${CANONICAL_ORIGIN}/`
      : `${CANONICAL_ORIGIN}${url.pathname}`;

  // HTTP Link header — authoritative canonical signal alongside the HTML tag
  response.headers.set("Link", `<${canonical}>; rel="canonical"`);

  // SEO / security headers (mirror netlify.toml [[headers]] for "/*")
  response.headers.set("X-Robots-Tag", "index, follow");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin",
  );

  return response;
};

export const config: Config = {
  path: "/*",
  excludedPath: [
    "/.netlify/*",
    "/node_modules/*",
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
