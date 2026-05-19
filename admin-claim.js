const SUPABASE_URL = "https://qieonhoyouewoffjjemp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Tjhdj6sK_K3tEBd7eXYHYA_zPJyBF4j";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const BUCKET = "pixel-images";
const MAX_PIXELS = 10000;

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data.");
  return {
    mime: match[1],
    buffer: Buffer.from(match[2], "base64")
  };
}

function safeFileName(name = "image.png") {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 80) || "image.png";
}

async function supabaseFetch(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase ${response.status}: ${text}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  return response.text();
}

async function getCount() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/pixels?select=id`, {
    method: "HEAD",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "count=exact"
    }
  });

  const range = response.headers.get("content-range") || "0-0/0";
  return Number(range.split("/").pop() || 0);
}

async function uploadImage(buffer, mime, folder, filename) {
  const path = `${folder}/${crypto.randomUUID()}-${safeFileName(filename)}`;

  await supabaseFetch(`/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": mime,
      "Cache-Control": "3600",
      "x-upsert": "false"
    },
    body: buffer
  });

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function createPixel({ imageUrl, nickname, message, source }) {
  const count = await getCount();

  if (count >= MAX_PIXELS) {
    throw new Error("UNO is full. All 10,000 pixels are claimed.");
  }

  const payload = {
    nickname: nickname || "anonymous",
    message: message || "",
    source: source || "manual-x",
    image_url: imageUrl,
    share_image_url: imageUrl,
    x: Math.round((Math.random() - 0.5) * 1000),
    y: Math.round((Math.random() - 0.5) * 1000),
    device_id: `${source || "admin"}-${crypto.randomUUID()}`,
    browser_fingerprint: `${source || "admin"}-${crypto.randomUUID()}`
  };

  const rows = await supabaseFetch(`/rest/v1/pixels`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify(payload)
  });

  return rows[0];
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      route: "/api/admin-claim",
      message: "UNO admin API is working."
    });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret) {
      return sendJson(res, 500, {
        error: "ADMIN_SECRET is missing in Vercel Environment Variables."
      });
    }

    const body = req.body || {};

    if (body.secret !== adminSecret) {
      return sendJson(res, 401, { error: "Wrong admin secret." });
    }

    const items = Array.isArray(body.items) ? body.items : [];

    if (!items.length) {
      return sendJson(res, 400, { error: "No images provided." });
    }

    const created = [];

    for (const item of items.slice(0, 25)) {
      const { mime, buffer } = parseDataUrl(item.imageData);

      if (!mime.startsWith("image/")) {
        throw new Error("Only image files are allowed.");
      }

      if (buffer.length > 3 * 1024 * 1024) {
        throw new Error("Image too large. Max 3MB.");
      }

      const imageUrl = await uploadImage(
        buffer,
        mime,
        item.source || "manual-x",
        item.name || "image.png"
      );

      const pixel = await createPixel({
        imageUrl,
        nickname: item.nickname || "anonymous",
        message: item.message || "",
        source: item.source || "manual-x"
      });

      created.push(pixel);
    }

    return sendJson(res, 200, { created });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, {
      error: error.message || "Admin upload failed."
    });
  }
};
