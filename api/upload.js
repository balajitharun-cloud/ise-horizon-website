/* POST /api/upload - the member panel uploads a gallery photo here.
   { path, base64, pass } -> committed to the repo with the server's token. */
const lib = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "Method not allowed" }); return; }
  if (!lib.configured()) { res.status(500).json({ ok: false, error: lib.hint() }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch (e) { body = null; } }
  if (!body || typeof body !== "object") { res.status(400).json({ ok: false, error: "Bad JSON" }); return; }

  const path = String(body.path || "").trim();
  const base64 = String(body.base64 || "");
  if (!path || !base64) { res.status(400).json({ ok: false, error: "path and base64 are required" }); return; }
  if (path.indexOf("..") !== -1 || path.charAt(0) === "/" || !/^assets\/images\/gallery\//.test(path)) {
    res.status(400).json({ ok: false, error: "path must be under assets/images/gallery/" }); return;
  }

  try {
    const current = await lib.loadContent();
    const want = (current.data && current.data.settings && current.data.settings.passcodeHash) || "";
    if (!want || lib.sha256hex(String(body.pass || "").trim()) !== want) {
      res.status(401).json({ ok: false, error: "Wrong passcode" }); return;
    }
    await lib.saveFileToRepo(path, base64, "Add gallery photo: " + path.split("/").pop());
    res.status(200).json({ ok: true, path: path });
  } catch (e) {
    res.status(502).json({ ok: false, error: e.message });
  }
};
