/* =====================================================================
   AVYAKT — member panel (admin.js)
   Elite members add/edit/remove events, news, projects, gallery items and
   members. Everything is stored via HorizonStore (localStorage).
   ===================================================================== */
(function () {
  "use strict";
  var S = window.HorizonStore;
  var A = window.HorizonApp;
  var $ = A.$, $$ = A.$$, esc = A.esc, fmtDate = A.fmtDate;
  var B = window.AvyaktBackend;

  /* ---------- photo upload ---------- */
  /* Downscale and re-encode in the browser so a phone photo becomes a
     few hundred KB before it is committed to the repo. */
  function compressToJpeg(file, maxDim, quality) {
    maxDim = maxDim || 1600;
    quality = quality || 0.82;
    return new Promise(function (resolve, reject) {
      if (!/^image\//.test(file.type || "")) { reject(new Error("that file is not an image")); return; }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
          var scale = Math.min(1, maxDim / Math.max(w, h));
          var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
          var c = document.createElement("canvas");
          c.width = cw; c.height = ch;
          var ctx = c.getContext("2d");
          ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, cw, ch);   // flatten transparency to white
          ctx.drawImage(img, 0, 0, cw, ch);
          URL.revokeObjectURL(url);
          var dataUrl = c.toDataURL("image/jpeg", quality);
          var b64 = dataUrl.split(",")[1] || "";
          resolve({ base64: b64, width: cw, height: ch, bytes: Math.round(b64.length * 3 / 4) });
        } catch (e) { URL.revokeObjectURL(url); reject(e); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("could not read that image")); };
      img.src = url;
    });
  }
  function slugName(s) {
    return String(s || "photo").toLowerCase().replace(/\.[a-z0-9]+$/, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "photo";
  }

  /* ---------- field schemas ---------- */
  var SCHEMAS = {
    events: {
      label: "Events", icon: "📅", addLabel: "Add event",
      fields: [
        { k: "title", l: "Title", t: "text", req: true },
        { k: "date", l: "Date", t: "date" },
        { k: "time", l: "Time", t: "text", ph: "e.g. 10:00 AM – 4:00 PM" },
        { k: "venue", l: "Venue / link", t: "text" },
        { k: "mode", l: "Mode", t: "select", o: ["Offline", "Online", "Hybrid"] },
        { k: "category", l: "Category", t: "text", ph: "Workshop / Competition / Cultural / Sports…" },
        { k: "registration", l: "Registration URL (optional)", t: "url" },
        { k: "poster", l: "Poster emoji (optional)", t: "text", ph: "🚀" },
        { k: "description", l: "Description", t: "textarea" }
      ],
      title: function (it) { return it.title; },
      sub: function (it) { return (it.date ? fmtDate(it.date) : "no date") + (it.venue ? " · " + it.venue : ""); },
      extra: function (it, key) { return '<button class="btn btn-ghost btn-sm" data-archive="' + it.id + '">Archive</button>'; }
    },
    news: {
      label: "News", icon: "📰", addLabel: "Publish update",
      fields: [
        { k: "title", l: "Title", t: "text", req: true },
        { k: "date", l: "Date", t: "date" },
        { k: "tag", l: "Tag", t: "text", ph: "Update / Achievement / Recap" },
        { k: "excerpt", l: "Short summary", t: "textarea" },
        { k: "body", l: "Full text", t: "textarea" }
      ],
      title: function (it) { return it.title; },
      sub: function (it) { return (it.tag || "") + (it.date ? " · " + fmtDate(it.date) : ""); }
    },
    projects: {
      label: "Projects", icon: "💡", addLabel: "Add project",
      fields: [
        { k: "title", l: "Title", t: "text", req: true },
        { k: "status", l: "Status", t: "select", o: ["Ongoing", "Completed"] },
        { k: "desc", l: "Description", t: "textarea" },
        { k: "stack", l: "Tech stack (comma separated)", t: "list" },
        { k: "team", l: "Team members (comma separated)", t: "list" },
        { k: "github", l: "GitHub repository URL", t: "url" },
        { k: "demo", l: "Live demo URL (optional)", t: "url" }
      ],
      title: function (it) { return it.title; },
      sub: function (it) { return (it.status || "") + (it.github ? " · " + it.github : ""); }
    },
    gallery: {
      label: "Gallery", icon: "🖼️", addLabel: "Add photo",
      fields: [
        { k: "caption", l: "Caption", t: "text", req: true },
        { k: "img", l: "Photo (upload)", t: "image" },
        { k: "emoji", l: "Emoji (used when there is no photo)", t: "text", ph: "🚀" },
        { k: "wide", l: "Wide tile", t: "check" }
      ],
      title: function (it) { return it.caption; },
      sub: function (it) { return it.img ? "photo" : (it.emoji || ""); },
      extra: function (it) {
        return it.img ? '<img src="' + esc(it.img) + '" alt="" style="width:38px;height:38px;object-fit:cover;border-radius:6px">' : "";
      }
    },
    members: {
      label: "Members", icon: "👥", addLabel: "Add member",
      fields: [
        { k: "name", l: "Name", t: "text", req: true },
        { k: "usn", l: "USN", t: "text" },
        { k: "year", l: "Year", t: "select", o: ["", "1st Year", "2nd Year", "3rd Year", "4th Year"] },
        { k: "branch", l: "Branch", t: "text" },
        { k: "role", l: "Role", t: "select", o: ["Active member", "Event host"] },
        { k: "interests", l: "Interests (comma separated)", t: "list" },
        { k: "why", l: "Why they want to join", t: "textarea" },
        { k: "joined", l: "Joined", t: "date" }
      ],
      title: function (it) { return it.name + (it.usn ? " · " + it.usn : ""); },
      sub: function (it) {
        return [it.role || "Active member", it.year || "", it.branch || ""].filter(Boolean).join(" · ");
      },
      detail: function (it) {
        var bits = [];
        if (it.interests && it.interests.length) bits.push("Interests: " + esc([].concat(it.interests).join(", ")));
        if (it.why) bits.push("Why: " + esc(it.why));
        if (it.joined) bits.push("Joined: " + esc(fmtDate(it.joined)));
        return bits.join("<br>");
      }
    },
    history: {
      label: "History", icon: "🕓", addLabel: "Add history entry",
      fields: [
        { k: "year", l: "Year", t: "text", req: true, ph: "2026" },
        { k: "text", l: "What happened", t: "textarea" }
      ],
      title: function (it) { return it.year; },
      sub: function (it) { return it.text || ""; }
    },
    achievements: {
      label: "Hall of Fame", icon: "🏆", addLabel: "Add achievement",
      fields: [
        { k: "year", l: "Year", t: "text", ph: "2026" },
        { k: "title", l: "Achievement / winner", t: "text", req: true },
        { k: "detail", l: "Details (event, position)", t: "textarea" }
      ],
      title: function (it) { return it.title; },
      sub: function (it) { return (it.year || "") + (it.detail ? " · " + it.detail : ""); }
    }
  };

  var TABS = ["events", "news", "projects", "gallery", "members", "history", "achievements", "hackathon", "stats", "backend", "data"];
  var current = "events";
  var editingId = null;

  /* ---------- field rendering ---------- */
  function fieldHtml(f, val) {
    val = val == null ? "" : val;
    var id = "f-" + f.k;
    var req = f.req ? ' required' : "";
    var star = f.req ? ' <span class="req">*</span>' : "";
    var h = '<div class="field"><label for="' + id + '">' + esc(f.l) + star + "</label>";
    if (f.t === "textarea") h += '<textarea id="' + id + '" name="' + f.k + '" rows="3"' + req + ">" + esc(val) + "</textarea>";
    else if (f.t === "select") h += '<select id="' + id + '" name="' + f.k + '">' + (f.o || []).map(function (o) { return '<option' + (o === val ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") + "</select>";
    else if (f.t === "check") h += '<label style="display:inline-flex;gap:8px;align-items:center;font-weight:500"><input type="checkbox" id="' + id + '" name="' + f.k + '"' + (val ? " checked" : "") + "> Yes</label>";
    else if (f.t === "list") h += '<input id="' + id + '" name="' + f.k + '" type="text" value="' + esc(Array.isArray(val) ? val.join(", ") : val) + '" placeholder="a, b, c">';
    else if (f.t === "image") {
      h += '<input type="hidden" id="' + id + '" name="' + f.k + '" value="' + esc(val) + '">' +
        '<input type="file" class="img-file" accept="image/*" data-for="' + id + '">' +
        '<div class="img-prev" id="' + id + '-prev">' +
          (val ? '<img src="' + esc(val) + '" alt="">' : '<span class="muted small">No photo yet</span>') +
        "</div>" +
        '<div class="pill-row" style="margin-top:8px;gap:10px;align-items:center">' +
          '<span class="muted small" id="' + id + '-note"></span>' +
          '<button class="btn btn-ghost btn-sm" type="button" id="' + id + '-clear"' + (val ? "" : ' style="display:none"') + ">Remove photo</button>" +
        "</div>";
    }
    else h += '<input id="' + id + '" name="' + f.k + '" type="' + (f.t === "url" ? "url" : f.t === "date" ? "date" : "text") + '" value="' + esc(val) + '"' + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : "") + req + ">";
    return h + "</div>";
  }

  function readForm(form, sch) {
    var out = {};
    sch.fields.forEach(function (f) {
      var el = form.elements[f.k];
      if (!el) return;
      if (f.t === "check") out[f.k] = el.checked;
      else if (f.t === "list") out[f.k] = String(el.value || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      else out[f.k] = el.value;
    });
    return out;
  }

  function listRow(sch, it) {
    return '<div class="pill-row" style="justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--border);padding:10px 0;gap:10px">' +
      "<span style=\"min-width:0\"><strong>" + esc(sch.title(it)) + "</strong><br><span class=\"small muted\">" + esc(sch.sub(it)) + "</span>" +
      (sch.detail ? '<div class="small muted" style="margin-top:4px">' + sch.detail(it) + "</div>" : "") +
      "</span>" +
      '<span class="pill-row" style="flex:none">' +
        (sch.extra ? sch.extra(it) : "") +
        '<button class="btn btn-ghost btn-sm" data-edit="' + it.id + '">Edit</button>' +
        '<button class="btn btn-ghost btn-sm" data-del="' + it.id + '">Delete</button>' +
      "</span></div>";
  }

  /* ---------- section views ---------- */
  function listSection(key) {
    var sch = SCHEMAS[key], items = S.get()[key] || [];
    return '<div class="two-col">' +
      '<div class="form-card">' +
        '<h2 style="margin-top:0">' + esc(sch.addLabel) + "</h2>" +
        '<form id="af"><input type="hidden" name="__id" value="">' +
          sch.fields.map(function (f) { return fieldHtml(f, ""); }).join("") +
          '<div class="pill-row"><button class="btn btn-primary" type="submit" id="af-submit">' + esc(sch.addLabel) + "</button>" +
          '<button class="btn btn-ghost" type="button" id="af-cancel" style="display:none">Cancel edit</button></div>' +
          '<div class="notice" id="af-note"></div>' +
        "</form>" +
      "</div>" +
      '<div class="card"><div class="card-body">' +
        "<h3>" + esc(sch.label) + ' <span class="chip chip--green">' + items.length + "</span></h3>" +
        '<div style="max-height:520px;overflow:auto">' + (items.length ? items.map(function (it) { return listRow(sch, it); }).join("") : '<p class="muted small">Nothing here yet.</p>') + "</div>" +
      "</div></div>" +
    "</div>";
  }

  function hackathonSection() {
    var h = S.get().hackathon || {};
    return '<div class="form-card" style="max-width:620px;margin:0 auto">' +
      '<h2 style="margin-top:0">Horizon Hackathon</h2>' +
      '<p class="muted small">This highlights your flagship hackathon on the home page. Turn it off to hide the section.</p>' +
      '<form id="hf">' +
        fieldHtml({ k: "title", l: "Title", t: "text" }, h.title) +
        fieldHtml({ k: "date", l: "Date", t: "date" }, h.date) +
        fieldHtml({ k: "venue", l: "Venue", t: "text" }, h.venue) +
        fieldHtml({ k: "description", l: "Description", t: "textarea" }, h.description) +
        fieldHtml({ k: "link", l: "Registration / info URL", t: "url" }, h.link) +
        fieldHtml({ k: "active", l: "Show on home page", t: "check" }, h.active) +
        '<button class="btn btn-primary" type="submit">Save</button>' +
        '<div class="notice" id="hf-note"></div>' +
      "</form></div>";
  }

  function statsSection() {
    var st = S.stats();
    var members = st.activeMembers;
    var hosted = st.eventsHosted;
    var listed = (S.get().members || []).length;
    return '<div class="form-card" style="max-width:620px;margin:0 auto">' +
      '<h2 style="margin-top:0">Home-page stats</h2>' +
      '<p class="muted small">These two numbers are shown on the home page. You can change them any time.</p>' +
      '<form id="sf">' +
        '<div class="field"><label for="f-activeMembers">Active members</label>' +
        '<input id="f-activeMembers" name="activeMembers" type="number" min="0" value="' + esc(members) + '">' +
        '<div class="hint">Never shows less than the number of members recorded below (' + listed + '). New Join Us requests add to that list.</div></div>' +
        '<div class="field"><label for="f-eventsHosted">Events hosted</label>' +
        '<input id="f-eventsHosted" name="eventsHosted" type="number" min="0" value="' + esc(hosted) + '">' +
        '<div class="hint">Set by an elite member.</div></div>' +
        '<button class="btn btn-primary" type="submit">Save</button>' +
        '<div class="notice" id="sf-note"></div>' +
      "</form></div>";
  }

  function dataSection() {
    return '<div class="two-col">' +
      '<div class="form-card"><h2 style="margin-top:0">Backup &amp; restore</h2>' +
        '<p class="muted small">Content lives in the club repo (see the Backend tab). Export a JSON backup any time, or import one to restore.</p>' +
        '<div class="pill-row">' +
          '<button class="btn btn-primary btn-sm" id="d-export">⬆️ Export JSON</button>' +
          '<label class="btn btn-ghost btn-sm" style="cursor:pointer">⬇️ Import JSON<input type="file" id="d-import" accept=".json" hidden></label>' +
          '<button class="btn btn-ghost btn-sm" id="d-reset">Reset to defaults</button>' +
          '<button class="btn btn-ghost btn-sm" id="d-lock">Lock panel</button>' +
        "</div><div class=\"notice\" id=\"d-note\"></div>" +
      "</div>" +
      '<div class="card"><div class="card-body"><h3>Certificates</h3>' +
        '<p class="muted small">Participant lists and certificate details are managed in the Certificate Portal.</p>' +
        '<a class="btn btn-blue btn-sm" href="certificate.html">Open Certificate Portal</a>' +
      "</div></div>" +
    "</div>";
  }

  /* ---------- render ---------- */
  function renderTabs() {
    $("#adminTabs").innerHTML = TABS.map(function (k) {
      var l = k === "hackathon" ? "🏆 Hackathon" : k === "stats" ? "📊 Stats" : k === "backend" ? "🔗 Backend" : k === "data" ? "💾 Data" : SCHEMAS[k].icon + " " + SCHEMAS[k].label;
      return '<button class="tab' + (k === current ? " active" : "") + '" data-tab="' + k + '">' + l + "</button>";
    }).join("");
    $$("#adminTabs .tab").forEach(function (b) {
      b.addEventListener("click", function () { current = this.getAttribute("data-tab"); editingId = null; renderTabs(); renderBody(); });
    });
  }

  function renderBody() {
    var body = $("#adminBody");
    if (current === "hackathon") { body.innerHTML = hackathonSection(); wireHackathon(); return; }
    if (current === "stats") { body.innerHTML = statsSection(); wireStats(); return; }
    if (current === "backend") { body.innerHTML = backendSection(); wireBackend(); return; }
    if (current === "data") { body.innerHTML = dataSection(); wireData(); return; }
    body.innerHTML = listSection(current);
    wireList(current);
  }

  /* ---------- auto-publish ---------- */
  /* Every add / edit / delete is pushed to the club repo shortly after the
     change, so the website and every visitor see it without anyone having to
     remember a separate Publish step. */
  var pubTimer = null;
  function schedulePublish(note) {
    if (!B || !B.canWrite || !B.canWrite()) {
      if (note) note.textContent = "Saved on this device. Connect the backend (Backend tab) to share it with everyone.";
      return;
    }
    if (note) note.textContent = "Saved. Publishing to the club database\u2026";
    clearTimeout(pubTimer);
    pubTimer = setTimeout(async function () {
      try {
        await S.publish();
        if (note && note.isConnected) note.textContent = "Saved and published \u2014 visitors see it within a minute.";
      } catch (e) {
        if (note && note.isConnected) note.textContent = "Saved locally, but publishing failed: " + ((e && e.message) || e);
      }
    }, 1200);
  }

  function wireImageFields(form) {
    $$(".img-file", form).forEach(function (input) {
      input.addEventListener("change", async function () {
        var file = this.files && this.files[0];
        if (!file) return;
        var id = this.getAttribute("data-for");
        var hidden = $("#" + id), prev = $("#" + id + "-prev"), note = $("#" + id + "-note");
        if (!B || !B.pushBinary) { note.textContent = "Backend not loaded."; return; }
        if (!B.canWrite || !B.canWrite()) { note.textContent = "Connect the backend (Backend tab) first \u2014 uploading needs the GitHub token."; return; }
        note.textContent = "Preparing\u2026";
        try {
          var out = await compressToJpeg(file);
          note.textContent = "Uploading " + Math.round(out.bytes / 1024) + " KB\u2026";
          var path = "assets/images/gallery/" + slugName(file.name) + "-" + Date.now().toString(36) + ".jpg";
          await B.pushBinary(path, out.base64, "Add gallery photo: " + file.name);
          hidden.value = path;
          prev.innerHTML = '<img src="' + path + '" alt="">';
          note.textContent = "Uploaded (" + out.width + "\u00d7" + out.height + "). Press Add/Save, then Publish.";
          var cl = $("#" + id + "-clear"); if (cl) cl.style.display = "";
        } catch (e) {
          note.textContent = "Upload failed: " + ((e && e.message) || e);
        }
        this.value = "";
      });
    });
    $$("[id$='-clear']", form).forEach(function (b) {
      b.addEventListener("click", function () {
        var id = this.id.replace(/-clear$/, "");
        var hidden = $("#" + id);
        if (hidden) hidden.value = "";
        var prev = $("#" + id + "-prev");
        if (prev) prev.innerHTML = '<span class="muted small">No photo yet</span>';
        var note = $("#" + id + "-note");
        if (note) note.textContent = "";
        this.style.display = "none";
      });
    });
  }

  function wireList(key) {
    var sch = SCHEMAS[key], form = $("#af");
    wireImageFields(form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = $("#af-note");
      var data = readForm(form, sch);
      if (editingId) { S.update(key, editingId, data); note.className = "notice ok show"; note.textContent = "Updated."; }
      else { S.add(key, data); note.className = "notice ok show"; note.textContent = "Added."; }
      editingId = null;
      schedulePublish(note);
      renderBody();
    });
    $("#af-cancel").addEventListener("click", function () { editingId = null; renderBody(); });
    $$("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () {
        var it = S.find(key, this.getAttribute("data-edit")); if (!it) return;
        editingId = it.id;
        sch.fields.forEach(function (f) { var el = form.elements[f.k]; if (!el) return; el.value = f.t === "check" ? it[f.k] : (Array.isArray(it[f.k]) ? it[f.k].join(", ") : (it[f.k] || "")); if (f.t === "check") el.checked = !!it[f.k]; });
        $("#af-submit").textContent = "Save changes";
        $("#af-cancel").style.display = "";
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    $$("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () { if (confirm("Delete this item?")) { S.remove(key, this.getAttribute("data-del")); schedulePublish(null); renderBody(); } });
    });
    $$("[data-archive]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = this.getAttribute("data-archive"), it = S.find("events", id); if (!it) return;
        S.add("pastEvents", it); S.remove("events", id);
        // an event was completed -> bump the Events-hosted counter
        var st = S.get().settings; st.eventsHosted = (parseInt(st.eventsHosted, 10) || 0) + 1; S.save();
        schedulePublish(null);
        renderBody();
      });
    });
  }

  function wireHackathon() {
    var h = S.get().hackathon, form = $("#hf");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      h.title = form.elements.title.value; h.date = form.elements.date.value; h.venue = form.elements.venue.value;
      h.description = form.elements.description.value; h.link = form.elements.link.value; h.active = form.elements.active.checked;
      S.save();
      var n = $("#hf-note"); n.className = "notice ok show"; n.textContent = "Saved.";
      schedulePublish(n);
    });
  }

  function wireStats() {
    var f = $("#sf");
    if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var m = parseInt(f.elements.activeMembers.value, 10); if (isNaN(m) || m < 0) m = 0;
      var v = parseInt(f.elements.eventsHosted.value, 10); if (isNaN(v) || v < 0) v = 0;
      var st = S.get().settings; st.activeMembers = m; st.eventsHosted = v; S.save();
      var n = $("#sf-note"); n.className = "notice ok show"; n.textContent = "Saved.";
      schedulePublish(n);
    });
  }

  function wireData() {
    $("#d-export").addEventListener("click", function () {
      var blob = new Blob([S.export()], { type: "application/json" });
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "avyakt-content.json";
      document.body.appendChild(a); a.click(); a.remove();
    });
    $("#d-import").addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return; var r = new FileReader();
      r.onload = function () { try { S.importJson(r.result); renderBody(); alert("Imported successfully."); } catch (err) { alert("Could not read that file."); } };
      r.readAsText(f);
    });
    $("#d-reset").addEventListener("click", function () { if (confirm("Reset all content to defaults? This cannot be undone.")) { S.reset(); renderBody(); } });
    $("#d-lock").addEventListener("click", function () { S.lock(); location.reload(); });
  }

  /* ---------- backend ---------- */
  function backendSection() {
    var B = window.AvyaktBackend;
    if (!B) return '<p class="muted">Backend module did not load.</p>';
    var c = B.cfg(), st = S.state(), connected = B.canWrite();
    return '<div class="two-col">' +
      '<div class="form-card"><h2 style="margin-top:0">Backend connection</h2>' +
        '<p class="muted small">Site content is stored in the club&rsquo;s GitHub repo, so every visitor sees the same thing. Reading is public; <strong>publishing needs a GitHub token</strong>, which stays only in this browser.</p>' +
        '<div class="field-row two">' +
          '<div class="field"><label for="be-owner">Repo owner</label><input id="be-owner" value="' + esc(c.owner) + '"></div>' +
          '<div class="field"><label for="be-repo">Repo name</label><input id="be-repo" value="' + esc(c.repo) + '"></div>' +
        '</div>' +
        '<div class="field"><label for="be-branch">Branch</label><input id="be-branch" value="' + esc(c.branch) + '"></div>' +
        '<div class="field"><label for="be-token">GitHub token</label>' +
          '<input id="be-token" type="password" autocomplete="off" placeholder="' + (connected ? "stored in this browser" : "github_pat_...") + '">' +
          '<div class="hint">Use a <strong>fine-grained token</strong> with <em>Contents: Read and write</em> on this one repo. It is saved in this browser only and never committed.</div>' +
        '</div>' +
        '<div class="pill-row">' +
          '<button class="btn btn-blue btn-sm" id="be-save">Save &amp; test</button>' +
          '<button class="btn btn-ghost btn-sm" id="be-forget">Forget token</button>' +
        '</div><div class="notice" id="be-note"></div>' +
      '</div>' +
      '<div class="form-card"><h3 style="margin-top:0">Sync</h3>' +
        '<p class="muted small">' + (connected ? 'Connected. Publishing writes the content file to the repo; GitHub Pages then rebuilds (about a minute).' : 'Not connected yet &mdash; you can still edit locally and export a JSON backup.') + '</p>' +
        '<div class="pill-row">' +
          '<button class="btn btn-primary btn-sm" id="be-pull">&#11015;&#65039; Pull from backend</button>' +
          '<button class="btn btn-primary btn-sm" id="be-push">&#11014;&#65039; Publish to backend</button>' +
        '</div>' +
        '<p class="muted small" style="margin-top:12px">' + (st.error ? 'Last error: ' + esc(st.error) : (st.synced ? 'In sync with the backend.' : 'Not synced yet.')) + '</p>' +
      '</div>' +
      '<div class="form-card" style="grid-column:1/-1"><h3 style="margin-top:0">Shared sign-up (Join Us)</h3>' +
        '<p class="muted small">When this works, a new member registered on any phone is stored centrally and the Active-members count updates for everyone.</p>' +
        '<div class="pill-row"><button class="btn btn-blue btn-sm" id="be-diag">Check shared sign-up</button></div>' +
        '<p class="muted small" id="be-diag-out" style="margin-top:12px">Not checked yet.</p>' +
      '</div>' +
    '</div>';
  }

  function wireBackend() {
    var B = window.AvyaktBackend, note = $("#be-note");
    function say(msg, ok) { note.className = "notice " + (ok ? "ok" : "err") + " show"; note.textContent = msg; }
    $("#be-save").addEventListener("click", async function () {
      B.setConfig({ owner: $("#be-owner").value, repo: $("#be-repo").value, branch: $("#be-branch").value });
      var t = $("#be-token").value.trim(); if (t) B.setToken(t);
      try {
        var info = await B.verify();
        say("Connected to " + info.fullName + (info.canPush ? " — you can publish." : " — but this token cannot write. Give it Contents: Read and write."), true);
      } catch (e) { say("Could not reach the repo: " + e.message, false); }
    });
    $("#be-forget").addEventListener("click", function () { B.setToken(""); renderBody(); });
    var diag = $("#be-diag");
    if (diag) diag.addEventListener("click", async function () {
      var out = $("#be-diag-out");
      out.textContent = "Checking\u2026";
      var d = await B.diagnose();
      if (d.ok) {
        out.innerHTML = "<strong>Working.</strong> Storage: " + esc(d.backend) +
          " \u00b7 " + (d.activeMembers || 0) + " member(s) stored centrally.";
      } else {
        out.innerHTML = "<strong>Not working.</strong> " + esc(d.error || "unknown error") +
          "<br>On Vercel, connect a Blob store (Storage \u2192 Create \u2192 Blob) or set GITHUB_TOKEN, then redeploy.";
      }
    });
    $("#be-pull").addEventListener("click", async function () {
      say("Pulling…", true); await S.sync();
      say("Pulled the latest content from the repo.", true);
    });
    $("#be-push").addEventListener("click", async function () {
      if (!B.canWrite()) { say("Add a GitHub token first.", false); return; }
      say("Publishing…", true);
      try { await S.publish(); say("Published. GitHub Pages will rebuild in about a minute.", true); }
      catch (e) { say("Publish failed: " + e.message, false); }
    });
  }

  /* ---------- gate ---------- */
  function showPanel() {
    $("#adminGate").classList.add("hidden"); $("#adminPanel").classList.remove("hidden");
    renderTabs(); renderBody();
    S.sync().then(function () { renderBody(); }).catch(function () {});
    S.syncStats().then(function () { renderBody(); }).catch(function () {});
  }

  function boot() {
    if (S.isUnlocked()) showPanel();
    $("#adminUnlock").addEventListener("click", async function () {
      var n = $("#adminGateNote");
      if (await S.unlock($("#adminPass").value)) showPanel();
      else { n.className = "notice err show"; n.textContent = "Incorrect passcode. Try again."; }
    });
    $("#adminPass").addEventListener("keydown", function (e) { if (e.key === "Enter") $("#adminUnlock").click(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
