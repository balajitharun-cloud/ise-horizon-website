/* =====================================================================
   Shared storage for the Vercel functions.

   Two backings, picked automatically:
     1. Vercel Blob  — used when BLOB_READ_WRITE_TOKEN is present. Create a
        Blob store in the Vercel dashboard and Vercel injects the token for
        you, so there is nothing to copy.
     2. The GitHub repo — used when GITHUB_TOKEN is present instead.
   Whichever is configured, the member list is shared, so every visitor
   sees the same Active-members count.
   ===================================================================== */

const OWNER  = process.env.GITHUB_OWNER  || "balajitharun-cloud";
const REPO   = process.env.GITHUB_REPO   || "ise-horizon-website";
const BRANCH = process.env.GITHUB_BRANCH || "main";
/* Read an env var under any of several names, and strip stray whitespace.
   Pasted tokens very often carry a trailing newline or space, which makes
   the Authorization header malformed and the write fail. */
function env() {
  for (let i = 0; i < arguments.length; i++) {
    const v = process.env[arguments[i]];
    if (v && String(v).trim()) return String(v).trim();
  }
  return "";
}
const GH   = env("GITHUB_TOKEN", "GH_TOKEN", "GITHUB_PAT", "GITHUB_ACCESS_TOKEN", "GITHUB_TOKEN_CLASSIC", "GITHUB_ACCESS_TOKEN_CLASSIC");
const BLOB = env("BLOB_READ_WRITE_TOKEN");
const KEY    = "avyakt/members.json";

async function blobLib() {
  try { return await import("@vercel/blob"); } catch (e) { return null; }
}

async function ghHeaders() {
  return {
    "Accept": "application/vnd.github+json",
    "Authorization": "Bearer " + GH,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "avyakt-join"
  };
}

/* ---------- read ---------- */
async function loadMembers() {
  if (BLOB) {
    const blob = await blobLib();
    if (blob) {
      try {
        const { blobs } = await blob.list({ prefix: KEY });
        if (blobs && blobs.length) {
          const r = await fetch(blobs[0].url, { cache: "no-store" });
          if (r.ok) { const j = await r.json(); if (Array.isArray(j)) return j; }
        }
        return [];
      } catch (e) { /* fall through */ }
    }
  }
  if (GH) {
    const r = await fetch("https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/data/content.json?ref=" + encodeURIComponent(BRANCH),
      { headers: await ghHeaders() });
    if (!r.ok) throw new Error("GitHub read failed (" + r.status + ")");
    const meta = await r.json();
    const content = JSON.parse(Buffer.from(meta.content, "base64").toString("utf8"));
    return { fromRepo: true, members: Array.isArray(content.members) ? content.members : [], content: content, sha: meta.sha };
  }
  return null;
}

/* ---------- read the whole site content file ---------- */
/* Works with or without a token: the repo is public, so an anonymous read is
   enough, and a token just raises the rate limit. */
const FILES = { content: "data/content.json", certificates: "data/certificates.json" };
function filePath(name) { return FILES[name] || FILES.content; }

async function loadJson(path) {
  const headers = GH
    ? await ghHeaders()
    : { "Accept": "application/vnd.github+json", "User-Agent": "avyakt-site" };
  const r = await fetch("https://api.github.com/repos/" + OWNER + "/" + REPO +
    "/contents/" + path + "?ref=" + encodeURIComponent(BRANCH), { headers });
  if (!r.ok) throw new Error("GitHub read failed (" + r.status + ")");
  const meta = await r.json();
  return { data: JSON.parse(Buffer.from(meta.content, "base64").toString("utf8")), sha: meta.sha };
}

async function saveJsonToRepo(loaded, path, content, message) {
  const body = {
    message: message || ("Update " + path),
    content: Buffer.from(JSON.stringify(content, null, 2) + "\n").toString("base64"),
    branch: BRANCH
  };
  if (loaded && loaded.sha) body.sha = loaded.sha;
  const r = await fetch("https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/" + path, {
    method: "PUT",
    headers: Object.assign({ "Content-Type": "application/json" }, await ghHeaders()),
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error("GitHub write failed (" + r.status + ")");
  const j = await r.json();
  return (j.content && j.content.sha) || "";
}

async function loadContent() {
  const headers = GH
    ? await ghHeaders()
    : { "Accept": "application/vnd.github+json", "User-Agent": "avyakt-site" };
  const r = await fetch("https://api.github.com/repos/" + OWNER + "/" + REPO +
    "/contents/data/content.json?ref=" + encodeURIComponent(BRANCH), { headers });
  if (!r.ok) throw new Error("GitHub read failed (" + r.status + ")");
  const meta = await r.json();
  return { data: JSON.parse(Buffer.from(meta.content, "base64").toString("utf8")), sha: meta.sha };
}

/* ---------- write ---------- */
async function saveMembers(members) {
  if (BLOB) {
    const blob = await blobLib();
    if (blob) {
      const body = JSON.stringify(members);
      try {
        await blob.put(KEY, body, { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
      } catch (e) {
        const { blobs } = await blob.list({ prefix: KEY });
        for (const b of blobs) { try { await blob.del(b.url); } catch (e2) {} }
        await blob.put(KEY, body, { access: "public", addRandomSuffix: false, contentType: "application/json" });
      }
      return true;
    }
  }
  return false;
}

async function saveMembersToRepo(loaded, members) {
  const content = loaded.content;
  content.members = members;
  content.settings = content.settings || {};
  content.settings.activeMembers = members.length;
  const r = await fetch("https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/data/content.json", {
    method: "PUT",
    headers: Object.assign({ "Content-Type": "application/json" }, await ghHeaders()),
    body: JSON.stringify({
      message: "Member list updated (" + members.length + " members)",
      content: Buffer.from(JSON.stringify(content, null, 2) + "\n").toString("base64"),
      sha: loaded.sha,
      branch: BRANCH
    })
  });
  if (!r.ok) throw new Error("GitHub write failed (" + r.status + ")");
  return true;
}

/* ---------- write the whole content file to the repo ---------- */
async function saveContentToRepo(loaded, content, message) {
  const body = {
    message: message || "Update site content (member panel)",
    content: Buffer.from(JSON.stringify(content, null, 2) + "\n").toString("base64"),
    branch: BRANCH
  };
  if (loaded && loaded.sha) body.sha = loaded.sha;
  const r = await fetch("https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/data/content.json", {
    method: "PUT",
    headers: Object.assign({ "Content-Type": "application/json" }, await ghHeaders()),
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error("GitHub write failed (" + r.status + ")");
  const j = await r.json();
  return (j.content && j.content.sha) || "";
}

/* ---------- commit a single file (a gallery photo) ---------- */
async function saveFileToRepo(path, base64, message) {
  let sha = null;
  try {
    const cur = await fetch("https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/" +
      path.split("/").map(encodeURIComponent).join("/") + "?ref=" + encodeURIComponent(BRANCH), { headers: await ghHeaders() });
    if (cur.ok) sha = (await cur.json()).sha;
  } catch (e) {}
  const body = { message: message || ("Add " + path), content: base64, branch: BRANCH };
  if (sha) body.sha = sha;
  const r = await fetch("https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/" +
    path.split("/").map(encodeURIComponent).join("/"), {
    method: "PUT",
    headers: Object.assign({ "Content-Type": "application/json" }, await ghHeaders()),
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error("GitHub write failed (" + r.status + ")");
  return true;
}

function sha256hex(str) {
  return require("crypto").createHash("sha256").update(String(str), "utf8").digest("hex");
}

/* ---------- media storage ----------
   Two providers, picked automatically:
     Cloudinary     - when CLOUDINARY_* is set. Free plan needs no card.
     Supabase       - when SUPABASE_* is set instead.
   Either way the secret stays on the server: we only hand the browser a
   short-lived, signed authorisation so the file goes straight to storage. */
const CL_CLOUD  = env("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_CLOUD");
const CL_KEY    = env("CLOUDINARY_API_KEY");
const CL_SEC    = env("CLOUDINARY_API_SECRET");
const CL_FOLDER = env("CLOUDINARY_FOLDER") || "avyakt";

function mediaProvider() {
  if (CL_CLOUD && CL_KEY && CL_SEC) return "cloudinary";
  if (SB_URL && SB_KEY) return "supabase";
  return "none";
}

/* Cloudinary: sort the name=value pairs, join with &, append the secret with
   no separator, SHA-1 hex. Verified against Cloudinary's own worked examples. */
function cloudinarySignature(params, secret) {
  const pairs = Object.keys(params)
    .filter(function (k) { return params[k] !== undefined && params[k] !== null && params[k] !== ""; })
    .map(function (k) { return k + "=" + params[k]; })
    .sort();
  return require("crypto").createHash("sha1").update(pairs.join("&") + secret, "utf8").digest("hex");
}

/* Sign only { timestamp, folder } - the smallest set, so the browser cannot
   send an unsigned parameter and trigger "Invalid Signature". */
function signCloudinaryUpload() {
  if (!(CL_CLOUD && CL_KEY && CL_SEC)) throw new Error(mediaHint());
  const timestamp = String(Math.floor(Date.now() / 1000));
  const params = { timestamp: timestamp, folder: CL_FOLDER };
  return {
    provider: "cloudinary",
    uploadUrl: "https://api.cloudinary.com/v1_1/" + encodeURIComponent(CL_CLOUD) + "/auto/upload",
    apiKey: CL_KEY,
    timestamp: timestamp,
    signature: cloudinarySignature(params, CL_SEC),
    folder: CL_FOLDER,
    maxBytes: 100 * 1024 * 1024   // Cloudinary free plan: 100 MB per video/audio file
  };
}

/* ---------- does media storage actually work? ----------
   Supabase: signing IS a live API call, so a successful sign proves the keys
   work and the service is reachable.
   Cloudinary: signing is computed locally, so we prove the credentials with a
   real (read-only) Admin API call instead. */
async function checkCloudinary() {
  const auth = Buffer.from(CL_KEY + ":" + CL_SEC).toString("base64");
  const r = await fetch("https://api.cloudinary.com/v1_1/" + encodeURIComponent(CL_CLOUD) +
    "/resources/video?max_results=1", { headers: { "Authorization": "Basic " + auth } });
  if (r.status === 401 || r.status === 403) {
    throw new Error("Cloudinary rejected these credentials (" + r.status + "). Re-copy the API key and secret.");
  }
  if (!r.ok) throw new Error("Cloudinary check failed (" + r.status + ")");
  return true;
}

async function checkMediaStorage() {
  const p = mediaProvider();
  if (p === "none") return { provider: "none", ok: false, detail: mediaHint() };
  try {
    if (p === "cloudinary") {
      await checkCloudinary();
      return { provider: "cloudinary", ok: true, target: CL_CLOUD + " (folder: " + CL_FOLDER + ")" };
    }
    await signMediaUpload("probe/check.mp4");
    return { provider: "supabase", ok: true, target: SB_BUCKET + " bucket" };
  } catch (e) {
    const raw = (e && e.message) || String(e);
    const extra = p === "supabase"
      ? " Check that SUPABASE_SERVICE_KEY is the service_role key and that a public bucket named '" + SB_BUCKET + "' exists."
      : "";
    return { provider: p, ok: false, detail: raw + extra };
  }
}

/* ---------- media storage (Supabase Storage) ---------- */
/* The service key never leaves the server: we only hand the browser a
   short-lived signed upload URL, so a 50 MB video goes straight to storage
   without passing through this function (serverless bodies cap at ~4.5 MB). */
const SB_URL    = env("SUPABASE_URL");
const SB_KEY    = env("SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_KEY");
const SB_BUCKET = env("SUPABASE_BUCKET") || "media";

function mediaConfigured() { return mediaProvider() !== "none"; }
function mediaHint() {
  return "Media storage is not set up. Create a free Cloudinary account (no card needed), then set "
       + "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in this site's environment variables. "
       + "(Supabase works too: set SUPABASE_URL, SUPABASE_SERVICE_KEY and SUPABASE_BUCKET instead.)";
}
function sbBase() { return SB_URL.replace(/\/+$/, ""); }
function sbObjectPath(path) { return path.split("/").map(encodeURIComponent).join("/"); }

async function signMediaUpload(path) {
  if (!mediaConfigured()) throw new Error(mediaHint());
  if (mediaProvider() === "cloudinary") return signCloudinaryUpload();
  const clean = String(path || "").replace(/^\.+\//, "").replace(/[^A-Za-z0-9._/-]/g, "-");
  const signUrl = sbBase() + "/storage/v1/object/upload/sign/" + encodeURIComponent(SB_BUCKET) + "/" + sbObjectPath(clean);
  const r = await fetch(signUrl, {
    method: "POST",
    headers: { "Authorization": "Bearer " + SB_KEY, "apikey": SB_KEY, "x-upsert": "true" }
  });
  if (!r.ok) throw new Error("Supabase sign failed (" + r.status + ")");
  const j = await r.json();
  let token = j.token || "";
  if (!token && j.url) {
    try { token = new URL(j.url, sbBase()).searchParams.get("token") || ""; } catch (e) {}
  }
  if (!token) throw new Error("Supabase returned no upload token");
  return {
    provider: "supabase",
    uploadUrl: signUrl + "?token=" + encodeURIComponent(token),
    token: token,
    path: clean,
    maxBytes: 50 * 1024 * 1024,   // Supabase free plan: 50 MB per file
    publicUrl: sbBase() + "/storage/v1/object/public/" + encodeURIComponent(SB_BUCKET) + "/" + sbObjectPath(clean)
  };
}

function configured() { return !!(BLOB || GH); }
function activeBackend() { return BLOB ? "vercel-blob" : (GH ? "github-repo" : "none"); }
function hint() {
  return "No storage token is visible to this deployment. In Vercel, Project -> Settings -> Environment Variables, "
       + "add GITHUB_TOKEN (value: a classic token with the repo scope) and tick Production, Preview AND Development, "
       + "then Redeploy. Env vars only apply to a deployment created AFTER they are saved. "
       + "Alternatively connect a Blob store (Storage -> Create) which needs no token.";
}

module.exports = { loadMembers, saveMembers, saveMembersToRepo, loadContent, saveContentToRepo, saveFileToRepo, loadJson, saveJsonToRepo, filePath, FILES, sha256hex,
         signMediaUpload, mediaConfigured, mediaProvider, mediaHint, cloudinarySignature, checkMediaStorage, configured, activeBackend, hint, KEY };
