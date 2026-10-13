/* POST /api/media-sign - signed Supabase upload URL (Netlify). */
import { createHash } from "node:crypto";
const OWNER = process.env.GITHUB_OWNER || "balajitharun-cloud";
const REPO  = process.env.GITHUB_REPO  || "ise-horizon-website";
const BRANCH= process.env.GITHUB_BRANCH|| "main";
const GH    = process.env.GITHUB_TOKEN;
const SB_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SB_BUCKET = process.env.SUPABASE_BUCKET || "media";
const CL_CLOUD  = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD || "";
const CL_KEY    = process.env.CLOUDINARY_API_KEY || "";
const CL_SEC    = process.env.CLOUDINARY_API_SECRET || "";
const CL_FOLDER = process.env.CLOUDINARY_FOLDER || "avyakt";
const reply = (s,o) => new Response(JSON.stringify(o), { status:s, headers:{"Content-Type":"application/json","Cache-Control":"no-store"} });
const enc = p => p.split("/").map(encodeURIComponent).join("/");

export default async (req) => {
  if (req.method !== "POST") return reply(405, { ok:false, error:"Method not allowed" });
  if (!GH) return reply(500, { ok:false, error:"Set GITHUB_TOKEN in Netlify first." });
  if (CL_CLOUD && CL_KEY && CL_SEC) {
    try {
      const cur = await fetch("https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/data/content.json?ref="+encodeURIComponent(BRANCH),
        { headers: { "Accept":"application/vnd.github+json","User-Agent":"avyakt-site", ...(GH?{"Authorization":"Bearer "+GH}:{}) } });
      if (!cur.ok) throw new Error("GitHub read failed ("+cur.status+")");
      const meta = await cur.json();
      const content = JSON.parse(Buffer.from(meta.content,"base64").toString("utf8"));
      const want = (content.settings && content.settings.passcodeHash) || "";
      if (!want || createHash("sha256").update(String(b.pass||"").trim(),"utf8").digest("hex") !== want)
        return reply(401,{ok:false,error:"Wrong passcode"});
      const timestamp = String(Math.floor(Date.now()/1000));
      const folder = CL_FOLDER;
      const pairs = ["folder="+folder, "timestamp="+timestamp].sort();
      const signature = createHash("sha1").update(pairs.join("&") + CL_SEC, "utf8").digest("hex");
      return reply(200, { ok:true, provider:"cloudinary",
        uploadUrl: "https://api.cloudinary.com/v1_1/"+encodeURIComponent(CL_CLOUD)+"/auto/upload",
        apiKey: CL_KEY, timestamp: timestamp, signature: signature, folder: folder,
        maxBytes: 100 * 1024 * 1024 });
    } catch(e){ return reply(502,{ok:false,error:e.message}); }
  }
  if (!SB_URL || !SB_KEY) return reply(501, { ok:false, error:"Media storage is not set up. Set CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in Netlify (no card needed), or the SUPABASE_* equivalents." });
  let b; try { b = await req.json(); } catch(e){ return reply(400,{ok:false,error:"Bad JSON"}); }
  if (b.check === true) {
    if (CL_CLOUD && CL_KEY && CL_SEC) {
      try {
        const auth = Buffer.from(CL_KEY + ":" + CL_SEC).toString("base64");
        const cr = await fetch("https://api.cloudinary.com/v1_1/" + encodeURIComponent(CL_CLOUD) + "/resources/video?max_results=1",
          { headers: { "Authorization": "Basic " + auth } });
        if (cr.status === 401 || cr.status === 403) return reply(200, { provider:"cloudinary", ok:false, detail:"Cloudinary rejected these credentials ("+cr.status+"). Re-copy the API key and secret." });
        if (!cr.ok) return reply(200, { provider:"cloudinary", ok:false, detail:"Cloudinary check failed ("+cr.status+")" });
        return reply(200, { provider:"cloudinary", ok:true, target: CL_CLOUD + " (folder: " + CL_FOLDER + ")" });
      } catch(e){ return reply(200, { provider:"cloudinary", ok:false, detail:e.message }); }
    }
    if (SB_URL && SB_KEY) {
      try {
        const sr = await fetch(SB_URL+"/storage/v1/object/upload/sign/"+encodeURIComponent(SB_BUCKET)+"/"+enc("probe/check.mp4"),
          { method:"POST", headers:{ "Authorization":"Bearer "+SB_KEY, "apikey":SB_KEY, "x-upsert":"true" } });
        if (!sr.ok) return reply(200, { provider:"supabase", ok:false, detail:"Supabase refused to sign ("+sr.status+"). Check the service key and that the '"+SB_BUCKET+"' bucket exists." });
        return reply(200, { provider:"supabase", ok:true, target: SB_BUCKET + " bucket" });
      } catch(e){ return reply(200, { provider:"supabase", ok:false, detail:e.message }); }
    }
    return reply(200, { provider:"none", ok:false, detail:"Media storage is not set up. Set CLOUDINARY_* or SUPABASE_* environment variables in Netlify." });
  }
  const path = String(b.path||"").trim();
  if (!path || path.indexOf("..")!==-1 || path.charAt(0)==="/") return reply(400,{ok:false,error:"invalid path"});
  try {
    const cur = await fetch("https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/data/content.json?ref="+encodeURIComponent(BRANCH),
      { headers: { "Accept":"application/vnd.github+json","User-Agent":"avyakt-site", ...(GH?{"Authorization":"Bearer "+GH}:{}) } });
    if (!cur.ok) throw new Error("GitHub read failed ("+cur.status+")");
    const meta = await cur.json();
    const content = JSON.parse(Buffer.from(meta.content,"base64").toString("utf8"));
    const want = (content.settings && content.settings.passcodeHash) || "";
    if (!want || createHash("sha256").update(String(b.pass||"").trim(),"utf8").digest("hex") !== want)
      return reply(401,{ok:false,error:"Wrong passcode"});
    const clean = path.replace(/[^A-Za-z0-9._/-]/g,"-");
    const signUrl = SB_URL+"/storage/v1/object/upload/sign/"+encodeURIComponent(SB_BUCKET)+"/"+enc("videos/"+clean);
    const r = await fetch(signUrl, { method:"POST", headers:{ "Authorization":"Bearer "+SB_KEY, "apikey":SB_KEY, "x-upsert":"true" } });
    if (!r.ok) throw new Error("Supabase sign failed ("+r.status+")");
    const j = await r.json();
    let token = j.token || "";
    if (!token && j.url) { try { token = new URL(j.url, SB_URL).searchParams.get("token") || ""; } catch(e){} }
    if (!token) throw new Error("Supabase returned no upload token");
    return reply(200, { ok:true, provider:"supabase", maxBytes: 50 * 1024 * 1024, uploadUrl: signUrl+"?token="+encodeURIComponent(token), token: token,
      publicUrl: SB_URL+"/storage/v1/object/public/"+encodeURIComponent(SB_BUCKET)+"/"+enc("videos/"+clean) });
  } catch(e){ return reply(502,{ok:false,error:e.message}); }
};
