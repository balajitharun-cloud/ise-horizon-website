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

  // which data file: the site content, or the certificate data
  const file = String(body.file || "content");
  if (!Object.prototype.hasOwnProperty.call(lib.FILES, file)) {
    res.status(400).json({ ok: false, error: "unknown file" }); return;
  }

  try {
    // the passcode always comes from the canonical content file
    const current = await lib.loadContent();
    const want = (current.data && current.data.settings && current.data.settings.passcodeHash) || "";
    const got = lib.sha256hex(String(body.pass || "").trim());
    if (!want || got !== want) { res.status(401).json({ ok: false, error: "Wrong passcode" }); return; }

    let sha;
    if (file === "content") {
      // never let a stale browser copy revert the passcode hash
      content.settings = content.settings || {};
      content.settings.passcodeHash = want;
      sha = await lib.saveContentToRepo(current, content);
    } else {
      const target = await lib.loadJson(lib.filePath(file));
      sha = await lib.saveJsonToRepo(target, lib.filePath(file), content, "Update certificate data (member panel)");
    }
    res.status(200).json({ ok: true, sha: sha });
  } catch (e) {
    res.status(502).json({ ok: false, error: e.message });
  }
};
