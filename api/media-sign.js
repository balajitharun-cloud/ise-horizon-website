/* POST /api/media-sign - hand the browser a short-lived signed upload URL for
   Supabase Storage, after checking the club passcode. { path, pass }. */
const lib = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "Method not allowed" }); return; }
  if (!lib.configured()) { res.status(500).json({ ok: false, error: lib.hint() }); return; }
  if (!lib.mediaConfigured()) { res.status(501).json({ ok: false, error: lib.mediaHint() }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch (e) { body = null; } }
  if (!body || typeof body !== "object") { res.status(400).json({ ok: false, error: "Bad JSON" }); return; }

  const path = String(body.path || "").trim();
  if (!path || path.indexOf("..") !== -1 || path.charAt(0) === "/") {
    res.status(400).json({ ok: false, error: "invalid path" }); return;
  }

  try {
    const current = await lib.loadContent();
    const want = (current.data && current.data.settings && current.data.settings.passcodeHash) || "";
    if (!want || lib.sha256hex(String(body.pass || "").trim()) !== want) {
      res.status(401).json({ ok: false, error: "Wrong passcode" }); return;
    }
    const signed = await lib.signMediaUpload("videos/" + path);
    res.status(200).json({ ok: true, uploadUrl: signed.uploadUrl, token: signed.token, publicUrl: signed.publicUrl });
  } catch (e) {
    res.status(502).json({ ok: false, error: e.message });
  }
};
