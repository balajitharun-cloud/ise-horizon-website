/* GET /api/content[?file=certificates] - shared data from the club repo (Netlify). */
const OWNER  = process.env.GITHUB_OWNER  || "balajitharun-cloud";
const REPO   = process.env.GITHUB_REPO   || "ise-horizon-website";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const GH     = process.env.GITHUB_TOKEN;

export default async (req) => {
  const url = new URL(req.url);
  const file = url.searchParams.get("file") || "content";
  const target = file === "certificates" ? "data/certificates.json" : "data/content.json";
  const headers = { "Accept": "application/vnd.github+json", "User-Agent": "avyakt-site" };
  if (GH) headers["Authorization"] = "Bearer " + GH;
  try {
    const r = await fetch("https://api.github.com/repos/" + OWNER + "/" + REPO +
      "/contents/" + target + "?ref=" + encodeURIComponent(BRANCH), { headers });
    if (!r.ok) throw new Error("GitHub read failed (" + r.status + ")");
    const meta = await r.json();
    const data = JSON.parse(Buffer.from(meta.content, "base64").toString("utf8"));
    return new Response(JSON.stringify({ ok: true, source: "github-repo", file: file, content: data, sha: meta.sha }), {
      status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 502, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  }
};
