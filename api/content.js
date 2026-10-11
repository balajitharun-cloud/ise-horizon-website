/* GET /api/content[?file=certificates] - the shared data straight from the club
   repo, served same-origin so a visitor's browser never has to reach
   api.github.com itself (some networks and ad-blockers refuse it). */
const lib = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const file = String((req.query && req.query.file) || "content");
  if (!Object.prototype.hasOwnProperty.call(lib.FILES, file)) {
    res.status(400).json({ ok: false, error: "unknown file" }); return;
  }
  try {
    const out = await lib.loadJson(lib.filePath(file));
    res.status(200).json({ ok: true, source: "github-repo", file: file, content: out.data, sha: out.sha });
  } catch (e) {
    res.status(502).json({ ok: false, error: e.message });
  }
};
