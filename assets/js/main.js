/* =====================================================================
   ISE HORIZON — shared site engine
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

  function emptyState(icon, title, text, cta) {
    return '<div class="card" style="grid-column:1/-1"><div class="card-body center" style="padding:34px 20px">' +
      '<div style="font-size:2.6rem">' + icon + '</div>' +
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
    if (b) { b.textContent = t === "dark" ? "☀️" : "🌙"; }
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
        '<a class="brand" href="index.html">' +
          '<img class="logo-badge" src="assets/images/ise-horizon-badge.png" alt="ISE HORIZON logo">' +
          '<span class="brand-name">ISE <span style="color:var(--brand-orange)">HORIZON</span></span>' +
        "</a>" +
        '<nav class="nav" id="mainNav" aria-label="Main"><ul>' + links + "</ul></nav>" +
        '<div class="header-actions">' +
          '<button class="search-btn" id="searchBtn" aria-label="Search" title="Search">🔍</button>' +
          '<button class="theme-btn" id="themeBtn" aria-label="Toggle theme" title="Toggle theme">🌙</button>' +
          '<a class="btn btn-primary btn-sm header-cta" href="join.html">Join Us</a>' +
          '<button class="nav-toggle" id="navToggle" aria-label="Menu" aria-expanded="false"><span></span></button>' +
        "</div>" +
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
    var social = [["Instagram", "📷", s.instagram], ["LinkedIn", "in", s.linkedin], ["GitHub", "🐙", s.github],
      ["WhatsApp", "💬", s.whatsapp], ["Discord", "🎮", s.discord], ["YouTube", "▶️", s.youtube]]
      .filter(function (x) { return x[2]; })
      .map(function (x) { return '<a href="' + x[2] + '" target="_blank" rel="noopener" aria-label="' + x[0] + '" title="' + x[0] + '">' + x[1] + "</a>"; }).join("");
    var nav = PAGES.map(function (p) { return '<li><a href="' + p.file + '">' + p.label + "</a></li>"; }).join("");
    mount.innerHTML =
      '<div class="container">' +
        '<div class="footer-grid">' +
          "<div>" +
            '<div class="footer-brand">' +
              '<img class="logo-badge" src="assets/images/ise-horizon-badge.png" alt="ISE HORIZON logo">' +
              '<img class="logo-round" src="assets/images/college-logo.jpeg" alt="Kalpataru Institute of Technology logo">' +
              '<div><strong>ISE HORIZON</strong><br><span class="small">Kalpataru Institute of Technology, Tiptur</span></div>' +
            "</div>" +
            '<p class="small">' + esc(club.tagline) + "</p>" +
            '<div class="socials">' + social + "</div>" +
          "</div>" +
          '<div class="footer-col"><h4>Explore</h4><ul>' + nav + "</ul></div>" +
          '<div class="footer-col"><h4>Contact</h4><ul>' +
            "<li>✉️ <a href=\"mailto:" + esc(club.email) + "\">" + esc(club.email) + "</a></li>" +
            "<li>📞 " + esc(club.phone) + "</li>" +
            "<li>📍 " + esc(club.address) + "</li>" +
          "</ul></div>" +
        "</div>" +
        '<div class="footer-bottom">' +
          "<span>© " + new Date().getFullYear() + " ISE HORIZON · Dept. of Information Science & Engineering</span>" +
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
      '<div class="card-media" style="background:linear-gradient(140deg,#0b2a5b,#123a7a)"><span class="ph" style="font-size:3rem">' + esc(e.poster || "📅") + "</span></div>" +
      '<div class="card-body">' +
        '<div class="pill-row mb-2"><span class="chip chip--orange">' + esc(e.category || "Event") + '</span><span class="chip">' + esc(e.mode || "On campus") + "</span></div>" +
        "<h3>" + esc(e.title) + "</h3>" +
        '<p class="meta">📅 ' + esc(fmtDate(e.date, { weekday: "short", day: "numeric", month: "long", year: "numeric" })) + (e.time ? " · " + esc(e.time) : "") + "<br>📍 " + esc(e.venue || "Venue TBA") + "</p>" +
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
        (p.team && p.team.length ? '<p class="meta small">👥 ' + esc(p.team.join(" · ")) + "</p>" : "") +
        '<div class="card-actions">' +
          (p.github ? '<a class="btn btn-ghost btn-sm" href="' + esc(p.github) + '" target="_blank" rel="noopener">GitHub ↗</a>' : "") +
          (p.demo ? '<a class="btn btn-blue btn-sm" href="' + esc(p.demo) + '">Live demo</a>' : "") +
        "</div>" +
      "</div></article>";
  }
  function personCard(t) {
    var soc = t.socials ? Object.keys(t.socials).map(function (k) {
      var icon = { linkedin: "in", github: "🐙", instagram: "📷", twitter: "𝕏" }[k] || "🔗";
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
      mount.innerHTML = '<div class="cal-head"><div class="m">📅 ' + first.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) + "</div>" +
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
          heroCard.innerHTML = '<span class="label">Welcome</span><h3>ISE HORIZON</h3>' +
            '<p>Events, competitions, cultural and sports meets — announced here by the club. No events are scheduled right now.</p>' +
            '<div class="hero-cta" style="margin-top:14px"><a class="btn btn-light btn-sm" href="join.html">Join the club</a>' +
            '<a class="btn btn-ghost btn-sm" style="color:#fff;border-color:rgba(255,255,255,.4)" href="events.html">Events</a></div>';
        }
      }
      var stats = $("#homeStats");
      if (stats) stats.innerHTML = (H.stats || []).map(function (s) { return '<div class="stat"><div class="num">' + esc(s.num) + '</div><div class="lbl">' + esc(s.lbl) + "</div></div>"; }).join("");

      var up = $("#homeUpcoming");
      if (up) up.innerHTML = (d.events || []).length
        ? (d.events || []).slice(0, 3).map(eventCard).join("")
        : emptyState("📅", "No events scheduled yet", "Upcoming events are published here by the club committee. Check back soon.", '<a class="btn btn-primary btn-sm" href="join.html">Join to get updates</a>');

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
        : emptyState("📰", "No announcements yet", "Club updates are posted here by the committee.");
    },

    about: function () {
      var d = S.get();
      var tl = $("#aboutTimeline");
      if (tl) {
        var history = [
          { year: "2021", text: "ISE HORIZON founded with 24 students and a single weekly coding circle." },
          { year: "2023", text: "Crossed 200 members; hosted the first inter-college hackathon." },
          { year: "2025", text: "Launched the Learning Hub and the Projects Showcase; 40+ events hosted." },
          { year: "2026", text: "Named Best Student Club at KIT Tech Day; 600+ active members." }
        ];
        tl.innerHTML = history.map(function (h) { return '<div class="item"><div class="year">' + h.year + '</div><div>' + esc(h.text) + "</div></div>"; }).join("");
      }
      var ach = $("#aboutAchievements");
      if (ach) ach.innerHTML = (H.achievements || []).map(function (a) {
        return '<article class="card"><div class="card-body"><span class="chip chip--orange mb-2">' + esc(a.year) + "</span><h3>" + esc(a.title) + '</h3><p class="muted small">' + esc(a.detail) + "</p></div></article>";
      }).join("");
      var news = $("#aboutNews");
      if (news) news.innerHTML = (d.news || []).length
        ? (d.news || []).map(function (a) {
            return '<article class="card"><div class="card-body"><span class="chip chip--green mb-2">' + esc(a.tag || "Update") + "</span><h3>" + esc(a.title) + "</h3>" +
              '<p class="small muted">' + esc(fmtDate(a.date)) + "</p><p>" + esc(a.excerpt || "") + "</p>" + (a.body ? "<p>" + esc(a.body) + "</p>" : "") + "</div></article>";
          }).join("")
        : emptyState("📰", "No announcements yet", "Only club members can publish updates here.");
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
        : emptyState("📅", "No events scheduled yet", "When the club committee adds an upcoming event, it appears here with its registration link.", '<a class="btn btn-primary btn-sm" href="join.html">Join to get updates</a>');
      var past = $("#pastList");
      if (past) past.innerHTML = (d.pastEvents || []).length
        ? (d.pastEvents || []).map(function (e) {
            return '<article class="card"><div class="card-body">' +
              '<div class="pill-row mb-2"><span class="chip">' + esc(e.category || "Event") + '</span><span class="chip">' + esc(fmtDate(e.date)) + "</span></div>" +
              "<h3>" + (e.poster ? esc(e.poster) + " " : "") + esc(e.title) + "</h3>" +
              (e.venue ? '<p class="muted small">📍 ' + esc(e.venue) + "</p>" : "") +
              (e.description ? "<p>" + esc(e.description) + "</p>" : "") +
              (e.results ? '<p class="small"><strong>Results:</strong> ' + esc(e.results) + "</p>" : "") +
            "</div></article>";
          }).join("")
        : emptyState("🗂️", "No past events yet", "Completed events are archived here by the committee.");
    },

    projects: function () {
      var d = S.get();
      var mount = $("#projectGrid");
      if (!mount) return;
      function render(f) {
        var list = (d.projects || []).filter(function (p) { return !f || f === "All" || p.status === f; });
        mount.innerHTML = list.length ? list.map(projectCard).join("")
          : emptyState("💡", "No projects yet", "When a student project is added by the committee — with its GitHub link — it appears here.");
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
              '<div class="avatar-ph" style="width:100%;height:100%;font-size:2.4rem">' + esc(g.emoji || "🖼️") + "</div>" +
              '<span class="cap">' + esc(g.caption) + "</span></div>";
          }).join("")
        : emptyState("🖼️", "Gallery is empty", "Photos from events and activities are added here by the committee after each event.");
    },

    team: function () { var m = $("#teamGrid"); if (m) m.innerHTML = (H.team || []).map(personCard).join(""); },
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
      if (!data.name || !data.email || !data.usn) { note.className = "notice err show"; note.textContent = "Please fill in your name, email and USN."; return; }
      var interests = $$('input[name="interests"]:checked', jf).map(function (c) { return c.value; });
      S.add("members", { name: data.name, usn: data.usn, year: data.year || "", branch: data.branch || "", email: data.email, phone: data.phone || "", interests: interests, role: "Active member", why: data.why || "", joined: new Date().toISOString().slice(0, 10) });
      note.className = "notice ok show";
      note.textContent = "Thanks, " + data.name + "! Your membership request has been recorded.";
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

  /* ---------- boot ---------- */
  function boot() {
    initTheme();
    buildHeader();
    buildFooter();
    var page = document.body.getAttribute("data-page");
    if (page && RENDER[page]) { try { RENDER[page](); } catch (e) { console.error("render error", e); } }
    wireForms();
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSearch();
      if (e.key === "/" && !/input|textarea|select/i.test(e.target.tagName || "")) { e.preventDefault(); openSearch(); }
    });
    if ("serviceWorker" in navigator) window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  window.HorizonApp = { $: $, $$: $$, esc: esc, fmtDate: fmtDate, slug: slug, emptyState: emptyState };
})();
