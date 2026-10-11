/* GET /api/stats — the shared member list + count. See api/_lib.js. */
const lib = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  let members = [];
  try {
    const loaded = await lib.loadMembers();
    members = (loaded && loaded.fromRepo) ? loaded.members : (loaded || []);
  } catch (e) { members = []; }
  if (!Array.isArray(members)) members = [];
  res.status(200).json({ ok: true, activeMembers: members.length, members: members });
};
