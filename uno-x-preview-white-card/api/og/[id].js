import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge"
};

const SUPABASE_URL = "https://qieonhoyouewoffjjemp.supabase.co";
const SUPABASE_KEY = "sb_publishable_Tjhdj6sK_K3tEBd7eXYHYA_zPJyBF4j";
const MAX_PIXELS = 10000;

async function supabaseGet(path, options = {}) {
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

  return response;
}

async function getPixel(id) {
  const response = await supabaseGet(`/rest/v1/pixels?id=eq.${encodeURIComponent(id)}&select=*`);
  const rows = await response.json();
  return rows[0] || null;
}

async function getAllPixelIds() {
  const response = await supabaseGet(`/rest/v1/pixels?select=id,created_at&order=created_at.asc&limit=10000`);
  return response.json();
}

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop().replace(".png", "");

    const [pixel, allPixels] = await Promise.all([
      getPixel(id),
      getAllPixelIds()
    ]);

    if (!pixel) {
      return new ImageResponse(
        (
          <div
            style={{
              width: "1200px",
              height: "630px",
              display: "flex",
              background: "#ffffff",
              color: "#111111",
              fontFamily: "Arial",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              fontWeight: 800
            }}
          >
            UNO Pixel Not Found
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    const claimed = allPixels.length;
    const rank = Math.max(1, allPixels.findIndex((p) => p.id === pixel.id) + 1);
    const nickname = pixel.nickname || "anonymous";
    const message = pixel.message || "One pixel. One person. Forever.";
    const image = pixel.image_url;

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            background: "#f7f7f5",
            color: "#111111",
            fontFamily: "Arial",
            position: "relative",
            padding: "58px",
            boxSizing: "border-box"
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "0",
              background:
                "radial-gradient(circle at 18% 85%, rgba(180,92,255,0.13), transparent 30%), radial-gradient(circle at 88% 20%, rgba(34,211,238,0.12), transparent 28%)"
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "38px",
              left: "58px",
              display: "flex",
              alignItems: "center",
              gap: "16px"
            }}
          >
            <div style={{ fontSize: 46, fontWeight: 950, letterSpacing: "-0.08em" }}>UNO</div>
            <div style={{ fontSize: 17, color: "#777", fontWeight: 600 }}>
              one pixel per person. forever.
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              top: "118px",
              left: "58px",
              width: "470px",
              height: "420px",
              borderRadius: "38px",
              background: "#ffffff",
              boxShadow: "0 30px 80px rgba(0,0,0,0.12)",
              border: "1px solid rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}
          >
            <img
              src={image}
              style={{
                width: "390px",
                height: "390px",
                objectFit: "cover",
                borderRadius: "30px"
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              top: "128px",
              left: "585px",
              right: "58px",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignSelf: "flex-start",
                padding: "13px 20px",
                borderRadius: "999px",
                background: "#111111",
                color: "#ffffff",
                fontSize: 24,
                fontWeight: 800
              }}
            >
              Pixel #{String(rank).padStart(3, "0")}
            </div>

            <div
              style={{
                marginTop: "34px",
                fontSize: 62,
                lineHeight: 1.02,
                fontWeight: 900,
                letterSpacing: "-0.055em"
              }}
            >
              {nickname}'s permanent pixel
            </div>

            <div
              style={{
                marginTop: "26px",
                fontSize: 30,
                lineHeight: 1.25,
                color: "#666",
                maxWidth: "510px"
              }}
            >
              {message}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              right: "58px",
              bottom: "48px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end"
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 950,
                letterSpacing: "-0.055em",
                color: "#111"
              }}
            >
              {claimed} / {MAX_PIXELS}
            </div>
            <div
              style={{
                marginTop: "6px",
                fontSize: 22,
                color: "#777",
                fontWeight: 700
              }}
            >
              pixels claimed
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "58px",
              bottom: "48px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: 24,
              fontWeight: 800
            }}
          >
            <div
              style={{
                width: "18px",
                height: "18px",
                background: "linear-gradient(135deg,#22d3ee,#b45cff)",
                borderRadius: "4px"
              }}
            />
            Claim yours before the canvas fills.
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (error) {
    return new Response(`OG image error: ${error.message}`, { status: 500 });
  }
}
