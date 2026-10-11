/* POST /api/save - the member panel writes the site content here.
   The GitHub token stays on the server, so the member never has to paste one
   into the browser. Authorised with the club passcode. */
const lib = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "Method not allowed" }); return; }
  if (!lib.configured()) { res.status(500).json({ ok: false, error: lib.hint() }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch (e) { body = null; } }
  if (!body || typeof body !== "object") { res.status(400).json({ ok: false, error: "Bad JSON" }); return; }

  const content = body.content;
  if (!content || typeof content !== "object") { res.status(400).json({ ok: false, error: "content is required" }); return; }

  try {
    const current = await lib.loadContent();
    const want = (current.data && current.data.settings && current.data.settings.passcodeHash) || "";
    const got = lib.sha256hex(String(body.pass || "").trim());
    if (!want || got !== want) { res.status(401).json({ ok: false, error: "Wrong passcode" }); return; }

    // never let a stale browser copy revert the passcode hash
    content.settings = content.settings || {};
    content.settings.passcodeHash = want;

    const sha = await lib.saveContentToRepo(current, content);
    res.status(200).json({ ok: true, sha: sha });
  } catch (e) {
    res.status(502).json({ ok: false, error: e.message });
  }
};
