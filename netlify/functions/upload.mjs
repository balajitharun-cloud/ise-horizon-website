/* POST /api/upload - gallery photo upload (Netlify, needs GITHUB_TOKEN). */
import { createHash } from "node:crypto";
const OWNER = process.env.GITHUB_OWNER || "balajitharun-cloud";
const REPO  = process.env.GITHUB_REPO  || "ise-horizon-website";
const BRANCH= process.env.GITHUB_BRANCH|| "main";
const GH    = process.env.GITHUB_TOKEN;
const reply = (s,o) => new Response(JSON.stringify(o), { status:s, headers:{"Content-Type":"application/json","Cache-Control":"no-store"} });
const H = () => { const h={ "Accept":"application/vnd.github+json","User-Agent":"avyakt-site" }; if (GH) h["Authorization"]="Bearer "+GH; return h; };

export default async (req) => {
  if (req.method !== "POST") return reply(405, { ok:false, error:"Method not allowed" });
  if (!GH) return reply(500, { ok:false, error:"Set GITHUB_TOKEN in Netlify to upload photos." });
  let b; try { b = await req.json(); } catch(e){ return reply(400,{ok:false,error:"Bad JSON"}); }
  const path = String(b.path||"").trim(), base64 = String(b.base64||"");
  if (!path || !base64) return reply(400,{ok:false,error:"path and base64 are required"});
  if (path.indexOf("..")!==-1 || path.charAt(0)==="/" || !/^assets\/images\/gallery\//.test(path))
    return reply(400,{ok:false,error:"path must be under assets/images/gallery/"});
  try {
    const cur = await fetch("https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/data/content.json?ref="+encodeURIComponent(BRANCH), { headers:H() });
    if (!cur.ok) throw new Error("GitHub read failed ("+cur.status+")");
    const meta = await cur.json();
    const current = JSON.parse(Buffer.from(meta.content,"base64").toString("utf8"));
    const want = (current.settings && current.settings.passcodeHash) || "";
    if (!want || createHash("sha256").update(String(b.pass||"").trim(),"utf8").digest("hex") !== want)
      return reply(401,{ok:false,error:"Wrong passcode"});
    let sha=null;
    const ex = await fetch("https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/"+path.split("/").map(encodeURIComponent).join("/")+"?ref="+encodeURIComponent(BRANCH), { headers:H() });
    if (ex.ok) sha = (await ex.json()).sha;
    const putBody = { message:"Add gallery photo: "+path.split("/").pop(), content: base64, branch: BRANCH };
    if (sha) putBody.sha = sha;
    const put = await fetch("https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/"+path.split("/").map(encodeURIComponent).join("/"), {
      method:"PUT", headers:Object.assign({"Content-Type":"application/json"}, H()), body: JSON.stringify(putBody)
    });
    if (!put.ok) throw new Error("GitHub write failed ("+put.status+")");
    return reply(200, { ok:true, path:path });
  } catch(e){ return reply(502,{ok:false,error:e.message}); }
};
