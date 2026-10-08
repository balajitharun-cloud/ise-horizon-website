# ISE HORIZON — Club Website + Certificate Portal

Official website for **ISE HORIZON**, the Information Science & Engineering student
club of **Kalpataru Institute of Technology, Tiptur** (affiliated to **Visvesvaraya
Technological University, Belagavi**).

It is a **mobile-first, installable (PWA)** static website — no build step, no server
required. Open `index.html` in any browser, or host the folder anywhere.

---

## Pages

| File | Page |
|------|------|
| `index.html` | Home — hero, countdown to the next event, stats, upcoming events, projects, news, partners |
| `about.html` | About / Mission — story, vision, goals, history timeline, achievements, news |
| `events.html` | Events — month calendar + list, registration links, past-event archive |
| `projects.html` | Projects Showcase — filterable by status, with stack + GitHub links |
| `resources.html` | Learning Hub — filterable notes, roadmaps, recordings, slides |
| `team.html` | Core Committee — photos/initials, roles, bios, socials |
| `gallery.html` | Photo/video gallery |
| `join.html` | Join / Membership form |
| `contact.html` | Contact + social links |
| `certificate.html` | **Certificate Portal** (see below) |

Also included: site-wide **search** (the 🔍 button, or press `/`), a **dark/light
toggle** (🌙), and a **service worker** so the site works offline once loaded.

---

## The Certificate Portal (`certificate.html`)

Two modes, switched with the tabs at the top:

### 1. Participant mode
A student types their **name + USN** and the certificate is generated **only if the
name and USN match the list a club member uploaded**. The certificate shows:

- the **university seal** (VTU) and the **college logo**, flanking the university name
- **Visvesvaraya Technological University, Belagavi** on top
- **Kalpataru Institute of Technology, Tiptur** below it
- "CERTIFICATE — of Participation"
- the participant's **name** and **USN**
- **three signature boxes** with a photo/signature placeholder plus each
  signatory's **name and designation**

Students can **download a PNG** (drawn on a canvas) or **print / save as PDF**.

### 2. Club member mode
Protected by a passcode. Members can:

- set the **event name, date, certificate wording and body text**
- **add participants** by pasting `Name, USN` lines, or **upload a `.csv` / `.txt`** file
- add up to three **signatories** (name, designation, optional signature photo)
- **save**, **export/import** the whole set as JSON

> **Demo passcode:** `HORIZON2026`
> Change it in `assets/js/certificate.js` (the `DEFAULT_PASSCODE` constant) before
> going live.

The portal ships with a small **sample participant list** so it works immediately.
Open the member panel and hit **Clear all** (or replace the list) when you're ready
for a real event.

---

## Editing content

Almost everything lives in **`assets/js/data.js`** — edit that one file to update
events, past events, team, projects, resources, gallery, announcements, achievements,
stats and partners. Add real photos to `assets/images/` and reference them from there.

Branding colours and the whole design system are in **`assets/css/style.css`**
(CSS variables at the top: `--brand-blue`, `--brand-orange`, etc.).

---

## Hosting it

Any static host works — no backend needed.

- **GitHub Pages:** push this folder to a repo and enable Pages.
- **Netlify / Vercel / Cloudflare Pages:** drag-and-drop the folder.
- **Google Sites / college server:** upload the files.

To test locally:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Hosting over `http(s)` also enables the PWA install prompt and offline caching.

---

## Note on data storage

The certificate portal stores its participant list and settings in the **browser's
localStorage** — i.e. per device. That keeps the site fully static. For a shared,
multi-device list (every student sees the same data), connect a small backend or a
service like Firebase/Supabase later; the member panel's **Export/Import JSON** gives
you a simple way to move data between devices in the meantime.

---

## Credits

Built by ISE HORIZON · Department of Information Science & Engineering,
Kalpataru Institute of Technology, Tiptur.
