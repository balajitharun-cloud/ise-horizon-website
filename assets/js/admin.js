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
        { k: "emoji", l: "Emoji / thumbnail", t: "text", ph: "🚀" },
        { k: "wide", l: "Wide tile", t: "check" }
      ],
      title: function (it) { return it.caption; },
      sub: function (it) { return it.emoji || ""; }
    },
    members: {
      label: "Members", icon: "👥", addLabel: "Add member",
      fields: [
        { k: "name", l: "Name", t: "text", req: true },
        { k: "usn", l: "USN", t: "text" },
        { k: "year", l: "Year", t: "select", o: ["", "1st Year", "2nd Year", "3rd Year", "4th Year"] },
        { k: "branch", l: "Branch", t: "text" },
        { k: "email", l: "Email", t: "text" },
        { k: "phone", l: "Phone", t: "text" },
        { k: "role", l: "Role", t: "select", o: ["Active member", "Event host"] },
        { k: "interests", l: "Interests (comma separated)", t: "list" }
      ],
      title: function (it) { return it.name + (it.usn ? " · " + it.usn : ""); },
      sub: function (it) { return (it.role || "") + (it.year ? " · " + it.year : ""); }
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

  var TABS = ["events", "news", "projects", "gallery", "members", "history", "achievements", "hackathon", "stats", "data"];
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
    return '<div class="pill-row" style="justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding:10px 0;gap:10px">' +
      "<span style=\"min-width:0\"><strong>" + esc(sch.title(it)) + "</strong><br><span class=\"small muted\">" + esc(sch.sub(it)) + "</span></span>" +
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
    var d = S.get();
    var members = (d.settings && d.settings.activeMembers) || 0;
    var hosted = (d.settings && d.settings.eventsHosted) || 0;
    return '<div class="form-card" style="max-width:620px;margin:0 auto">' +
      '<h2 style="margin-top:0">Home-page stats</h2>' +
      '<p class="muted small">These two numbers are shown on the home page. You can change them any time.</p>' +
      '<form id="sf">' +
        '<div class="field"><label for="f-activeMembers">Active members</label>' +
        '<input id="f-activeMembers" name="activeMembers" type="number" min="0" value="' + esc(members) + '">' +
        '<div class="hint">Also grows automatically by 1 each time a new member joins through the Join Us form.</div></div>' +
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
        '<p class="muted small">Content is stored in this browser. Export a JSON backup to move it to another device, or import one to restore.</p>' +
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
      var l = k === "hackathon" ? "🏆 Hackathon" : k === "stats" ? "📊 Stats" : k === "data" ? "💾 Data" : SCHEMAS[k].icon + " " + SCHEMAS[k].label;
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
    if (current === "data") { body.innerHTML = dataSection(); wireData(); return; }
    body.innerHTML = listSection(current);
    wireList(current);
  }

  function wireList(key) {
    var sch = SCHEMAS[key], form = $("#af");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = $("#af-note");
      var data = readForm(form, sch);
      if (editingId) { S.update(key, editingId, data); note.className = "notice ok show"; note.textContent = "Updated."; }
      else { S.add(key, data); note.className = "notice ok show"; note.textContent = "Added."; }
      editingId = null; renderBody();
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
      b.addEventListener("click", function () { if (confirm("Delete this item?")) { S.remove(key, this.getAttribute("data-del")); renderBody(); } });
    });
    $$("[data-archive]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = this.getAttribute("data-archive"), it = S.find("events", id); if (!it) return;
        S.add("pastEvents", it); S.remove("events", id);
        // an event was completed -> bump the Events-hosted counter
        var st = S.get().settings; st.eventsHosted = (parseInt(st.eventsHosted, 10) || 0) + 1; S.save();
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
    });
  }

  function wireData() {
    $("#d-export").addEventListener("click", function () {
      var blob = new Blob([S.export()], { type: "application/json" });
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "ise-horizon-content.json";
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

  /* ---------- gate ---------- */
  function showPanel() { $("#adminGate").classList.add("hidden"); $("#adminPanel").classList.remove("hidden"); renderTabs(); renderBody(); }

  function boot() {
    if (S.isUnlocked()) showPanel();
    $("#adminUnlock").addEventListener("click", function () {
      var n = $("#adminGateNote");
      if (S.unlock($("#adminPass").value)) showPanel();
      else { n.className = "notice err show"; n.textContent = "Incorrect passcode. Try again."; }
    });
    $("#adminPass").addEventListener("keydown", function (e) { if (e.key === "Enter") $("#adminUnlock").click(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
