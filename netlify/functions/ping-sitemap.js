const https = require("https");

function pingUrl(url) {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        resolve({ url, status: res.statusCode });
      })
      .on("error", (err) => {
        resolve({ url, error: err.message });
      });
  });
}

exports.handler = async function (event, context) {
  const sitemapUrl = "https://askbobai.org/sitemap.xml";

  const pingTargets = [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
  ];

  const results = await Promise.all(pingTargets.map(pingUrl));

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Sitemap ping complete",
      sitemap: sitemapUrl,
      results,
    }),
  };
};
