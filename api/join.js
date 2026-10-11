/* =====================================================================
   POST /api/join — Vercel Serverless Function (CommonJS).

   Same job as the Netlify function: record a Join Us request in the club
   repo so every visitor sees the same Active-members count. The GitHub
   token lives in a Vercel environment variable, never in the browser.

   Env vars: GITHUB_TOKEN (required), GITHUB_OWNER, GITHUB_REPO,
             GITHUB_BRANCH (optional).
   ===================================================================== */

const OWNER  = process.env.GITHUB_OWNER  || "balajitharun-cloud";
const REPO   = process.env.GITHUB_REPO   || "ise-horizon-website";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN  = process.env.GITHUB_TOKEN;
const PATH   = "data/content.json";
const API    = "https://api.github.com";

function ghHeaders() {
  return {
    "Accept": "application/vnd.github+json",
    "Authorization": "Bearer " + TOKEN,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "avyakt-join"
  };
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "Method not allowed" }); return; }
  if (!TOKEN) { res.status(500).json({ ok: false, error: "Server not configured (GITHUB_TOKEN is missing)" }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch (e) { body = null; } }
  if (!body || typeof body !== "object") { res.status(400).json({ ok: false, error: "Bad JSON" }); return; }

  const name  = String(body.name  || "").trim();
  const email = String(body.email || "").trim();
  const usn   = String(body.usn   || "").trim();
  if (!name || !usn) { res.status(400).json({ ok: false, error: "name and usn are required" }); return; }

  const getUrl = API + "/repos/" + OWNER + "/" + REPO + "/contents/" + PATH + "?ref=" + encodeURIComponent(BRANCH);
  const r = await fetch(getUrl, { headers: ghHeaders() });
  if (!r.ok) { res.status(502).json({ ok: false, error: "GitHub read failed (" + r.status + ")" }); return; }
  const meta = await r.json();

  let content;
  try { content = JSON.parse(Buffer.from(meta.content, "base64").toString("utf8")); }
  catch (e) { res.status(502).json({ ok: false, error: "Could not parse the content file" }); return; }

  content.members  = Array.isArray(content.members) ? content.members : [];
  content.settings = content.settings || {};
  content.members.unshift({
    id: "m-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name, usn: usn,
    phone: String(body.phone || "").trim(),
    year: String(body.year || "").trim(),
    branch: String(body.branch || "").trim(),
    interests: Array.isArray(body.interests) ? body.interests : [],
    role: "Active member",
    why: String(body.why || "").trim(),
    joined: new Date().toISOString().slice(0, 10)
  });
  content.settings.activeMembers = (parseInt(content.settings.activeMembers, 10) || 0) + 1;

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
  if (!put.ok) { res.status(502).json({ ok: false, error: "GitHub write failed (" + put.status + ")" }); return; }

  res.status(200).json({ ok: true, activeMembers: content.settings.activeMembers });
};
