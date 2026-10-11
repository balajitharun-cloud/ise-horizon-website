/* POST /api/join — records a Join Us request in the shared store
   (Vercel Blob, or the GitHub repo). See api/_lib.js. */
const lib = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "Method not allowed" }); return; }
  if (!lib.configured()) { res.status(500).json({ ok: false, error: lib.hint() }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch (e) { body = null; } }
  if (!body || typeof body !== "object") { res.status(400).json({ ok: false, error: "Bad JSON" }); return; }

  const name = String(body.name || "").trim();
  const usn  = String(body.usn  || "").trim();
  if (!name || !usn) { res.status(400).json({ ok: false, error: "name and usn are required" }); return; }

  let loaded, members = [], repoLoaded = null;
  try {
    loaded = await lib.loadMembers();
    if (loaded && loaded.fromRepo) { members = loaded.members; repoLoaded = loaded; }
    else if (Array.isArray(loaded)) { members = loaded; }
  } catch (e) { res.status(502).json({ ok: false, error: e.message }); return; }
  if (!Array.isArray(members)) members = [];

  const duplicate = members.some(function (m) {
    return String(m.usn || "").trim().toLowerCase() === usn.toLowerCase();
  });

  if (!duplicate) {
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
    try {
      const savedToBlob = await lib.saveMembers(members);
      if (!savedToBlob) {
        if (!repoLoaded) { res.status(500).json({ ok: false, error: lib.hint() }); return; }
        await lib.saveMembersToRepo(repoLoaded, members);
      }
    } catch (e) { res.status(502).json({ ok: false, error: e.message }); return; }
  }

  res.status(200).json({ ok: true, activeMembers: members.length, duplicate: duplicate });
};
