
const MAX_PIXELS = 10000;
const SUPABASE_URL = "https://qieonhoyouewoffjjemp.supabase.co";
const SUPABASE_KEY = "sb_publishable_Tjhdj6sK_K3tEBd7eXYHYA_zPJyBF4j";
const BUCKET = "pixel-images";
const MAX_UPLOAD_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function getDeviceId() {
  let id = localStorage.getItem("uno_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("uno_device_id", id);
  }
  return id;
}

function getBrowserFingerprint() {
  const raw = [
    navigator.userAgent || "",
    navigator.language || "",
    screen.width || "",
    screen.height || "",
    screen.colorDepth || "",
    new Date().getTimezoneOffset() || "",
    navigator.platform || ""
  ].join("|");

  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return `fp_${Math.abs(hash)}`;
}

const DEVICE_ID = getDeviceId();
const BROWSER_FINGERPRINT = getBrowserFingerprint();
let myClaim = null;

async function checkMyClaim() {
  if (!supabaseClient) return null;

  const { data, error } = await supabaseClient
    .from("pixels")
    .select("*")
    .or(`device_id.eq.${DEVICE_ID},browser_fingerprint.eq.${BROWSER_FINGERPRINT}`)
    .limit(1);

  if (error) {
    console.warn("Could not check existing claim:", error);
    return null;
  }

  myClaim = data && data.length ? data[0] : null;

  if (myClaim) {
    claimOpenBtn.textContent = "Pixel Claimed";
    emptyClaimBtn.textContent = "Pixel Claimed";
    claimBtn.textContent = "Already Claimed";
    claimBtn.disabled = true;
  } else {
    claimOpenBtn.textContent = "Claim Pixel";
    emptyClaimBtn.textContent = "Claim the first pixel";
    claimBtn.textContent = "Claim Pixel";
    claimBtn.disabled = false;
  }

  return myClaim;
}


let supabaseClient = null;

function initSupabase() {
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    const el = document.getElementById("statusText");
    if (el) el.textContent = "Supabase failed";
    console.error(
      "Supabase JS library did not load. Check your internet connection, ad blocker, or CDN access."
    );
    return null;
  }

  return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

const canvas = document.getElementById("unoCanvas");
const ctx = canvas.getContext("2d");

const claimedCount = document.getElementById("claimedCount");
const statusText = document.getElementById("statusText");
const emptyState = document.getElementById("emptyState");
const toast = document.getElementById("toast");

const claimModal = document.getElementById("claimModal");
const pixelModal = document.getElementById("pixelModal");

const claimOpenBtn = document.getElementById("claimOpenBtn");
const emptyClaimBtn = document.getElementById("emptyClaimBtn");
const closeClaimBtn = document.getElementById("closeClaimBtn");
const claimBtn = document.getElementById("claimBtn");
const randomBtn = document.getElementById("randomBtn");

const closePixelBtn = document.getElementById("closePixelBtn");
const shareBtn = document.getElementById("shareBtn");

const imageInput = document.getElementById("imageInput");
const uploadBox = document.getElementById("uploadBox");
const imagePreview = document.getElementById("imagePreview");
const uploadText = document.getElementById("uploadText");
const nicknameInput = document.getElementById("nicknameInput");
const messageInput = document.getElementById("messageInput");

const pixelPreview = document.getElementById("pixelPreview");
const pixelName = document.getElementById("pixelName");
const pixelMessage = document.getElementById("pixelMessage");
const pixelDate = document.getElementById("pixelDate");

let pixels = [];
let images = new Map();
let selectedPixel = null;

let dpr = Math.max(1, window.devicePixelRatio || 1);
let view = { x: 0, y: 0, scale: 1 };
let isDragging = false;
let last = { x: 0, y: 0 };



async function generateShareCardBlob(file, nickname, message) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;

  const c = canvas.getContext("2d");

  const bg = c.createLinearGradient(0, 0, 1200, 630);
  bg.addColorStop(0, "#03050a");
  bg.addColorStop(0.45, "#060816");
  bg.addColorStop(1, "#1b0833");
  c.fillStyle = bg;
  c.fillRect(0, 0, 1200, 630);

  c.strokeStyle = "rgba(255,255,255,0.045)";
  c.lineWidth = 1;
  for (let x = 0; x < 1200; x += 32) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, 630);
    c.stroke();
  }
  for (let y = 0; y < 630; y += 32) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(1200, y);
    c.stroke();
  }

  const purpleGlow = c.createRadialGradient(955, 190, 20, 955, 190, 360);
  purpleGlow.addColorStop(0, "rgba(180,92,255,0.55)");
  purpleGlow.addColorStop(1, "rgba(180,92,255,0)");
  c.fillStyle = purpleGlow;
  c.fillRect(600, 0, 600, 480);

  const cyanGlow = c.createRadialGradient(210, 520, 20, 210, 520, 290);
  cyanGlow.addColorStop(0, "rgba(34,211,238,0.26)");
  cyanGlow.addColorStop(1, "rgba(34,211,238,0)");
  c.fillStyle = cyanGlow;
  c.fillRect(0, 250, 500, 380);

  c.save();
  c.translate(560, 105);
  c.rotate(-0.08);
  c.fillStyle = "rgba(255,255,255,0.055)";
  roundCardPath(c, 0, 0, 560, 390, 28);
  c.fill();
  c.strokeStyle = "rgba(180,92,255,0.35)";
  c.lineWidth = 2;
  roundCardPath(c, 0, 0, 560, 390, 28);
  c.stroke();

  for (let i = 0; i < 72; i++) {
    const px = 22 + (i % 12) * 43;
    const py = 22 + Math.floor(i / 12) * 54;
    const hue = 250 + ((i * 17) % 80);
    c.fillStyle = `hsla(${hue}, 85%, ${45 + (i % 4) * 8}%, ${0.18 + (i % 5) * 0.025})`;
    roundCardPath(c, px, py, 30, 30, 6);
    c.fill();
  }
  c.restore();

  c.fillStyle = "#ffffff";
  c.font = "900 84px Arial";
  c.fillText("UNO", 70, 108);

  c.fillStyle = "#22d3ee";
  c.font = "900 24px Arial";
  c.fillText("ONE PIXEL PER PERSON. FOREVER.", 74, 145);

  const claimedNow = (typeof pixels !== "undefined" && Array.isArray(pixels)) ? pixels.length + 1 : 1;
  const maxPixels = (typeof MAX_PIXELS !== "undefined") ? MAX_PIXELS : 10000;

  c.fillStyle = "rgba(255,255,255,0.08)";
  roundCardPath(c, 72, 178, 300, 54, 27);
  c.fill();

  c.fillStyle = "#b45cff";
  c.font = "900 27px Arial";
  c.fillText(`#${String(claimedNow).padStart(3, "0")}`, 96, 214);

  c.fillStyle = "#ffffff";
  c.font = "800 24px Arial";
  c.fillText(`/ ${maxPixels} CLAIMED`, 172, 214);

  const frameX = 78;
  const frameY = 266;
  const frameSize = 285;

  c.save();
  c.shadowColor = "rgba(180,92,255,0.95)";
  c.shadowBlur = 42;
  c.fillStyle = "rgba(180,92,255,0.28)";
  roundCardPath(c, frameX - 8, frameY - 8, frameSize + 16, frameSize + 16, 42);
  c.fill();
  c.restore();

  c.save();
  roundCardPath(c, frameX, frameY, frameSize, frameSize, 34);
  c.fillStyle = "#0f1220";
  c.fill();
  c.clip();

  const scale = Math.max(frameSize / bitmap.width, frameSize / bitmap.height);
  const sw = frameSize / scale;
  const sh = frameSize / scale;
  const sx = (bitmap.width - sw) / 2;
  const sy = (bitmap.height - sh) / 2;

  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = "high";
  c.drawImage(bitmap, sx, sy, sw, sh, frameX, frameY, frameSize, frameSize);
  c.restore();

  c.strokeStyle = "rgba(255,255,255,0.24)";
  c.lineWidth = 2;
  roundCardPath(c, frameX, frameY, frameSize, frameSize, 34);
  c.stroke();

  c.fillStyle = "#05070c";
  c.shadowColor = "rgba(34,211,238,0.8)";
  c.shadowBlur = 18;
  roundCardPath(c, frameX + 20, frameY + frameSize - 54, 145, 36, 18);
  c.fill();
  c.shadowBlur = 0;

  c.fillStyle = "#22d3ee";
  c.font = "900 18px Arial";
  c.fillText("OG PIXEL", frameX + 40, frameY + frameSize - 30);

  c.fillStyle = "#ffffff";
  c.font = "900 54px Arial";
  wrapCardText(c, `${nickname || "anonymous"} claimed a pixel`, 430, 290, 650, 60, 2);

  c.fillStyle = "#a3a8ba";
  c.font = "500 32px Arial";
  wrapCardText(c, message || "A permanent mark on the internet.", 432, 410, 620, 42, 2);

  c.fillStyle = "rgba(255,255,255,0.075)";
  roundCardPath(c, 430, 500, 600, 70, 24);
  c.fill();

  c.fillStyle = "#ffffff";
  c.font = "900 30px Arial";
  c.fillText("Claim yours before the canvas fills.", 462, 545);

  for (let i = 0; i < 42; i++) {
    const x = 420 + Math.random() * 680;
    const y = 70 + Math.random() * 470;
    const size = 3 + Math.random() * 7;
    c.fillStyle = Math.random() > 0.45 ? "rgba(180,92,255,0.75)" : "rgba(34,211,238,0.75)";
    c.fillRect(x, y, size, size);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.94);
  });
}

function roundCardPath(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function wrapCardText(c, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text).split(" ");
  let line = "";
  let lines = 0;

  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (c.measureText(test).width > maxWidth && i > 0) {
      c.fillText(line.trim(), x, y);
      line = words[i] + " ";
      y += lineHeight;
      lines++;
      if (lines >= maxLines - 1) {
        let finalLine = line.trim();
        while (c.measureText(finalLine + "...").width > maxWidth && finalLine.length > 0) {
          finalLine = finalLine.slice(0, -1);
        }
        c.fillText(finalLine + "...", x, y);
        return;
      }
    } else {
      line = test;
    }
  }
  c.fillText(line.trim(), x, y);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add("hidden"), 3000);
}

function openClaim() {
  if (myClaim) {
    showToast("You already claimed your UNO pixel from this browser.");
    openPixel(myClaim);
    return;
  }
  claimModal.classList.remove("hidden");
}

function closeClaim() {
  claimModal.classList.add("hidden");
}

function resizeCanvas() {
  dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render();
}

function getCellSize() {
  const n = pixels.length;
  if (n === 0) return 170;
  if (n < 8) return 170;
  if (n < 25) return 135;
  if (n < 80) return 96;
  if (n < 250) return 68;
  if (n < 900) return 48;
  return 34;
}

function layoutPixels() {
  const size = getCellSize();
  const gap = Math.max(5, Math.floor(size * 0.08));
  const cols = Math.max(1, Math.ceil(Math.sqrt(pixels.length)));
  const totalW = cols * (size + gap) - gap;

  return pixels.map((p, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      ...p,
      drawX: col * (size + gap) - totalW / 2,
      drawY: row * (size + gap) - totalW / 2,
      size
    };
  });
}

function worldToScreen(x, y) {
  return {
    x: x * view.scale + window.innerWidth / 2 + view.x,
    y: y * view.scale + window.innerHeight / 2 + view.y
  };
}

function screenToWorld(x, y) {
  return {
    x: (x - window.innerWidth / 2 - view.x) / view.scale,
    y: (y - window.innerHeight / 2 - view.y) / view.scale
  };
}

function render() {
  if (!ctx) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  ctx.imageSmoothingEnabled = false;

  const arranged = layoutPixels();

  for (const p of arranged) {
    const img = images.get(p.image_url);
    const pos = worldToScreen(p.drawX, p.drawY);
    const s = p.size * view.scale;

    if (pos.x + s < 0 || pos.y + s < 0 || pos.x > window.innerWidth || pos.y > window.innerHeight) {
      continue;
    }

    ctx.save();
    ctx.shadowColor = "rgba(34,211,238,.35)";
    ctx.shadowBlur = Math.max(8, 18 * view.scale);
    ctx.fillStyle = "rgba(255,255,255,.08)";
    roundRect(ctx, pos.x, pos.y, s, s, Math.max(6, 16 * view.scale));
    ctx.fill();

    if (img && img.complete) {
      ctx.clip();
      ctx.drawImage(img, pos.x, pos.y, s, s);
    }

    ctx.restore();
  }

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function preloadImages() {
  for (const p of pixels) {
    if (!images.has(p.image_url)) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = render;
      img.src = p.image_url;
      images.set(p.image_url, img);
    }
  }
}

async function loadPixels() {
  statusText.textContent = "Loading...";
  const { data, error } = await supabaseClient
    .from("pixels")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    statusText.textContent = "Database error";
    showToast("Could not load pixels. Check your Supabase table/RLS.");
    return;
  }

  pixels = data || [];
  claimedCount.textContent = pixels.length;
  emptyState.classList.toggle("show", pixels.length === 0);
  statusText.textContent = "Live";
  preloadImages();
  render();
}

function subscribeRealtime() {
  supabaseClient
    .channel("pixels-live")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "pixels" },
      payload => {
        pixels.push(payload.new);
        claimedCount.textContent = pixels.length;
        emptyState.classList.toggle("show", pixels.length === 0);
        preloadImages();
        render();
        showToast("A new UNO pixel was claimed.");
      }
    )
    .subscribe(status => {
      if (status === "SUBSCRIBED") statusText.textContent = "Live";
    });
}

function generatePosition() {
  const n = pixels.length;
  const ring = Math.ceil(Math.sqrt(n + 1));
  return {
    x: (Math.random() - 0.5) * ring * 40,
    y: (Math.random() - 0.5) * ring * 40
  };
}

async function claimPixel() {
  const existing = await checkMyClaim();

  if (existing) {
    showToast("You already claimed your UNO pixel. One pixel per person.");
    openPixel(existing);
    return;
  }

  const { data: duplicateRows, error: duplicateError } = await supabaseClient
    .from("pixels")
    .select("id")
    .or(`device_id.eq.${DEVICE_ID},browser_fingerprint.eq.${BROWSER_FINGERPRINT}`)
    .limit(1);

  if (duplicateError) {
    console.warn("Duplicate check failed:", duplicateError);
  }

  if (duplicateRows && duplicateRows.length) {
    showToast("You already claimed your UNO pixel. One pixel per person.");
    await checkMyClaim();
    return;
  }

  
const currentCount = Array.isArray(pixels) ? pixels.length : 0;

if (currentCount >= MAX_PIXELS) {
  showToast("UNO is full. All 10,000 pixels have been claimed.");
  return;
}

const file = imageInput.files?.[0];


  if (!file) {
    showToast("Choose an image first.");
    return;
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    showToast("Only JPG, PNG, WebP, or GIF images are allowed.");
    return;
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    showToast("Image is too large. Max size is 2MB.");
    return;
  }

  claimBtn.disabled = true;
  claimBtn.textContent = "Claiming...";

  try {
    const safeName = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
    const path = `claims/${safeName}`;

    const { error: uploadError } = await supabaseClient.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabaseClient.storage
      .from(BUCKET)
      .getPublicUrl(path);

    const nicknameValue = nicknameInput.value.trim() || "anonymous";
    const messageValue = messageInput.value.trim() || "";

    let shareImageUrl = publicUrlData.publicUrl;

    try {
      const cardBlob = await generateShareCardBlob(file, nicknameValue, messageValue);
      const cardPath = `share-cards/${crypto.randomUUID()}.png`;

      const { error: cardUploadError } = await supabaseClient.storage
        .from(BUCKET)
        .upload(cardPath, cardBlob, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: false
        });

      if (!cardUploadError) {
        const { data: cardPublicUrlData } = supabaseClient.storage
          .from(BUCKET)
          .getPublicUrl(cardPath);

        shareImageUrl = cardPublicUrlData.publicUrl;
      } else {
        console.warn("Share card upload failed, falling back to raw image:", cardUploadError);
      }
    } catch (cardError) {
      console.warn("Share card generation failed, falling back to raw image:", cardError);
    }

    const pos = generatePosition();

    const { data: insertedPixel, error: insertError } = await supabaseClient
      .from("pixels")
      .insert({
        nickname: nicknameValue,
        message: messageValue,
        image_url: publicUrlData.publicUrl,
        share_image_url: shareImageUrl,
        device_id: DEVICE_ID,
        browser_fingerprint: BROWSER_FINGERPRINT,
        x: Math.round(pos.x),
        y: Math.round(pos.y)
      })
      .select()
      .single();

    if (insertError) throw insertError;

    if (insertedPixel?.id) {
      selectedPixel = insertedPixel;
      myClaim = insertedPixel;
    }

    imageInput.value = "";
    nicknameInput.value = "";
    messageInput.value = "";
    resetImagePreview();
    closeClaim();
    await loadPixels();
    await checkMyClaim();
    showToast("Pixel claimed globally.");
  } catch (err) {
    console.error(err);

    if (String(err.message || "").includes("duplicate") || String(err.code || "") === "23505") {
      showToast("You already claimed your UNO pixel. One pixel per person.");
      await checkMyClaim();
    } else {
      showToast("Claim failed. Check Supabase bucket, table and policies.");
    }
  } finally {
    if (!myClaim) {
      claimBtn.disabled = false;
      claimBtn.textContent = "Claim Pixel";
    }
  }
}

function getPixelAt(clientX, clientY) {
  const world = screenToWorld(clientX, clientY);
  const arranged = layoutPixels().reverse();
  return arranged.find(p =>
    world.x >= p.drawX &&
    world.x <= p.drawX + p.size &&
    world.y >= p.drawY &&
    world.y <= p.drawY + p.size
  );
}

function openPixel(p) {
  selectedPixel = p;
  pixelPreview.src = p.image_url;
  pixelName.textContent = p.nickname || "anonymous";
  pixelMessage.textContent = p.message || "No message.";
  pixelDate.textContent = p.created_at ? new Date(p.created_at).toLocaleString() : "";
  pixelModal.classList.remove("hidden");
}

function randomJourney() {
  if (!pixels.length) {
    showToast("No pixels claimed yet.");
    return;
  }

  const p = layoutPixels()[Math.floor(Math.random() * pixels.length)];
  view.x = -p.drawX * view.scale;
  view.y = -p.drawY * view.scale;
  render();
  openPixel(p);
}

function shareSelectedPixel() {
  if (!selectedPixel) return;

  const text = encodeURIComponent("I claimed my UNO pixel. One pixel per person. Forever.");
  const shareUrl = selectedPixel.id
    ? `${location.origin}/pixel/${selectedPixel.id}`
    : location.href;

  window.open(
    `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`,
    "_blank",
    "noopener,noreferrer"
  );
}


function setSelectedImage(file) {
  if (!file) return;

  if (!file.type || !file.type.startsWith("image/")) {
    showToast("Please choose an image file.");
    return;
  }

  const transfer = new DataTransfer();
  transfer.items.add(file);
  imageInput.files = transfer.files;

  const previewUrl = URL.createObjectURL(file);
  imagePreview.src = previewUrl;
  imagePreview.classList.remove("hidden");
  uploadBox.classList.add("has-preview");
  uploadText.textContent = file.name;
}

function resetImagePreview() {
  imagePreview.src = "";
  imagePreview.classList.add("hidden");
  uploadBox.classList.remove("has-preview", "drag-over");
  uploadText.textContent = "Choose an image or drag it here";
}

if (uploadBox) {
  ["dragenter", "dragover"].forEach((eventName) => {
    uploadBox.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      uploadBox.classList.add("drag-over");
      uploadText.textContent = "Drop image to preview";
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    uploadBox.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      uploadBox.classList.remove("drag-over");
    });
  });

  uploadBox.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) setSelectedImage(file);
  });
}

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (file) {
    setSelectedImage(file);
  } else {
    resetImagePreview();
  }
});

claimOpenBtn.addEventListener("click", openClaim);
emptyClaimBtn.addEventListener("click", openClaim);
closeClaimBtn.addEventListener("click", closeClaim);
claimBtn.addEventListener("click", claimPixel);

closePixelBtn.addEventListener("click", () => pixelModal.classList.add("hidden"));
shareBtn.addEventListener("click", shareSelectedPixel);
randomBtn.addEventListener("click", randomJourney);

canvas.addEventListener("mousedown", e => {
  isDragging = true;
  last = { x: e.clientX, y: e.clientY };
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

window.addEventListener("mousemove", e => {
  if (!isDragging) return;
  view.x += e.clientX - last.x;
  view.y += e.clientY - last.y;
  last = { x: e.clientX, y: e.clientY };
  render();
});

canvas.addEventListener("click", e => {
  if (Math.abs(e.movementX || 0) > 3 || Math.abs(e.movementY || 0) > 3) return;
  const p = getPixelAt(e.clientX, e.clientY);
  if (p) openPixel(p);
});

canvas.addEventListener("wheel", e => {
  e.preventDefault();
  const mouse = { x: e.clientX, y: e.clientY };
  const before = screenToWorld(mouse.x, mouse.y);

  const delta = e.deltaY < 0 ? 1.12 : 0.88;
  view.scale = Math.min(5, Math.max(0.18, view.scale * delta));

  const after = screenToWorld(mouse.x, mouse.y);
  view.x += (after.x - before.x) * view.scale;
  view.y += (after.y - before.y) * view.scale;

  render();
}, { passive: false });

let touchDistance = null;
canvas.addEventListener("touchstart", e => {
  if (e.touches.length === 1) {
    isDragging = true;
    last = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if (e.touches.length === 2) {
    touchDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
}, { passive: false });

canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  if (e.touches.length === 1 && isDragging) {
    view.x += e.touches[0].clientX - last.x;
    view.y += e.touches[0].clientY - last.y;
    last = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    render();
  } else if (e.touches.length === 2 && touchDistance) {
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const ratio = dist / touchDistance;
    view.scale = Math.min(5, Math.max(0.18, view.scale * ratio));
    touchDistance = dist;
    render();
  }
}, { passive: false });

canvas.addEventListener("touchend", () => {
  isDragging = false;
  touchDistance = null;
});

window.addEventListener("resize", resizeCanvas);

document.addEventListener("DOMContentLoaded", async () => {
  supabaseClient = initSupabase();

  resizeCanvas();

  if (!supabaseClient) {
    showToast("Supabase library failed to load. Check internet/ad blocker.");
    return;
  }

  await loadPixels();
  await checkMyClaim();
  subscribeRealtime();
});


function updateClaimCounter(){
  const count = Array.isArray(pixels) ? pixels.length : 0;
  const el = document.getElementById("claimedCount");
  if(el){
    el.textContent = `${count} / ${MAX_PIXELS} claimed`;
  }
}

setInterval(updateClaimCounter, 1000);
