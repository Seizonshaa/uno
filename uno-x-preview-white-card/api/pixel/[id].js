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
  const host = req.headers.host || "unopixels.vercel.app";
  const protocol = host.includes("localhost") ? "http" : "https";
  const siteUrl = `${protocol}://${host}`;
  const homeUrl = `${siteUrl}/`;

  if (!id) {
    res.writeHead(302, { Location: homeUrl });
    res.end();
    return;
  }

  try {
    const apiUrl = `${SUPABASE_URL}/rest/v1/pixels?id=eq.${encodeURIComponent(id)}&select=*`;
    const response = await fetch(apiUrl, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    const rows = await response.json();
    const pixel = rows && rows[0];

    if (!pixel) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(`<!doctype html>
<html>
<head>
  <title>UNO Pixel Not Found</title>
  <meta name="robots" content="noindex">
</head>
<body style="background:#05070c;color:white;font-family:Arial;padding:40px">
  <h1>UNO pixel not found</h1>
  <p>This pixel does not exist yet.</p>
  <a style="color:#22d3ee" href="/">Go to UNO</a>
</body>
</html>`);
      return;
    }

    const nickname = escapeHtml(pixel.nickname || "anonymous");
    const message = escapeHtml(pixel.message || "I claimed my UNO pixel.");
    const image = `${siteUrl}/api/og/${encodeURIComponent(id)}.png`;
    const pageUrl = `${siteUrl}/pixel/${encodeURIComponent(id)}`;
    const title = `${nickname}'s UNO Pixel`;

    res.statusCode = 200;
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
  <meta property="og:image:alt" content="${title}">
  <meta property="og:site_name" content="UNO">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${message}">
  <meta name="twitter:image" content="${image}">

  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#05070c;color:white;font-family:Inter,Arial,sans-serif}
    .card{width:min(440px,calc(100vw - 32px));padding:24px;border:1px solid rgba(255,255,255,.14);border-radius:28px;background:rgba(15,18,28,.92);box-shadow:0 30px 100px rgba(0,0,0,.55);text-align:center}
    img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:22px;image-rendering:auto}
    h1{letter-spacing:-.05em}
    p{color:#a3a8ba}
    a{display:inline-block;margin-top:12px;padding:13px 18px;border-radius:16px;background:linear-gradient(135deg,#22d3ee,#b45cff);color:#06101a;text-decoration:none;font-weight:800}
  </style>
</head>
<body>
  <main class="card">
    <img src="${image}" alt="${title}">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/">Open UNO</a>
  </main>
</body>
</html>`);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<!doctype html><html><body><h1>UNO preview error</h1><p>${escapeHtml(error.message)}</p></body></html>`);
  }
}
