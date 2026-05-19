const SUPABASE_URL = "https://qieonhoyouewoffjjemp.supabase.co";
const SUPABASE_KEY = "sb_publishable_Tjhdj6sK_K3tEBd7eXYHYA_zPJyBF4j";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default async function handler(req, res) {
  const { id } = req.query || {};
  const host = req.headers.host;
  const protocol = host.includes("localhost") ? "http" : "https";
  const siteUrl = `${protocol}://${host}`;
  const pageUrl = `${siteUrl}/pixel/${encodeURIComponent(id)}`;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/pixels?id=eq.${encodeURIComponent(id)}&select=*`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    const rows = await response.json();
    const pixel = rows[0];

    if (!pixel) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end("<h1>UNO pixel not found</h1>");
      return;
    }

    const nickname = escapeHtml(pixel.nickname || "anonymous");
    const message = escapeHtml(pixel.message || "One pixel. One person. Forever.");
    const image = `${siteUrl}/api/og/${encodeURIComponent(id)}.png`;
    const title = `${nickname}'s UNO Pixel`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");

    res.end(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${message}">
<meta property="og:type" content="website">
<meta property="og:url" content="${pageUrl}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${message}">
<meta property="og:image" content="${image}">
<meta property="og:image:secure_url" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="UNO">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${message}">
<meta name="twitter:image" content="${image}">
<style>
body{margin:0;background:#05070c;color:white;font-family:Arial;display:grid;place-items:center;min-height:100vh}
a{color:#22d3ee}
.card{padding:28px;border-radius:24px;background:#111827;text-align:center}
</style>
</head>
<body>
<div class="card">
<h1>${title}</h1>
<p>${message}</p>
<a href="/">Open UNO</a>
</div>
</body>
</html>`);
  } catch (error) {
    res.statusCode = 500;
    res.end(error.message);
  }
}
