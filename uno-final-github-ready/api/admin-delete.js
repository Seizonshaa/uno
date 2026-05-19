const SUPABASE_URL = "https://qieonhoyouewoffjjemp.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_publishable_Tjhdj6sK_K3tEBd7eXYHYA_zPJyBF4j";

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
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
    throw new Error(await response.text());
  }

  const type = response.headers.get("content-type") || "";
  return type.includes("application/json") ? response.json() : response.text();
}

function requireAdmin(req, res) {
  const adminSecret = process.env.ADMIN_SECRET;
  const provided = req.method === "GET" ? req.query.secret : req.body?.secret;

  if (!adminSecret) {
    json(res, 500, { error: "ADMIN_SECRET missing in Vercel" });
    return false;
  }

  if (provided !== adminSecret) {
    json(res, 401, { error: "Wrong admin secret" });
    return false;
  }

  return true;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  if (!requireAdmin(req, res)) return;

  try {
    const id = req.body?.id;

    if (!id) {
      return json(res, 400, { error: "Missing pixel id" });
    }

    const existing = await supabaseFetch(`/rest/v1/pixels?id=eq.${encodeURIComponent(id)}&select=*`);

    if (!existing.length) {
      return json(res, 404, { error: "Pixel not found" });
    }

    await supabaseFetch(`/rest/v1/pixels?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE"
    });

    return json(res, 200, { deleted: existing[0] });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: error.message });
  }
};
