/* GET /api/content - the shared site content (events, news, projects,
   gallery, members) straight from the club repo, served same-origin so a
   visitor's browser never has to reach api.github.com itself. */
const lib = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const out = await lib.loadContent();
    res.status(200).json({ ok: true, source: "github-repo", content: out.data, sha: out.sha });
  } catch (e) {
    res.status(502).json({ ok: false, error: e.message });
  }
};
