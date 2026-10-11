/* =====================================================================
   POST /api/join  — records a Join Us request in the club repo.

   This runs on Netlify's servers, so the GitHub token lives in an
   environment variable and is never exposed to the browser. It appends
   the member to data/content.json and increments settings.activeMembers,
   so every visitor sees the same number.

   Env vars: GITHUB_TOKEN (required), GITHUB_OWNER, GITHUB_REPO,
             GITHUB_BRANCH (optional — sensible defaults below).
   ===================================================================== */

const OWNER  = process.env.GITHUB_OWNER  || "balajitharun-cloud";
const REPO   = process.env.GITHUB_REPO   || "ise-horizon-website";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN  = process.env.GITHUB_TOKEN;
const PATH   = "data/content.json";
const API    = "https://api.github.com";

function reply(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

function ghHeaders() {
  return {
    "Accept": "application/vnd.github+json",
    "Authorization": "Bearer " + TOKEN,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "avyakt-join"
  };
}

export default async (req) => {
  if (req.method !== "POST") return reply(405, { ok: false, error: "Method not allowed" });
  if (!TOKEN) return reply(500, { ok: false, error: "Server not configured (GITHUB_TOKEN is missing)" });

  let body;
  try { body = await req.json(); } catch (e) { return reply(400, { ok: false, error: "Bad JSON" }); }

  const name  = String(body.name  || "").trim();
  const email = String(body.email || "").trim();
  const usn   = String(body.usn   || "").trim();
  if (!name || !email || !usn) return reply(400, { ok: false, error: "name, email and usn are required" });

  // 1. read the current content file
  const getUrl = API + "/repos/" + OWNER + "/" + REPO + "/contents/" + PATH + "?ref=" + encodeURIComponent(BRANCH);
  const r = await fetch(getUrl, { headers: ghHeaders() });
  if (!r.ok) return reply(502, { ok: false, error: "GitHub read failed (" + r.status + ")" });
  const meta = await r.json();
  let content;
  try { content = JSON.parse(Buffer.from(meta.content, "base64").toString("utf8")); }
  catch (e) { return reply(502, { ok: false, error: "Could not parse the content file" }); }

  content.members  = Array.isArray(content.members) ? content.members : [];
  content.settings = content.settings || {};

  content.members.unshift({
    id: "m-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name, usn: usn, email: email,
    phone: String(body.phone || "").trim(),
    year: String(body.year || "").trim(),
    branch: String(body.branch || "").trim(),
    interests: Array.isArray(body.interests) ? body.interests : [],
    role: "Active member",
    why: String(body.why || "").trim(),
    joined: new Date().toISOString().slice(0, 10)
  });
  content.settings.activeMembers = (parseInt(content.settings.activeMembers, 10) || 0) + 1;

  // 2. write it back
  const put = await fetch(API + "/repos/" + OWNER + "/" + REPO + "/contents/" + PATH, {
    method: "PUT",
    headers: Object.assign({ "Content-Type": "application/json" }, ghHeaders()),
    body: JSON.stringify({
      message: "New member: " + name + " (" + usn + ")",
      content: Buffer.from(JSON.stringify(content, null, 2) + "\n").toString("base64"),
      sha: meta.sha,
      branch: BRANCH
    })
  });
  if (!put.ok) return reply(502, { ok: false, error: "GitHub write failed (" + put.status + ")" });

  return reply(200, { ok: true, activeMembers: content.settings.activeMembers });
};
