/* =====================================================================
   AVYAKT shared site engine
   Header/footer, theme, search, countdown and page renderers.
   Dynamic content (events, news, projects, gallery) comes from
   HorizonStore so elite members can manage it from the member panel.
   ===================================================================== */
(function () {
  "use strict";
  var H = window.HORIZON || {};
  var club = H.club || {};
  var S = window.HorizonStore;

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function fmtDate(iso, o) { var d = new Date(iso); return isNaN(d) ? (iso || "") : d.toLocaleDateString("en-IN", o || { day: "numeric", month: "short", year: "numeric" }); }
  function initials(n) { return String(n).split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join(""); }

  function emptyState(title, text, cta) {
    return '<div class="card" style="grid-column:1/-1"><div class="card-body" style="padding:34px 20px;max-width:62ch">' +
      '<h3>' + esc(title) + '</h3>' +
      '<p class="muted" style="max-width:48ch;margin:0 auto 14px">' + esc(text) + '</p>' +
      (cta ? cta : "") + "</div></div>";
  }

  /* ---------- pages / nav ---------- */
  var PAGES = [
    { file: "index.html", label: "Home" },
    { file: "about.html", label: "About" },
    { file: "events.html", label: "Events" },
    { file: "projects.html", label: "Projects" },
    { file: "team.html", label: "Team" },
    { file: "faculty.html", label: "Faculty" },
    { file: "media.html", label: "Media" },
    { file: "gallery.html", label: "Gallery" },
    { file: "join.html", label: "Join Us" },
    { file: "contact.html", label: "Contact" },
    { file: "certificate.html", label: "Certificates" },
    { file: "admin.html", label: "Member" }
  ];
  function currentFile() { var p = location.pathname.split("/").pop(); return p === "" ? "index.html" : p; }

  /* ---------- theme ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("horizon-theme", t); } catch (e) {}
    var b = $("#themeBtn");
    if (b) { b.innerHTML = t === "dark" ? '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="8" cy="8" r="3.2"/><path d="M8 1v1.8M8 13.2V15M1 8h1.8M13.2 8H15M3.1 3.1l1.3 1.3M11.6 11.6l1.3 1.3M12.9 3.1l-1.3 1.3M4.4 11.6l-1.3 1.3"/></svg>' : '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M13 10.2A5.6 5.6 0 0 1 5.8 3a5.7 5.7 0 1 0 7.2 7.2Z"/></svg>'; }
  }
  function initTheme() {
    var saved = null; try { saved = localStorage.getItem("horizon-theme"); } catch (e) {}
    var pd = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (pd ? "dark" : "light"));
  }

  /* ---------- header / footer ---------- */
  function buildHeader() {
    var mount = $("#siteHeader"); if (!mount) return;
    var cur = currentFile();
    var links = PAGES.map(function (p) {
      return '<li><a href="' + p.file + '"' + (p.file === cur ? ' aria-current="page"' : "") + ">" + p.label + "</a></li>";
    }).join("");
    mount.innerHTML =
      '<div class="container header-inner">' +
        '<button class="nav-toggle" id="navToggle" aria-label="Menu" aria-expanded="false"><span></span></button>' +
        '<button class="header-search" id="searchBtn" aria-label="Search the site"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="7" cy="7" r="4.4"/><path d="M10.4 10.4 14 14"/></svg> <span>Search</span></button>' +
        '<div class="header-actions">' +
          '<button class="theme-btn" id="themeBtn" aria-label="Toggle theme" title="Toggle theme"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M13 10.2A5.6 5.6 0 0 1 5.8 3a5.7 5.7 0 1 0 7.2 7.2Z"/></svg></button>' +
          '<a class="btn btn-primary btn-sm header-cta" href="join.html">Join Us</a>' +
        "</div>" +
        '<nav class="nav" id="mainNav" aria-label="Main"><ul>' + links + "</ul></nav>" +
      "</div>";
    $("#navToggle").addEventListener("click", function () {
      var open = $("#mainNav").classList.toggle("open");
      this.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $("#themeBtn").addEventListener("click", function () {
      applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
    $("#searchBtn").addEventListener("click", openSearch);
  }

  function buildFooter() {
    var mount = $("#siteFooter"); if (!mount) return;
    var s = club.socials || {};
    var social = [["Instagram", "IG", s.instagram], ["LinkedIn", "IN", s.linkedin], ["GitHub", "GH", s.github],
      ["WhatsApp", "WA", s.whatsapp], ["Discord", "DC", s.discord], ["YouTube", "YT", s.youtube]]
      .filter(function (x) { return x[2]; })
      .map(function (x) { return '<a href="' + x[2] + '" target="_blank" rel="noopener" aria-label="' + x[0] + '" title="' + x[0] + '">' + x[1] + "</a>"; }).join("");
    var nav = PAGES.map(function (p) { return '<li><a href="' + p.file + '">' + p.label + "</a></li>"; }).join("");
    mount.innerHTML =
      '<div class="container">' +
        '<div class="footer-grid">' +
          "<div>" +
            '<div class="footer-brand">' +
              '<img src="assets/images/avyakt-emblem.png" alt="AVYAKT">' +
              '<div><strong>AVYAKT</strong><br><span class="small">Kalpataru Institute of Technology, Tiptur</span></div>' +
            "</div>" +
            '<p class="small">' + esc(club.tagline) + "</p>" +
            '<div class="socials">' + social + "</div>" +
          "</div>" +
          '<div class="footer-col"><h4>Explore</h4><ul>' + nav + "</ul></div>" +
          '<div class="footer-col"><h4>Find us</h4><ul>' +
            "<li>" + esc(club.address) + "</li>" +
            '<li><a href="contact.html">Contact page</a></li>' +
          "</ul></div>" +
        "</div>" +
        '<div class="footer-bottom">' +
          "<span>© " + new Date().getFullYear() + " AVYAKT · Dept. of Information Science & Engineering</span>" +
          "<span>Affiliated to VTU Belagavi</span>" +
        "</div>" +
      "</div>";
  }

  /* ---------- search ---------- */
  function buildIndex() {
    var d = S ? S.get() : {};
    var idx = [];
    (d.events || []).forEach(function (e) { idx.push({ kind: "Event", title: e.title, url: "events.html#ev-" + e.id, extra: fmtDate(e.date) + " · " + (e.venue || "") }); });
    (d.projects || []).forEach(function (p) { idx.push({ kind: "Project", title: p.title, url: "projects.html#pr-" + (p.id || slug(p.title)), extra: (p.stack || []).join(", ") }); });
    (d.news || []).forEach(function (a) { idx.push({ kind: "News", title: a.title, url: "about.html#news", extra: fmtDate(a.date) }); });
    (d.gallery || []).forEach(function (g) { idx.push({ kind: "Gallery", title: g.caption, url: "gallery.html", extra: g.emoji || "" }); });
    (d.faculty || []).forEach(function (f) { idx.push({ kind: "Faculty", title: f.name, url: "faculty.html", extra: f.designation || "" }); });
    (d.videos || []).forEach(function (v) { idx.push({ kind: "Video", title: v.title, url: "media.html", extra: v.date || "" }); });
    (H.team || []).forEach(function (t) { idx.push({ kind: "Team", title: t.name, url: "team.html", extra: t.role }); });
    (H.achievements || []).forEach(function (a) { idx.push({ kind: "Achievement", title: a.title, url: "about.html#achievements", extra: a.year }); });
    PAGES.forEach(function (p) { idx.push({ kind: "Page", title: p.label, url: p.file, extra: "Go to page" }); });
    return idx;
  }
  function openSearch() {
    var ov = $("#searchOverlay");
    if (!ov) {
      ov = document.createElement("div"); ov.className = "search-overlay"; ov.id = "searchOverlay";
      ov.innerHTML = '<div class="search-panel"><input type="search" id="searchInput" placeholder="Search events, projects, news…" aria-label="Search"><div class="search-results" id="searchResults"></div></div>';
      document.body.appendChild(ov);
      ov.addEventListener("click", function (e) { if (e.target === ov) closeSearch(); });
      $("#searchInput").addEventListener("input", runSearch);
    }
    ov.classList.add("open");
    setTimeout(function () { $("#searchInput").focus(); }, 30);
  }
  function closeSearch() { var o = $("#searchOverlay"); if (o) o.classList.remove("open"); }
  function runSearch() {
    var q = $("#searchInput").value.trim().toLowerCase();
    var box = $("#searchResults");
    if (!q) { box.innerHTML = '<div class="r-empty">Type to search across the site.</div>'; return; }
    var hits = buildIndex().filter(function (r) { return (r.title + " " + (r.extra || "") + " " + r.kind).toLowerCase().indexOf(q) > -1; }).slice(0, 25);
    box.innerHTML = hits.length
      ? hits.map(function (r) { return '<a href="' + r.url + '"><span class="r-kind">' + esc(r.kind) + "</span><br><strong>" + esc(r.title) + "</strong>" + (r.extra ? '<br><span class="small muted">' + esc(r.extra) + "</span>" : "") + "</a>"; }).join("")
      : '<div class="r-empty">No results for “' + esc(q) + '”.</div>';
  }

  /* ---------- countdown ---------- */
  function nextEvent() {
    var evs = ((S && S.get().events) || []).filter(function (e) { return e.date; })
      .sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    var now = new Date();
    for (var i = 0; i < evs.length; i++) if (new Date(evs[i].date) >= now) return evs[i];
    return evs[0] || null;
  }
  function startCountdown(el, iso) {
    if (!el) return;
    var t = new Date(iso).getTime();
    function u(n, l) { return '<div class="unit"><div class="num">' + (n < 10 ? "0" + n : n) + '</div><div class="lbl">' + l + "</div></div>"; }
    function tick() {
      var diff = Math.max(0, t - Date.now());
      el.innerHTML = u(Math.floor(diff / 86400000), "Days") + u(Math.floor(diff % 86400000 / 3600000), "Hrs") +
        u(Math.floor(diff % 3600000 / 60000), "Min") + u(Math.floor(diff % 60000 / 1000), "Sec");
    }
    tick(); setInterval(tick, 1000);
  }

  /* ---------- cards ---------- */
  function eventCard(e) {
    return '<article class="card" id="ev-' + esc(e.id) + '">' +
      '<div class="card-media"><span class="ph">' + esc(fmtDate(e.date, { day: "numeric", month: "short" })) + "</span></div>" +
      '<div class="card-body">' +
        '<div class="pill-row mb-2"><span class="chip chip--orange">' + esc(e.category || "Event") + '</span><span class="chip">' + esc(e.mode || "On campus") + "</span></div>" +
        "<h3>" + esc(e.title) + "</h3>" +
        '<p class="meta">' + esc(fmtDate(e.date, { weekday: "short", day: "numeric", month: "long", year: "numeric" })) + (e.time ? " · " + esc(e.time) : "") + "<br>" + esc(e.venue || "Venue TBA") + "</p>" +
        (e.description ? "<p>" + esc(e.description) + "</p>" : "") +
        '<div class="card-actions">' +
          (e.registration ? '<a class="btn btn-primary btn-sm" href="' + esc(e.registration) + '" target="_blank" rel="noopener">Register</a>' : "") +
          '<a class="btn btn-ghost btn-sm" href="contact.html">Ask a question</a>' +
        "</div>" +
      "</div></article>";
  }
  function projectCard(p) {
    var tags = (p.stack || []).map(function (t) { return '<span class="chip chip--blue">' + esc(t) + "</span>"; }).join("");
    return '<article class="card" id="pr-' + esc(p.id || slug(p.title)) + '">' +
      '<div class="card-body">' +
        (p.status ? '<div class="pill-row mb-2"><span class="chip ' + (p.status === "Ongoing" ? "chip--green" : "") + '">' + esc(p.status) + "</span></div>" : "") +
        "<h3>" + esc(p.title) + "</h3>" +
        (p.desc ? "<p>" + esc(p.desc) + "</p>" : "") +
        (tags ? '<div class="tags mb-2">' + tags + "</div>" : "") +
        (p.team && p.team.length ? '<p class="meta small">' + esc(p.team.join(" · ")) + "</p>" : "") +
        '<div class="card-actions">' +
          (p.github ? '<a class="btn btn-ghost btn-sm" href="' + esc(p.github) + '" target="_blank" rel="noopener">GitHub</a>' : "") +
          (p.demo ? '<a class="btn btn-blue btn-sm" href="' + esc(p.demo) + '">Live demo</a>' : "") +
        "</div>" +
      "</div></article>";
  }
  function youTubeId(u) {
    var m = String(u || "").match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : "";
  }
  function isAudioUrl(u) {
    return /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|weba|wma)(\?|$)/i.test(String(u || ""));
  }
  function videoCard(v) {
    var frame = "";
    if (v.url) {
      frame = isAudioUrl(v.url)
        ? '<audio controls preload="metadata" src="' + esc(v.url) + '"></audio>'
        : '<video controls preload="metadata" playsinline src="' + esc(v.url) + '"' +
          (v.poster ? ' poster="' + esc(v.poster) + '"' : "") + "></video>";
    } else if (v.link) {
      var yt = youTubeId(v.link);
      frame = yt
        ? '<iframe src="https://www.youtube.com/embed/' + esc(yt) + '" title="' + esc(v.title) +
          '" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
        : '<a class="btn btn-ghost btn-sm" href="' + esc(v.link) + '" target="_blank" rel="noopener">Watch the video</a>';
    }
    return '<article class="card video-card"><div class="card-body">' +
      '<div class="video-frame' + (v.url && isAudioUrl(v.url) ? " is-audio" : "") + '">' +
        (frame || '<span class="video-none">No media attached</span>') + "</div>" +
      '<h3 style="margin:.7em 0 .1em">' + esc(v.title) + "</h3>" +
      (v.date ? '<div class="small muted">' + esc(fmtDate(v.date)) + "</div>" : "") +
      (v.desc ? '<p class="bio">' + esc(v.desc) + "</p>" : "") +
      "</div></article>";
  }
  function facultyCard(f) {
    return '<article class="person card"><div class="card-body">' +
      '<div class="avatar">' + (f.photo ? '<img src="' + esc(f.photo) + '" alt="' + esc(f.name) + '">' : esc(initials(f.name))) + "</div>" +
      '<h3 style="margin-bottom:.1em">' + esc(f.name) + "</h3>" +
      '<div class="role">' + esc(f.designation || "Faculty") + "</div>" +
      (f.dept ? '<div class="small muted">' + esc(f.dept) + "</div>" : "") +
      (f.note ? '<p class="bio">' + esc(f.note) + "</p>" : "") +
      "</div></article>";
  }
  function personCard(t) {
    var soc = t.socials ? Object.keys(t.socials).map(function (k) {
      var icon = { linkedin: "in", github: "gh", instagram: "ig", twitter: "x" }[k] || "web";
      return '<a href="' + esc(t.socials[k]) + '" aria-label="' + k + '">' + icon + "</a>";
    }).join("") : "";
    return '<article class="person card"><div class="card-body">' +
      '<div class="avatar">' + (t.photo ? '<img src="' + esc(t.photo) + '" alt="' + esc(t.name) + '">' : esc(t.initials || initials(t.name))) + "</div>" +
      '<h3 style="margin-bottom:.1em">' + esc(t.name) + "</h3>" +
      '<div class="role">' + esc(t.role) + "</div>" +
      '<div class="small muted">' + esc(t.dept || "") + "</div>" +
      (t.bio ? '<p class="bio">' + esc(t.bio) + "</p>" : "") +
      (soc ? '<div class="socials">' + soc + "</div>" : "") +
      "</div></article>";
  }

  /* ---------- calendar ---------- */
  function buildCalendar(mount, events) {
    var state = { y: new Date().getFullYear(), m: new Date().getMonth() };
    function render() {
      var y = state.y, m = state.m;
      var first = new Date(y, m, 1), startDow = first.getDay(), days = new Date(y, m + 1, 0).getDate(), prev = new Date(y, m, 0).getDate();
      var byDay = {};
      events.forEach(function (e) { var d = new Date(e.date); if (d.getFullYear() === y && d.getMonth() === m) (byDay[d.getDate()] = byDay[d.getDate()] || []).push(e); });
      var today = new Date(), cells = "";
      var dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(function (d) { return '<div class="dow">' + d + "</div>"; }).join("");
      for (var i = 0; i < startDow; i++) cells += '<div class="day muted"><span class="dn">' + (prev - startDow + i + 1) + "</span></div>";
      for (var day = 1; day <= days; day++) {
        var isToday = today.getFullYear() === y && today.getMonth() === m && today.getDate() === day;
        var evs = byDay[day];
        cells += '<div class="day' + (isToday ? " today" : "") + (evs ? " has-event" : "") + '"' + (evs ? ' data-ev="' + esc(evs[0].id) + '" title="' + esc(evs.map(function (x) { return x.title; }).join(", ")) + '"' : "") + '><span class="dn">' + day + "</span>" + (evs ? '<span class="dot"></span>' : "") + "</div>";
      }
      mount.innerHTML = '<div class="cal-head"><div class="m">' + first.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) + "</div>" +
        '<div class="cal-nav"><button class="btn btn-ghost btn-sm" data-cal="prev" aria-label="Previous month">‹</button>' +
        '<button class="btn btn-ghost btn-sm" data-cal="today">Today</button>' +
        '<button class="btn btn-ghost btn-sm" data-cal="next" aria-label="Next month">›</button></div></div>' +
        '<div class="cal-grid">' + dows + cells + "</div>";
      $$("[data-cal]", mount).forEach(function (b) {
        b.addEventListener("click", function () {
          var a = this.getAttribute("data-cal");
          if (a === "prev") { state.m--; if (state.m < 0) { state.m = 11; state.y--; } }
          else if (a === "next") { state.m++; if (state.m > 11) { state.m = 0; state.y++; } }
          else { state.y = today.getFullYear(); state.m = today.getMonth(); }
          render();
        });
      });
      $$(".day.has-event", mount).forEach(function (c) {
        c.addEventListener("click", function () {
          var t = document.getElementById("ev-" + this.getAttribute("data-ev"));
          if (t) { t.scrollIntoView({ behavior: "smooth", block: "center" }); }
        });
      });
    }
    render();
  }

  /* =====================================================================
     PAGE RENDERERS
     ===================================================================== */
  var RENDER = {
    home: function () {
      var d = S.get();
      // hero event card
      var heroCard = $("#heroEventCard");
      var nx = nextEvent();
      var hack = d.hackathon;
      if (heroCard) {
        if (nx) {
          heroCard.innerHTML = '<span class="label">Next up</span><h3>' + esc(nx.title) + '</h3>' +
            (nx.description ? "<p>" + esc(nx.description) + "</p>" : "") +
            '<div class="countdown" id="heroCountdown"></div>' +
            '<div class="hero-cta" style="margin-top:14px">' +
            (nx.registration ? '<a class="btn btn-primary btn-sm" href="' + esc(nx.registration) + '" target="_blank" rel="noopener">Register</a>' : "") +
            '<a class="btn btn-ghost btn-sm" style="color:#fff;border-color:rgba(255,255,255,.4)" href="events.html">See all events</a></div>';
          startCountdown($("#heroCountdown"), nx.date);
        } else {
          heroCard.innerHTML = '<span class="label">Welcome</span><h3>AVYAKT</h3>' +
            '<p>Events, competitions, cultural and sports meets, announced here by the club. No events are scheduled right now.</p>' +
            '<div class="hero-cta" style="margin-top:14px"><a class="btn btn-light btn-sm" href="join.html">Join the club</a>' +
            '<a class="btn btn-ghost btn-sm" style="color:#fff;border-color:rgba(255,255,255,.4)" href="events.html">Events</a></div>';
        }
      }
      var stats = $("#homeStats");
      if (stats) {
        var st = S.stats();
        var members = st.activeMembers, hosted = st.eventsHosted;
        stats.innerHTML =
          '<div class="stat"><div class="num">' + esc(members) + '</div><div class="lbl">Active members</div></div>' +
          '<div class="stat"><div class="num">' + esc(hosted) + '</div><div class="lbl">Events hosted</div></div>';
      }

      var up = $("#homeUpcoming");
      if (up) up.innerHTML = (d.events || []).length
        ? (d.events || []).slice(0, 3).map(eventCard).join("")
        : emptyState("No events scheduled yet", "Upcoming events are published here by the club committee. Check back soon.", '<a class="btn btn-primary btn-sm" href="join.html">Join to get updates</a>');

      // Horizon Hackathon section
      var hk = $("#homeHackathon");
      if (hk && hack && hack.active) {
        hk.innerHTML =
          '<div class="card" style="background:linear-gradient(140deg,#0b2a5b,#123a7a);border:none;color:#fff">' +
          '<div class="card-body" style="padding:30px 24px">' +
            '<div class="pill-row mb-2"><span class="chip chip--orange">Flagship event</span></div>' +
            '<h2 style="color:#fff;margin-bottom:.3em">' + esc(hack.title) + "</h2>" +
            '<p style="color:rgba(255,255,255,.88);max-width:60ch">' + esc(hack.description || "") + "</p>" +
            (hack.date ? '<p style="color:rgba(255,255,255,.85)"><strong>Date:</strong> ' + esc(fmtDate(hack.date, { day: "numeric", month: "long", year: "numeric" })) + (hack.venue ? " · " + esc(hack.venue) : "") + "</p>" : "") +
            '<div class="hero-cta" style="margin-top:6px">' +
              (hack.link ? '<a class="btn btn-primary" href="' + esc(hack.link) + '" target="_blank" rel="noopener">Register / Learn more</a>' : "") +
              '<a class="btn btn-ghost" style="color:#fff;border-color:rgba(255,255,255,.4)" href="events.html">All events</a>' +
            "</div>" +
          "</div></div>";
      } else if (hk) { hk.innerHTML = ""; }

      var news = $("#homeNews");
      if (news) news.innerHTML = (d.news || []).length
        ? (d.news || []).slice(0, 3).map(function (a) {
            return '<article class="card"><div class="card-body"><span class="chip chip--green mb-2">' + esc(a.tag || "Update") + "</span><h3>" + esc(a.title) + "</h3>" +
              '<p class="small muted">' + esc(fmtDate(a.date)) + "</p><p>" + esc(a.excerpt || "") + "</p>" +
              '<div class="card-actions"><a class="btn btn-ghost btn-sm" href="about.html#news">Read more</a></div></div></article>';
          }).join("")
        : emptyState("No announcements yet", "Club updates are posted here by the committee.");
    },

    about: function () {
      var d = S.get();
      var tl = $("#aboutTimeline");
      if (tl) {
        var hist = (d.history || []).slice().sort(function (a, b) { return String(a.year || "") < String(b.year || "") ? -1 : 1; });
        tl.innerHTML = hist.length
          ? hist.map(function (h) { return '<div class="item"><div class="year">' + esc(h.year) + '</div><div>' + esc(h.text) + "</div></div>"; }).join("")
          : emptyState("No history yet", "The club history is added here by the committee.");
      }
      var ach = $("#aboutAchievements");
      if (ach) ach.innerHTML = (d.achievements || []).length
        ? (d.achievements || []).map(function (a) {
            return '<article class="card"><div class="card-body"><span class="chip chip--orange mb-2">' + esc(a.year || "") + "</span><h3>" + esc(a.title) + '</h3><p class="muted small">' + esc(a.detail || "") + "</p></div></article>";
          }).join("")
        : emptyState("No achievements yet", "Event winners and awards are added here by the committee.");
      var news = $("#aboutNews");
      if (news) news.innerHTML = (d.news || []).length
        ? (d.news || []).map(function (a) {
            return '<article class="card"><div class="card-body"><span class="chip chip--green mb-2">' + esc(a.tag || "Update") + "</span><h3>" + esc(a.title) + "</h3>" +
              '<p class="small muted">' + esc(fmtDate(a.date)) + "</p><p>" + esc(a.excerpt || "") + "</p>" + (a.body ? "<p>" + esc(a.body) + "</p>" : "") + "</div></article>";
          }).join("")
        : emptyState("No announcements yet", "Only club members can publish updates here.");
      var team = $("#aboutTeam");
      if (team) team.innerHTML = (H.team || []).slice(0, 4).map(personCard).join("");
    },

    events: function () {
      var d = S.get();
      var calMount = $("#eventCalendar");
      if (calMount) buildCalendar(calMount, (d.events || []).map(function (e) { return { id: e.id, title: e.title, date: e.date }; }));
      var up = $("#eventList");
      if (up) up.innerHTML = (d.events || []).length
        ? (d.events || []).map(eventCard).join("")
        : emptyState("No events scheduled yet", "When the club committee adds an upcoming event, it appears here with its registration link.", '<a class="btn btn-primary btn-sm" href="join.html">Join to get updates</a>');
      var past = $("#pastList");
      if (past) past.innerHTML = (d.pastEvents || []).length
        ? (d.pastEvents || []).map(function (e) {
            return '<article class="card"><div class="card-body">' +
              '<div class="pill-row mb-2"><span class="chip">' + esc(e.category || "Event") + '</span><span class="chip">' + esc(fmtDate(e.date)) + "</span></div>" +
              "<h3>" + (e.poster ? esc(e.poster) + " " : "") + esc(e.title) + "</h3>" +
              (e.venue ? '<p class="muted small">' + esc(e.venue) + "</p>" : "") +
              (e.description ? "<p>" + esc(e.description) + "</p>" : "") +
              (e.results ? '<p class="small"><strong>Results:</strong> ' + esc(e.results) + "</p>" : "") +
            "</div></article>";
          }).join("")
        : emptyState("No past events yet", "Completed events are archived here by the committee.");
    },

    projects: function () {
      var d = S.get();
      var mount = $("#projectGrid");
      if (!mount) return;
      function render(f) {
        var list = (d.projects || []).filter(function (p) { return !f || f === "All" || p.status === f; });
        mount.innerHTML = list.length ? list.map(projectCard).join("")
          : emptyState("No projects yet", "When a student project is added by the committee, with its GitHub link, it appears here.");
      }
      var tabs = $("#projectTabs");
      if (tabs) $$(".tab", tabs).forEach(function (t) {
        t.addEventListener("click", function () { $$(".tab", tabs).forEach(function (x) { x.classList.remove("active"); }); this.classList.add("active"); render(this.getAttribute("data-filter")); });
      });
      render("All");
    },

    gallery: function () {
      var d = S.get();
      var mount = $("#galleryGrid");
      if (!mount) return;
      mount.innerHTML = (d.gallery || []).length
        ? (d.gallery || []).map(function (g) {
            return '<div class="gitem' + (g.wide ? " wide" : "") + '" role="button" tabindex="0" aria-label="' + esc(g.caption) + '">' +
              (g.img
                ? '<img src="' + esc(g.img) + '" alt="' + esc(g.caption) + '" loading="lazy">'
                : '<div class="avatar-ph" style="width:100%;height:100%;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase">Photo</div>') +
              '<span class="cap">' + esc(g.caption) + "</span></div>";
          }).join("")
        : emptyState("Gallery is empty", "Photos from events and activities are added here by the committee after each event.");
    },

    team: function () { var m = $("#teamGrid"); if (m) m.innerHTML = (H.team || []).map(personCard).join(""); },
    media: function () {
      var m = $("#mediaGrid");
      if (!m) return;
      var v = S.get().videos || [];
      m.innerHTML = v.length ? v.map(videoCard).join("")
        : emptyState("No media yet", "Videos and audio are added here by the club committee.");
    },
    faculty: function () {
      var m = $("#facultyGrid");
      if (!m) return;
      var f = S.get().faculty || [];
      m.innerHTML = f.length ? f.map(facultyCard).join("")
        : emptyState("Faculty list coming soon", "The department faculty are added here by the club committee.");
    },
    contact: function () {},
    join: function () {}
  };

  /* ---------- forms ---------- */
  function wireForms() {
    var jf = $("#joinForm");
    if (jf) jf.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = $("#joinNote");
      var data = Object.fromEntries(new FormData(jf).entries());
      if (!data.name || !data.usn) { note.className = "notice err show"; note.textContent = "Please fill in your name and USN."; return; }
      var interests = $$('input[name="interests"]:checked', jf).map(function (c) { return c.value; });
      var entry = { name: data.name, usn: data.usn, year: data.year || "", branch: data.branch || "", interests: interests, role: "Active member", why: data.why || "", joined: new Date().toISOString().slice(0, 10) };
      // keep a local copy so nothing is lost if the request cannot be sent
      S.add("members", entry);
      note.className = "notice show";
      note.textContent = "Sending\u2026";
      // the shared copy lives in the repo; this endpoint holds the token server-side
      fetch("/api/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) })
        .then(function (r) {
          // read the server's own message so the real reason is shown, not just "HTTP 500"
          return r.json().catch(function () { return {}; }).then(function (b) {
            if (!r.ok) throw new Error(b.error || ("HTTP " + r.status));
            return b;
          });
        })
        .then(function (res) {
          note.className = "notice ok show";
          note.textContent = "Thanks, " + data.name + "! Your request is recorded for the whole club.";
          return S.syncStats();                  // pull the new shared count
        })
        .catch(function (err) {
          note.className = "notice err show";
          note.textContent = "Saved on this device only. The club's shared sign-up is not switched on for this site yet, so other phones won't see it."
            + (err && err.message ? " (" + err.message + ")" : "");
        });
      jf.reset();
    });
    var cf = $("#contactForm");
    if (cf) cf.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = $("#contactNote"), d = Object.fromEntries(new FormData(cf).entries());
      if (!d.name || !d.message) { note.className = "notice err show"; note.textContent = "Please add your name and a message."; return; }
      note.className = "notice ok show"; note.textContent = "Message sent! We'll get back to you soon."; cf.reset();
    });
    var nl = $("#newsletterForm");
    if (nl) nl.addEventListener("submit", function (e) { e.preventDefault(); var n = $("#nlNote"); n.className = "notice ok show"; n.textContent = "Subscribed! Watch your inbox for club updates."; nl.reset(); });
  }

  /* ---------- scroll motion ---------- */
  /* Reveal-on-scroll, a reading-progress bar, a header that tightens, hero
     parallax and counting stats. Everything is skipped when the visitor has
     asked for reduced motion, and elements are only hidden once the script has
     actually tagged them - so a failed script never blanks the page. */
  var reduceMotion = false;
  try { reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) {}

  function motionEnabled() {
    return !reduceMotion && !document.body.hasAttribute("data-no-motion");
  }

  var REVEAL_SELECTORS = [
    ".page-hero h1", ".page-hero p", ".breadcrumb",
    ".section-head", ".card", ".person", ".stat", ".gitem", ".video-card",
    ".timeline li", ".empty-state", ".form-card"
  ];
  var revealObserver = null;

  function refreshReveal() {
    if (!motionEnabled() || !("IntersectionObserver" in window)) return;
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-in");
          revealObserver.unobserve(en.target);
        });
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    }
    REVEAL_SELECTORS.forEach(function (sel) {
      $$(sel).forEach(function (el) {
        if (el.classList.contains("reveal")) return;
        if (el.offsetParent === null) return;          // skip anything hidden right now
        if (el.closest(".no-reveal")) return;
        el.classList.add("reveal");
        var parent = el.parentElement;
        if (parent) {
          var sibs = Array.prototype.filter.call(parent.children, function (c) { return c.classList.contains("reveal"); });
          var i = sibs.indexOf(el);
          if (i > 0 && i < 10) el.style.setProperty("--rd", (i * 60) + "ms");
        }
        revealObserver.observe(el);
      });
    });
  }

  function countUp(el, to) {
    if (reduceMotion) { el.textContent = String(to); return; }
    var dur = 900, t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = String(Math.round(to * eased));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var statsAnimated = false;
  function wireStatCount() {
    var stats = $("#homeStats");
    if (!stats || statsAnimated || !motionEnabled() || !("IntersectionObserver" in window)) return;
    var nums = $$(".num", stats);
    if (!nums.length) return;
    var targets = nums.map(function (el) { return parseInt(String(el.textContent).replace(/[^0-9]/g, ""), 10) || 0; });
    if (targets.every(function (t) { return t === 0; })) return;   // wait for the shared numbers to arrive
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting || statsAnimated) return;
        statsAnimated = true;
        io.disconnect();
        nums.forEach(function (el, i) { countUp(el, targets[i]); });
      });
    }, { threshold: 0.35 });
    io.observe(stats);
  }

  var paintChrome = null;
  function initScrollChrome() {
    var header = $("#siteHeader");
    var bar = null;
    if (motionEnabled()) {
      bar = document.createElement("div");
      bar.className = "scroll-progress";
      document.body.appendChild(bar);
    }
    var ticking = false;
    function paint() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset || 0;
      if (header) header.classList.toggle("is-scrolled", y > 8);
      if (bar) {
        var doc = document.documentElement;
        var max = doc.scrollHeight - window.innerHeight;
        var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
        bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
      }
    }
    paintChrome = paint;
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    paint();
  }

  /* ---------- boot ---------- */
  function boot() {
    initTheme();
    buildHeader();
    buildFooter();
    var page = document.body.getAttribute("data-page");
    if (page && RENDER[page]) { try { RENDER[page](); } catch (e) { console.error("render error", e); } }
    wireForms();
    initScrollChrome();
    refreshReveal();
    wireStatCount();
    window.addEventListener("horizon:content", function (e) {
      if (!e || !e.detail) return;
      if (page && RENDER[page]) { try { RENDER[page](); } catch (err) { console.error("re-render error", err); } }
      buildFooter();
      refreshReveal();
      wireStatCount();
    });
    // Pull the shared member count from this site's own backend on every load.
    // Relying only on Store.sync() is not enough: that reads api.github.com,
    // which some networks and ad-blockers refuse, and it never runs on a host
    // without a serverless endpoint. This keeps the count live for visitors.
    if (S && S.syncStats) {
      try { S.syncStats(); } catch (e) {}
      // Keep the shared numbers live while the page stays open: refresh once a
      // minute, and again the moment the visitor returns to the tab. Only runs
      // when the tab is actually visible, so a background tab costs nothing.
      setInterval(function () {
        if (document.visibilityState === "visible") { try { S.syncStats(); } catch (e) {} }
      }, 60000);
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") { try { S.syncStats(); } catch (e) {} }
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSearch();
      if (e.key === "/" && !/input|textarea|select/i.test(e.target.tagName || "")) { e.preventDefault(); openSearch(); }
    });
    if ("serviceWorker" in navigator) window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  window.HorizonApp = {
    $: $, $$: $$, esc: esc, fmtDate: fmtDate, slug: slug, emptyState: emptyState,
    // repaint the scroll-driven chrome (progress bar, header state, hero parallax)
    // on demand - handy after a layout change, and used by the layout tests
    refreshScrollChrome: function () { if (paintChrome) paintChrome(); },
    refreshReveal: refreshReveal
  };
})();
