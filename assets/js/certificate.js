/* =====================================================================
   AVYAKT — Certificate Portal
   Members upload the participant list (name + USN); participants enter
   their name + USN and the certificate is generated automatically.
   Data is kept in this browser's localStorage (no server needed).
   ===================================================================== */
(function () {
  "use strict";
  var KEY = "horizon-cert-db";
  var SESSION = "horizon-member-unlocked";
  var DEFAULT_PASSCODE = "ise@2007";

  var $ = window.HorizonApp.$;
  var $$ = window.HorizonApp.$$;
  var esc = window.HorizonApp.esc;

  /* ---------- defaults ---------- */
  function seed() {
    return {
      settings: { passcode: DEFAULT_PASSCODE, sample: true },
      event: {
        title: "HORIZON Hackathon 2026",
        date: "2026-11-15",
        subtitle: "of Participation",
        body: "for actively participating in HORIZON Hackathon 2026, a 24-hour build sprint organised by AVYAKT, Department of Information Science & Engineering."
      },
      participants: [
        { name: "Aarav Kulkarni", usn: "1KT23IS001" },
        { name: "Meghana Shetty", usn: "1KT23IS002" },
        { name: "Rahul Naik", usn: "1KT23IS003" },
        { name: "Sneha Patil", usn: "1KT23IS004" },
        { name: "Kiran Kumar", usn: "1KT23IS005" },
        { name: "Divya Rao", usn: "1KT23IS006" },
        { name: "Arjun Hegde", usn: "1KT23IS007" },
        { name: "Priya Deshpande", usn: "1KT23IS008" }
      ],
      signatories: [
        { name: "Ankush S", designation: "President, AVYAKT", photo: "" },
        { name: "Haritha G.S", designation: "Vice President, AVYAKT", photo: "" },
        { name: "The Principal", designation: "Kalpataru Institute of Technology", photo: "" }
      ]
    };
  }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) {}
    if (!raw) { var s = seed(); save(s); return s; }
    try { var db = JSON.parse(raw); return normalize(db); } catch (e) { var s2 = seed(); save(s2); return s2; }
  }
  function normalize(db) {
    db = db || {};
    var d = seed();
    db.settings = Object.assign(d.settings, db.settings || {});
    db.settings.passcode = DEFAULT_PASSCODE;   // always use the passcode from the code
    db.event = Object.assign(d.event, db.event || {});
    db.participants = Array.isArray(db.participants) ? db.participants : [];
    db.signatories = Array.isArray(db.signatories) ? db.signatories : d.signatories;
    return db;
  }
  function save(db) { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }

  var DB = load();

  /* ---------- matching helpers ---------- */
  function normName(s) { return String(s || "").trim().replace(/\s+/g, " ").toLowerCase(); }
  function normUsn(s) { return String(s || "").trim().replace(/\s+/g, "").toUpperCase(); }
  function findParticipant(name, usn) {
    var n = normName(name), u = normUsn(usn);
    return DB.participants.find(function (p) { return normUsn(p.usn) === u && normName(p.name) === n; }) || null;
  }

  /* ---------- mode tabs ---------- */
  function initTabs() {
    var tabs = $("#certModeTabs");
    if (!tabs) return;
    $$(".tab", tabs).forEach(function (t) {
      t.addEventListener("click", function () {
        $$(".tab", tabs).forEach(function (x) { x.classList.remove("active"); });
        this.classList.add("active");
        var m = this.getAttribute("data-mode");
        $("#modeStudent").classList.toggle("hidden", m !== "student");
        $("#modeMember").classList.toggle("hidden", m !== "member");
      });
    });
  }

  /* =====================================================================
     STUDENT SIDE
     ===================================================================== */
  function refreshCount() {
    var chip = $("#certCountChip");
    if (chip) chip.textContent = DB.participants.length + " participant" + (DB.participants.length === 1 ? "" : "s") + " on record for " + (DB.event.title || "the event");
    var sel = $("#s-event");
    if (sel) sel.innerHTML = '<option>' + esc(DB.event.title || "Event") + "</option>";
  }

  function showCert(p) {
    var e = DB.event;
    $("#certUni").textContent = "Visvesvaraya Technological University, Belagavi";
    $("#certCollege").textContent = "Kalpataru Institute of Technology, Tiptur";
    $("#certSubtitle").textContent = e.subtitle || "of Participation";
    $("#certName").textContent = p.name;
    $("#certUsn").textContent = "USN: " + normUsn(p.usn);
    var body = e.body || "has actively participated in the event and is hereby awarded this certificate of participation.";
    $("#certBody").textContent = body;
    var dateStr = e.date ? new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "";
    $("#certId").textContent = "Certificate ID: HZ-" + normUsn(p.usn);
    var evLine = $("#certEventLine");
    if (evLine) evLine.textContent = (e.title || "AVYAKT") + (dateStr ? " · " + dateStr : "");
    renderSignatories();
    $("#certStageWrap").classList.remove("hidden");
    window.__certCurrent = p;
    fitCertificate();
    $("#certStageWrap").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function sigBlock(s, idx) {
    var photo = s && s.photo ? '<img src="' + esc(s.photo) + '" alt="">' : "";
    var name = s && s.name ? esc(s.name) : "";
    var desig = s && s.designation ? esc(s.designation) : "";
    return '<div class="sig-photo">' + photo + '</div><div class="sig-line">' + name + '</div><div class="sig-desig">' + desig + "</div>";
  }
  function renderSignatories() {
    var s = DB.signatories || [];
    $("#sigLeft").innerHTML = s[0] ? sigBlock(s[0]) : "";
    $("#sigCenter").innerHTML = s[1] ? sigBlock(s[1]) : "";
    $("#sigRight").innerHTML = s[2] ? sigBlock(s[2]) : "";
  }

  /* ---------- scale the certificate to fit the screen (mobile) ---------- */
  function fitCertificate() {
    var stage = document.querySelector(".cert-stage");
    var cert = document.getElementById("certificate");
    if (!stage || !cert) return;
    function cs(el, p) { return getComputedStyle(el)[p] || "0"; }
    var avail = stage.clientWidth - (parseFloat(cs(stage, "paddingLeft")) + parseFloat(cs(stage, "paddingRight")));
    if (avail <= 0) return;                  // stage hidden — will fit again when shown
    var scale = Math.min(1, avail / 1000);
    cert.style.zoom = scale;                 // real layout scale, so it stays centred
  }

  function initStudent() {
    var form = $("#certLookupForm");
    if (!form) return;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var note = $("#certNote");
      var name = $("#s-name").value, usn = $("#s-usn").value;
      if (!name.trim() || !usn.trim()) {
        note.className = "notice err show"; note.textContent = "Please enter both your name and USN."; return;
      }
      if (!DB.participants.length) {
        note.className = "notice err show"; note.textContent = "The participant list is empty. Please ask a club member to upload it first."; return;
      }
      var p = findParticipant(name, usn);
      if (!p) {
        // give a helpful hint when the USN exists but the name differs
        var byUsn = DB.participants.find(function (x) { return normUsn(x.usn) === normUsn(usn); });
        note.className = "notice err show";
        note.textContent = byUsn
          ? "We found that USN, but the name doesn't match our records (recorded as “" + byUsn.name + "”). Please enter your name exactly as submitted."
          : "We couldn't find a participant with that name and USN. Please check for typos, or contact the club to be added.";
        $("#certStageWrap").classList.add("hidden");
        return;
      }
      note.className = "notice ok show";
      note.textContent = "Verified! Your certificate has been generated below. 🎉";
      showCert(p);
    });

    $("#certPrint").addEventListener("click", function () { window.print(); });
    $("#certPng").addEventListener("click", function () { exportPng(); });
    $("#certReset").addEventListener("click", function () {
      $("#certStageWrap").classList.add("hidden");
      $("#certNote").className = "notice";
      form.reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- PNG export (canvas) ---------- */
  function loadImg(src) {
    return new Promise(function (res) { if (!src) return res(null); var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { res(null); }; i.src = src; });
  }
  function wrapText(ctx, text, maxW) {
    var words = String(text).split(/\s+/), lines = [], cur = "";
    words.forEach(function (w) {
      var test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
    });
    if (cur) lines.push(cur);
    return lines;
  }
  async function exportPng() {
    var p = window.__certCurrent; if (!p) return;
    var e = DB.event || {};
    var W = 2000, H = 1414, PAD = 56, BORD = 28;
    var c = document.createElement("canvas"); c.width = W; c.height = H;
    var x = c.getContext("2d");
    var cx = W / 2;
    var CY = BORD + PAD;                 // top of the content box

    // make sure the script face is ready before we draw the recipient name
    try { if (document.fonts && document.fonts.load) await document.fonts.load('400 96px "Great Vibes"'); } catch (_) {}

    function ls(v) { try { x.letterSpacing = v; } catch (_) {} }
    function txt(t, y, f, color, spacing) {
      x.font = f; ls(spacing || "0px"); x.fillStyle = color; x.textAlign = "center";
      x.fillText(t, cx, y); ls("0px");
    }
    function diamond(dx, dy, r) {
      x.beginPath(); x.moveTo(dx, dy - r); x.lineTo(dx + r, dy);
      x.lineTo(dx, dy + r); x.lineTo(dx - r, dy); x.closePath(); x.fill();
    }

    // ---------- background ----------
    x.fillStyle = "#fffdf7"; x.fillRect(0, 0, W, H);

    // engraved guilloche rosette
    x.save();
    x.strokeStyle = "#c9a227"; x.lineWidth = 1.4; x.globalAlpha = .07;
    for (var k = 0; k < 48; k++) {
      x.save(); x.translate(cx, H / 2); x.rotate(k * Math.PI / 48);
      x.beginPath(); x.ellipse(0, 0, 880, 376, 0, 0, Math.PI * 2); x.stroke();
      x.restore();
    }
    x.restore();

    // emblem watermark
    var wm = await loadImg((window.HORIZON_IMG && window.HORIZON_IMG.club) || "assets/images/ise-horizon-logo-t.png");
    if (wm) {
      var wh = 960, ww = wh * (wm.width / wm.height);
      x.save();
      try { x.globalAlpha = .05; if ("filter" in x) x.filter = "grayscale(1)"; } catch (_) {}
      x.drawImage(wm, cx - ww / 2, (H - wh) / 2, ww, wh);
      try { x.filter = "none"; } catch (_) {}
      x.restore();
    }

    // ---------- frame ----------
    x.strokeStyle = "#0b2a5b"; x.lineWidth = 28; x.strokeRect(14, 14, W - 28, H - 28);
    x.strokeStyle = "#c9a227"; x.lineWidth = 6;  x.strokeRect(38, 38, W - 76, H - 76);
    x.globalAlpha = .55; x.lineWidth = 2; x.strokeRect(58, 58, W - 116, H - 116); x.globalAlpha = 1;

    // filigree corner ornaments
    function corner(ox, oy, ang) {
      var sc = 232 / 120;
      x.save(); x.translate(ox, oy); x.rotate(ang); x.scale(sc, sc);
      x.strokeStyle = "#c9a227"; x.lineCap = "round"; x.lineWidth = 1.7;
      x.beginPath(); x.arc(116, 116, 112, Math.PI, 1.5 * Math.PI); x.stroke();
      x.beginPath(); x.arc(116, 116, 96, Math.PI, 1.5 * Math.PI); x.stroke();
      x.beginPath(); x.moveTo(116, 20);
      x.bezierCurveTo(88, 20, 68, 30, 62, 50);
      x.bezierCurveTo(58, 64, 68, 74, 80, 70);
      x.stroke();
      x.fillStyle = "#c9a227";
      x.beginPath(); x.moveTo(4, 110); x.lineTo(9, 116); x.lineTo(4, 122); x.lineTo(-1, 116); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(116, 4); x.lineTo(122, 9); x.lineTo(116, 14); x.lineTo(110, 9); x.closePath(); x.fill();
      x.restore();
    }
    var px0 = BORD, py0 = BORD, px1 = W - BORD, py1 = H - BORD;
    corner(px0, py0, 0); corner(px1, py0, Math.PI / 2);
    corner(px1, py1, Math.PI); corner(px0, py1, 1.5 * Math.PI);

    // ---------- header ----------
    var seal = await loadImg((window.HORIZON_IMG && window.HORIZON_IMG.seal) || "assets/images/vtu-seal.jpeg");
    var college = await loadImg((window.HORIZON_IMG && window.HORIZON_IMG.logo) || "assets/images/college-logo.jpeg");
    var club = await loadImg((window.HORIZON_IMG && window.HORIZON_IMG.club) || "assets/images/ise-horizon-logo.png");
    if (seal) x.drawImage(seal, PAD, CY + 19, 112, 112);
    if (college) x.drawImage(college, W - PAD - 112, CY + 19, 112, 112);

    // gold medallion crest
    var crestY = CY + 76;
    x.beginPath(); x.arc(cx, crestY, 88, 0, Math.PI * 2);
    x.lineWidth = 2; x.strokeStyle = "#c9a227"; x.globalAlpha = .5; x.stroke(); x.globalAlpha = 1;
    var cg = x.createRadialGradient(cx, crestY - 30, 8, cx, crestY, 76);
    cg.addColorStop(0, "#fffaea"); cg.addColorStop(.7, "#f0e2b6"); cg.addColorStop(1, "#e2cf94");
    x.beginPath(); x.arc(cx, crestY, 76, 0, Math.PI * 2); x.fillStyle = cg; x.fill();
    x.lineWidth = 4; x.strokeStyle = "#c9a227"; x.stroke();
    x.beginPath(); x.arc(cx, crestY, 62, 0, Math.PI * 2);
    x.lineWidth = 1.5; x.globalAlpha = .7; x.stroke(); x.globalAlpha = 1;
    if (club) x.drawImage(club, cx - 50, crestY - 58, 100, 116);
    x.fillStyle = "#c9a227"; diamond(cx, crestY - 108, 11); diamond(cx, crestY + 104, 8);

    // ---------- headings ----------
    txt("VISVESVARAYA TECHNOLOGICAL UNIVERSITY, BELAGAVI", 304, "700 41px Georgia, serif", "#0b2a5b", "2px");
    txt("KARNATAKA, INDIA", 338, "22px Arial, sans-serif", "#6a5a1e", "6px");
    txt("KALPATARU INSTITUTE OF TECHNOLOGY, TIPTUR", 396, "700 35px Georgia, serif", "#f26522", "1px");
    txt("DEPARTMENT OF INFORMATION SCIENCE & ENGINEERING · AVYAKT", 444, "20px Arial, sans-serif", "#5a6b88", "3px");

    // ornamental divider
    (function () {
      var halfW = 420, y = 486;
      var g = x.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
      g.addColorStop(0, "rgba(201,162,39,0)"); g.addColorStop(.5, "#c9a227"); g.addColorStop(1, "rgba(201,162,39,0)");
      x.fillStyle = g; x.fillRect(cx - halfW, y, halfW * 2, 4);
      x.fillStyle = "#c9a227"; diamond(cx, y + 2, 11);
    })();

    // gold-foil title
    var tg = x.createLinearGradient(0, 540, 0, 590);
    tg.addColorStop(0, "#d9b23f"); tg.addColorStop(.42, "#f7e8ab");
    tg.addColorStop(.68, "#c9a227"); tg.addColorStop(1, "#8f6f12");
    txt("CERTIFICATE", 566, "700 66px Georgia, serif", tg, "14px");
    txt((e.subtitle || "of Participation").toUpperCase(), 634, "22px Arial, sans-serif", "#8a7a3a", "8px");

    // ---------- recipient ----------
    txt("This is to certify that", 690, "26px Georgia, serif", "#33415c", "1px");
    txt(p.name, 792, '400 96px "Great Vibes", cursive', "#10203c", "0px");
    x.font = '400 96px "Great Vibes", cursive';
    var nw = Math.max(560, Math.min(900, x.measureText(p.name).width + 180));
    var fy = 818, half = nw / 2;
    var gl = x.createLinearGradient(cx - half, 0, cx, 0);
    gl.addColorStop(0, "rgba(201,162,39,0)"); gl.addColorStop(1, "#c9a227");
    x.fillStyle = gl; x.fillRect(cx - half, fy, half - 10, 3);
    var gr = x.createLinearGradient(cx, 0, cx + half, 0);
    gr.addColorStop(0, "#c9a227"); gr.addColorStop(1, "rgba(201,162,39,0)");
    x.fillStyle = gr; x.fillRect(cx + 10, fy, half - 10, 3);
    x.fillStyle = "#c9a227"; diamond(cx, fy + 1, 9);
    txt("USN: " + normUsn(p.usn), 852, "22px Arial, sans-serif", "#5a6b88", "5px");

    // ---------- body ----------
    var body = e.body || "has actively participated in the event and is hereby awarded this certificate of participation.";
    x.font = "26px Georgia, serif"; x.fillStyle = "#33415c"; x.textAlign = "center";
    var lines = wrapText(x, body, 1400);
    lines.forEach(function (l, i) { x.fillText(l, cx, 922 + i * 48); });

    // ---------- signatures ----------
    var signs = (DB.signatories || []).slice(0, 3);
    var cxs = signs.length === 1 ? [1000] : signs.length === 2 ? [560, 1440] : [420, 1000, 1580];
    var boxW = 264, boxH = 104, boxY = 1002;
    for (var i = 0; i < signs.length; i++) {
      var s = signs[i], scx = cxs[i];
      var ph = await loadImg(s.photo);
      if (ph) x.drawImage(ph, scx - boxW / 2, boxY, boxW, boxH);
      x.strokeStyle = "#12203a"; x.lineWidth = 2; x.beginPath(); x.moveTo(scx - 150, 1118); x.lineTo(scx + 150, 1118); x.stroke();
      x.font = "700 22px Georgia, serif"; ls("0px"); x.fillStyle = "#12203a"; x.textAlign = "center"; x.fillText(s.name || "", scx, 1154);
      x.font = "17px Arial, sans-serif"; x.fillStyle = "#5a6b88"; x.fillText(s.designation || "", scx, 1190);
    }

    // ---------- gold foil ribbon ----------
    var dateStr = e.date ? new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "";
    var evText = ((e.title || "AVYAKT") + (dateStr ? " · " + dateStr : "")).toUpperCase();
    var ry = 1252, rh = 60;
    var rg = x.createLinearGradient(PAD, 0, W - PAD, 0);
    rg.addColorStop(0, "#b8901c"); rg.addColorStop(.18, "#e7c65a"); rg.addColorStop(.5, "#fff3c4");
    rg.addColorStop(.82, "#e7c65a"); rg.addColorStop(1, "#b8901c");
    x.fillStyle = rg;
    x.beginPath();
    x.moveTo(PAD, ry); x.lineTo(W - PAD, ry);
    x.lineTo(W - PAD - 32, ry + rh / 2); x.lineTo(W - PAD, ry + rh);
    x.lineTo(PAD, ry + rh); x.lineTo(PAD + 32, ry + rh / 2);
    x.closePath(); x.fill();
    x.font = "700 22px Arial, sans-serif"; ls("6px"); x.fillStyle = "#3a2c05"; x.textAlign = "center";
    x.fillText(evText, cx, ry + 38); ls("0px");

    // ---------- certificate id ----------
    x.font = "18px Arial, sans-serif"; ls("2px"); x.fillStyle = "#8a7a3a"; x.textAlign = "center";
    x.fillText("CERTIFICATE ID: HZ-" + normUsn(p.usn), cx, 1366); ls("0px");

    var url = c.toDataURL("image/png");
    var a = document.createElement("a");
    a.href = url;
    a.download = "AVYAKT-Certificate-" + normUsn(p.usn) + ".png";
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* =====================================================================
     MEMBER SIDE
     ===================================================================== */
  function initMember() {
    var gate = $("#memberGate"), panel = $("#memberPanel");
    if (!gate) return;

    function unlock() {
      gate.classList.add("hidden"); panel.classList.remove("hidden");
      fillMemberForm();
    }
    $("#m-unlock").addEventListener("click", function () {
      var note = $("#mGateNote");
      if (String($("#m-pass").value || "").trim().toLowerCase() === DEFAULT_PASSCODE.toLowerCase()) {
        try { sessionStorage.setItem(SESSION, "1"); } catch (e) {}
        unlock();
      } else { note.className = "notice err show"; note.textContent = "Incorrect passcode. Try again."; }
    });
    $("#m-pass").addEventListener("keydown", function (e) { if (e.key === "Enter") $("#m-unlock").click(); });
    try { if (sessionStorage.getItem(SESSION) === "1") unlock(); } catch (e) {}

    $("#m-logout").addEventListener("click", function () {
      try { sessionStorage.removeItem(SESSION); } catch (e) {}
      panel.classList.add("hidden"); gate.classList.remove("hidden");
    });

    // participants
    $("#m-add").addEventListener("click", function () { addBulk($("#m-bulk").value); $("#m-bulk").value = ""; });
    $("#m-file").addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () { addBulk(r.result); };
      r.readAsText(f);
    });
    $("#m-sample").addEventListener("click", function () { DB.participants = seed().participants.slice(); renderList(); save(DB); });
    $("#m-clear").addEventListener("click", function () { if (confirm("Remove all participants?")) { DB.participants = []; renderList(); save(DB); } });
    $("#m-add-sign").addEventListener("click", function () { DB.signatories.push({ name: "", designation: "", photo: "" }); renderSigns(); });
    $("#m-save").addEventListener("click", saveAll);
    $("#m-export").addEventListener("click", exportJson);
    $("#m-import").addEventListener("change", importJson);
  }

  function addBulk(text) {
    var added = 0;
    String(text).split(/\r?\n/).forEach(function (line) {
      line = line.trim(); if (!line) return;
      var parts = line.split(/[,\t;]+/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (parts.length < 2) return;
      var usn = parts.pop();
      var name = parts.join(" ");
      if (!name || !usn) return;
      if (DB.participants.some(function (p) { return normUsn(p.usn) === normUsn(usn); })) return;
      DB.participants.push({ name: name, usn: usn }); added++;
    });
    renderList(); save(DB);
    var note = $("#mSaveNote"); note.className = "notice ok show"; note.textContent = "Added " + added + " participant" + (added === 1 ? "" : "s") + ".";
  }

  function renderList() {
    var mount = $("#m-list");
    $("#m-count").textContent = DB.participants.length + " participant" + (DB.participants.length === 1 ? "" : "s");
    if (!DB.participants.length) { mount.innerHTML = '<p class="muted small">No participants yet. Add them above or load the sample list.</p>'; refreshCount(); return; }
    mount.innerHTML = DB.participants.map(function (p, i) {
      return '<div class="pill-row" style="justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding:7px 0">' +
        '<span class="small"><strong>' + esc(p.name) + '</strong> · ' + esc(normUsn(p.usn)) + "</span>" +
        '<button class="btn btn-ghost btn-sm" data-rm="' + i + '" aria-label="Remove">✕</button></div>';
    }).join("");
    $$("[data-rm]", mount).forEach(function (b) {
      b.addEventListener("click", function () { DB.participants.splice(+this.getAttribute("data-rm"), 1); renderList(); save(DB); });
    });
    refreshCount();
  }

  function renderSigns() {
    var mount = $("#m-signs");
    mount.innerHTML = DB.signatories.map(function (s, i) {
      return '<div class="field" style="border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:10px">' +
        '<div class="field-row two"><div class="field"><label>Name</label><input data-sn="' + i + '" value="' + esc(s.name) + '" placeholder="e.g. Dr. Sunitha R."></div>' +
        '<div class="field"><label>Designation</label><input data-sd="' + i + '" value="' + esc(s.designation) + '" placeholder="e.g. Faculty Coordinator"></div></div>' +
        '<div class="field-row two"><div class="field"><label>Signature photo (optional)</label><input type="file" accept="image/*" data-sp="' + i + '">' +
        (s.photo ? '<div class="small muted mt-1">✓ photo added</div>' : '<div class="hint">Leave blank for an empty placeholder box.</div>') + "</div>" +
        '<div class="field" style="display:flex;align-items:flex-end"><button class="btn btn-ghost btn-sm" data-srm="' + i + '">Remove</button></div></div>' +
      "</div>";
    }).join("");
    $$("[data-sn]", mount).forEach(function (inp) { inp.addEventListener("input", function () { DB.signatories[+this.dataset.sn].name = this.value; }); });
    $$("[data-sd]", mount).forEach(function (inp) { inp.addEventListener("input", function () { DB.signatories[+this.dataset.sd].designation = this.value; }); });
    $$("[data-sp]", mount).forEach(function (inp) {
      inp.addEventListener("change", function (e) {
        var f = e.target.files[0]; if (!f) return; var i = +this.dataset.sp;
        var r = new FileReader(); r.onload = function () { DB.signatories[i].photo = r.result; renderSigns(); };
        r.readAsDataURL(f);
      });
    });
    $$("[data-srm]", mount).forEach(function (b) {
      b.addEventListener("click", function () { DB.signatories.splice(+this.dataset.srm, 1); renderSigns(); });
    });
  }

  function fillMemberForm() {
    $("#m-event-title").value = DB.event.title || "";
    $("#m-event-date").value = DB.event.date || "";
    $("#m-cert-sub").value = DB.event.subtitle || "";
    $("#m-cert-body").value = DB.event.body || "";
    renderList(); renderSigns();
  }

  function saveAll() {
    DB.event.title = $("#m-event-title").value;
    DB.event.date = $("#m-event-date").value;
    DB.event.subtitle = $("#m-cert-sub").value || "of Participation";
    DB.event.body = $("#m-cert-body").value;
    DB.settings.sample = false;
    save(DB); refreshCount();
    var note = $("#mSaveNote"); note.className = "notice ok show"; note.textContent = "Saved! Participants can now generate certificates.";
  }

  function exportJson() {
    var blob = new Blob([JSON.stringify(DB, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "horizon-certificates.json";
    document.body.appendChild(a); a.click(); a.remove();
  }
  function importJson(e) {
    var f = e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () { try { DB = normalize(JSON.parse(r.result)); save(DB); fillMemberForm(); var note = $("#mSaveNote"); note.className = "notice ok show"; note.textContent = "Imported successfully."; } catch (err) { alert("Could not read that file."); } };
    r.readAsText(f);
  }

  /* ---------- boot ---------- */
  function boot() {
    initTabs();
    refreshCount();
    initStudent();
    initMember();
    fitCertificate();
    window.addEventListener("resize", fitCertificate);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
