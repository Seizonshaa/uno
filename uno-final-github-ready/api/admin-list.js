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
  if (!requireAdmin(req, res)) return;

  try {
    const rows = await supabaseFetch("/rest/v1/pixels?select=*&order=created_at.desc&limit=100");
    return json(res, 200, { pixels: rows });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: error.message });
  }
};
