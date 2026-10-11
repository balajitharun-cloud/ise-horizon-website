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
const GH     = process.env.GITHUB_TOKEN;
const BLOB   = process.env.BLOB_READ_WRITE_TOKEN;
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

function configured() { return !!(BLOB || GH); }
function hint() {
  return "Not configured. In Vercel: Storage -> create a Blob store and connect it to this project (nothing to copy), or add a GITHUB_TOKEN environment variable.";
}

module.exports = { loadMembers, saveMembers, saveMembersToRepo, configured, hint, KEY };
