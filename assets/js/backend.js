/* =====================================================================
   AVYAKT — backend client
   The site's data lives in this GitHub repo (data/*.json), so every
   visitor reads the same content. Public pages only READ. Writing needs a
   GitHub token, which an elite member pastes into the member panel; it is
   kept in that browser's localStorage and is NEVER committed to the repo.
   ===================================================================== */
(function () {
  "use strict";

  var TOKEN_KEY = "avyakt-gh-token";
  var CFG_KEY = "avyakt-gh-config";
  var DEFAULTS = { owner: "balajitharun-cloud", repo: "ise-horizon-website", branch: "main" };
  var API = "https://api.github.com";

  function cfg() {
    var c = {};
    try { c = JSON.parse(localStorage.getItem(CFG_KEY) || "{}"); } catch (e) {}
    return {
      owner: (c.owner || DEFAULTS.owner).trim(),
      repo: (c.repo || DEFAULTS.repo).trim(),
      branch: (c.branch || DEFAULTS.branch).trim()
    };
  }
  function setConfig(c) {
    var cur = cfg();
    var next = { owner: (c && c.owner) || cur.owner, repo: (c && c.repo) || cur.repo, branch: (c && c.branch) || cur.branch };
    try { localStorage.setItem(CFG_KEY, JSON.stringify(next)); } catch (e) {}
    return next;
  }
  function token() { try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; } }
  function setToken(t) {
    try { t ? localStorage.setItem(TOKEN_KEY, String(t).trim()) : localStorage.removeItem(TOKEN_KEY); } catch (e) {}
  }
  function canWrite() { return !!token(); }

  /* ---------- utf-8 safe base64 ---------- */
  function b64encode(str) {
    var bytes = new TextEncoder().encode(str), bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function b64decode(b64) {
    var bin = atob(String(b64).replace(/\s/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function contentsUrl(path) {
    var c = cfg();
    return API + "/repos/" + encodeURIComponent(c.owner) + "/" + encodeURIComponent(c.repo) +
      "/contents/" + path.split("/").map(encodeURIComponent).join("/");
  }
  function headers(extra) {
    var h = { "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    if (token()) h["Authorization"] = "Bearer " + token();
    if (extra) for (var k in extra) h[k] = extra[k];
    return h;
  }
  async function ghError(r) {
    var msg = "";
    try { msg = (await r.json()).message || ""; } catch (e) {}
    return new Error("GitHub " + r.status + (msg ? " — " + msg : ""));
  }

  /* ---------- read ---------- */
  async function pull(path) {
    var r = await fetch(contentsUrl(path) + "?ref=" + encodeURIComponent(cfg().branch),
      { headers: headers(), cache: "no-store" });
    if (r.status === 404) return null;
    if (!r.ok) throw await ghError(r);
    var j = await r.json();
    return { sha: j.sha, data: JSON.parse(b64decode(j.content)) };
  }

  /* ---------- write ---------- */
  async function push(path, obj, message) {
    if (!token()) throw new Error("No GitHub token set — connect the backend first.");
    var sha = null;
    try { var cur = await pull(path); if (cur) sha = cur.sha; } catch (e) {}
    var body = {
      message: message || ("Update " + path),
      content: b64encode(JSON.stringify(obj, null, 2) + "\n"),
      branch: cfg().branch
    };
    if (sha) body.sha = sha;
    var r = await fetch(contentsUrl(path), {
      method: "PUT",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(body)
    });
    if (!r.ok) throw await ghError(r);
    return await r.json();
  }

  /* ---------- the whole shared content file, same-origin ---------- */
  /* Served by the site's own /api/content, so a visitor's browser never has
     to reach api.github.com (which some networks and ad-blockers refuse). */
  async function content(file) {
    try {
      var url = "/api/content" + (file ? ("?file=" + encodeURIComponent(file)) : "");
      var r = await fetch(url, { headers: { "Accept": "application/json" }, cache: "no-store" });
      if (r.ok) {
        var j = await r.json();
        if (j && j.ok && j.content) return { data: j.content, viaApi: true };
      }
    } catch (e) {}
    return null;
  }

  /* ---------- write the site content through the server ---------- */
  /* The GitHub token lives in the host's environment, so the member never
     pastes one into the browser. Authorised with the club passcode. */
  async function saveJson(file, content, pass) {
    var r = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: file || "content", pass: pass || "", content: content })
    });
    if (!r.ok) {
      var msg = "";
      try { var j = await r.json(); msg = j.error || ""; } catch (e) {}
      var err = new Error(msg || ("HTTP " + r.status));
      err.status = r.status;
      throw err;
    }
    return await r.json();
  }
  async function saveContent(content, pass) { return saveJson("content", content, pass); }

  /* ---------- ask the server for a signed media upload URL ---------- */
  /* The file then goes straight to storage from the browser, so a large video
     never passes through the serverless function. */
  async function signMedia(path, pass) {
    var r = await fetch("/api/media-sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: path, pass: pass || "" })
    });
    if (!r.ok) {
      var msg = "";
      try { var j = await r.json(); msg = j.error || ""; } catch (e) {}
      var err = new Error(msg || ("HTTP " + r.status));
      err.status = r.status;
      throw err;
    }
    return await r.json();
  }

  /* ---------- upload a photo through the server ---------- */
  async function uploadFile(path, base64, pass) {
    var r = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: path, base64: base64, pass: pass || "" })
    });
    if (!r.ok) {
      var msg = "";
      try { var j = await r.json(); msg = j.error || ""; } catch (e) {}
      var err = new Error(msg || ("HTTP " + r.status));
      err.status = r.status;
      throw err;
    }
    return await r.json();
  }

  /* ---------- commit a binary file (a photo) ---------- */
  /* base64 with no "data:...;base64," prefix */
  async function pushBinary(path, base64, message) {
    if (!token()) throw new Error("No GitHub token set \u2014 connect the backend in the member panel first.");
    var sha = null;
    try {
      var cur = await fetch(contentsUrl(path) + "?ref=" + encodeURIComponent(cfg().branch),
        { headers: headers(), cache: "no-store" });
      if (cur.ok) sha = (await cur.json()).sha;
    } catch (e) {}
    var body = { message: message || ("Add " + path), content: base64, branch: cfg().branch };
    if (sha) body.sha = sha;
    var r = await fetch(contentsUrl(path), {
      method: "PUT",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(body)
    });
    if (!r.ok) throw await ghError(r);
    return await r.json();
  }

  /* ---------- connection check ---------- */
  async function verify() {
    var c = cfg();
    var r = await fetch(API + "/repos/" + encodeURIComponent(c.owner) + "/" + encodeURIComponent(c.repo),
      { headers: headers(), cache: "no-store" });
    if (!r.ok) throw await ghError(r);
    var j = await r.json();
    return {
      fullName: j.full_name,
      isPrivate: !!j.private,
      defaultBranch: j.default_branch,
      canPush: !!(j.permissions && j.permissions.push)
    };
  }

  /* ---------- shared registrations (Netlify Blobs via /api/stats) ---------- */
  async function stats() {
    var r = await fetch("/api/stats", { headers: { "Accept": "application/json" }, cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  }

  /* ask the site's own backend what it is and whether it works */
  async function diagnose() {
    try {
      var r = await fetch("/api/stats", { headers: { "Accept": "application/json" }, cache: "no-store" });
      if (!r.ok) {
        var msg = "";
        try { var j = await r.json(); msg = j.error || ""; } catch (e) {}
        return { ok: false, status: r.status, error: msg || ("HTTP " + r.status) };
      }
      var d = await r.json();
      return { ok: true, backend: d.backend || "unknown", configured: d.configured !== false,
               activeMembers: d.activeMembers, hint: d.hint || "" };
    } catch (e) {
      return { ok: false, status: 0, error: (e && e.message) || "network error" };
    }
  }

  window.AvyaktBackend = {
    cfg: cfg, setConfig: setConfig,
    token: token, setToken: setToken, canWrite: canWrite,
    pull: pull, push: push, pushBinary: pushBinary, content: content,
    saveContent: saveContent, saveJson: saveJson, uploadFile: uploadFile, signMedia: signMedia, verify: verify, stats: stats, diagnose: diagnose,
    paths: { content: "data/content.json", certificates: "data/certificates.json", submissions: "data/submissions.json" }
  };
})();
