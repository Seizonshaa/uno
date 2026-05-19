const SUPABASE_URL = "https://qieonhoyouewoffjjemp.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_publishable_Tjhdj6sK_K3tEBd7eXYHYA_zPJyBF4j";
const BUCKET = "pixel-images";

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data");
  return {
    mime: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

async function supabaseFetch(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const type = response.headers.get("content-type") || "";
  return type.includes("application/json")
    ? response.json()
    : response.text();
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    return json(res, 200, { ok: true, message: "UNO admin API is working" });
  }

  try {
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret) {
      return json(res, 500, { error: "ADMIN_SECRET missing in Vercel" });
    }

    if (req.body.secret !== adminSecret) {
      return json(res, 401, { error: "Wrong admin secret" });
    }

    const items = req.body.items || [];
    const created = [];

    for (const item of items) {
      const { mime, buffer } = parseDataUrl(item.imageData);

      const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : mime.includes("gif") ? "gif" : "jpg";
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const path = `admin/${fileName}`;

      await supabaseFetch(`/storage/v1/object/${BUCKET}/${path}`, {
        method: "POST",
        headers: {
          "Content-Type": mime,
          "x-upsert": "false",
        },
        body: buffer,
      });

      const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

      const pixelRows = await supabaseFetch("/rest/v1/pixels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          nickname: item.nickname || "anonymous",
          message: item.message || "",
          image_url: imageUrl,
          share_image_url: imageUrl,
          source: item.source || "manual-x",
          x: Math.round((Math.random() - 0.5) * 1000),
          y: Math.round((Math.random() - 0.5) * 1000),
          device_id: `admin-${crypto.randomUUID()}`,
          browser_fingerprint: `admin-${crypto.randomUUID()}`,
        }),
      });

      created.push(pixelRows[0]);
    }

    return json(res, 200, { created });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: error.message });
  }
};
