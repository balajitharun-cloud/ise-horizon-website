/* =====================================================================
   POST /api/join — records a Join Us request in Netlify Blobs.

   No GitHub token and no environment variables needed: the storage is
   part of Netlify itself. Every visitor reads the same list, so the
   Active-members count is the same on every device.

   (For Vercel there is api/join.js, which writes to the GitHub repo and
    does need GITHUB_TOKEN.)
   ===================================================================== */

import { getStore } from "@netlify/blobs";

const STORE = "avyakt";

function reply(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

export default async (req) => {
  if (req.method !== "POST") return reply(405, { ok: false, error: "Method not allowed" });

  let body;
  try { body = await req.json(); } catch (e) { return reply(400, { ok: false, error: "Bad JSON" }); }

  const name = String(body.name || "").trim();
  const usn  = String(body.usn  || "").trim();
  if (!name || !usn) return reply(400, { ok: false, error: "name and usn are required" });

  const store = getStore(STORE);
  let members = [];
  try { members = (await store.get("members", { type: "json" })) || []; } catch (e) { members = []; }
  if (!Array.isArray(members)) members = [];

  // ignore an exact duplicate (same USN) so a double-tap doesn't inflate the count
  const already = members.some(function (m) {
    return String(m.usn || "").trim().toLowerCase() === usn.toLowerCase();
  });

  if (!already) {
    members.unshift({
      id: "m-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name,
      usn: usn,
      year: String(body.year || "").trim(),
      branch: String(body.branch || "").trim(),
      interests: Array.isArray(body.interests) ? body.interests : [],
      role: "Active member",
      why: String(body.why || "").trim(),
      joined: new Date().toISOString().slice(0, 10)
    });
    await store.setJSON("members", members);
  }

  return reply(200, { ok: true, activeMembers: members.length, duplicate: already });
};
