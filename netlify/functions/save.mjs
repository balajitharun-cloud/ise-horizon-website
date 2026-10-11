/* POST /api/save - member panel writes the site content (Netlify).
   Needs GITHUB_TOKEN set on Netlify; without it this returns a clear error. */
import { createHash } from "node:crypto";

const OWNER  = process.env.GITHUB_OWNER  || "balajitharun-cloud";
const REPO   = process.env.GITHUB_REPO   || "ise-horizon-website";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const GH     = process.env.GITHUB_TOKEN;

const reply = (status, obj) => new Response(JSON.stringify(obj), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
});
const ghHeaders = () => {
  const h = { "Accept": "application/vnd.github+json", "User-Agent": "avyakt-site" };
  if (GH) h["Authorization"] = "Bearer " + GH;
  return h;
};

export default async (req) => {
  if (req.method !== "POST") return reply(405, { ok: false, error: "Method not allowed" });
  if (!GH) return reply(500, { ok: false, error: "Set GITHUB_TOKEN in Netlify (Site configuration -> Environment variables) to publish from the panel." });
  let body;
  try { body = await req.json(); } catch (e) { return reply(400, { ok: false, error: "Bad JSON" }); }
  if (!body || !body.content || typeof body.content !== "object") return reply(400, { ok: false, error: "content is required" });
  try {
    const cur = await fetch("https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/data/content.json?ref=" + encodeURIComponent(BRANCH), { headers: ghHeaders() });
    if (!cur.ok) throw new Error("GitHub read failed (" + cur.status + ")");
    const meta = await cur.json();
    const current = JSON.parse(Buffer.from(meta.content, "base64").toString("utf8"));
    const want = (current.settings && current.settings.passcodeHash) || "";
    const got = createHash("sha256").update(String(body.pass || "").trim(), "utf8").digest("hex");
    if (!want || got !== want) return reply(401, { ok: false, error: "Wrong passcode" });
    const file = String(body.file || "content");
    const target = file === "certificates" ? "data/certificates.json" : "data/content.json";
    let targetSha = meta.sha;
    if (file === "certificates") {
      const tr = await fetch("https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/" + target + "?ref=" + encodeURIComponent(BRANCH), { headers: ghHeaders() });
      if (tr.ok) targetSha = (await tr.json()).sha;
      else return reply(502, { ok: false, error: "certificate data not found in the repo" });
    } else {
      body.content.settings = body.content.settings || {};
      body.content.settings.passcodeHash = want;
    }
    const put = await fetch("https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/" + target, {
      method: "PUT",
      headers: Object.assign({ "Content-Type": "application/json" }, ghHeaders()),
      body: JSON.stringify({
        message: file === "certificates" ? "Update certificate data (member panel)" : "Update site content (member panel)",
        content: Buffer.from(JSON.stringify(body.content, null, 2) + "\n").toString("base64"),
        sha: targetSha, branch: BRANCH
      })
    });
    if (!put.ok) throw new Error("GitHub write failed (" + put.status + ")");
    const out = await put.json();
    return reply(200, { ok: true, sha: (out.content && out.content.sha) || "" });
  } catch (e) { return reply(502, { ok: false, error: e.message }); }
};
