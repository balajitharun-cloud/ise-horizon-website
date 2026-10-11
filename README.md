# AVYAKT — Club Website + Certificate Portal

Official website for **AVYAKT**, the Information Science & Engineering student
club of **Kalpataru Institute of Technology, Tiptur** (affiliated to **Visvesvaraya
Technological University, Belagavi**).

Mobile-first, installable (PWA), no build step and no server. Open `index.html`, or
host the folder anywhere.

---

## Pages

| File | Page |
|------|------|
| `index.html` | Home — hero, stats, upcoming events, "every kind of event", Horizon Hackathon, latest news |
| `about.html` | About / Mission — story, vision, goals, history, achievements, news |
| `events.html` | Events — calendar + upcoming list + past-event archive |
| `projects.html` | Projects Showcase — with tech stack, team and GitHub links |
| `team.html` | Core Committee |
| `gallery.html` | Photo/video gallery |
| `join.html` | Join / Membership form |
| `contact.html` | Contact + social links |
| `certificate.html` | Certificate Portal |
| `admin.html` | **Member Panel** — manage all site content |

Site-wide: **search** (🔍 or press `/`), **dark/light toggle** (🌙), and a **service
worker** for offline use.

---

## Member Panel (`admin.html`) — passcode `ise@2007`

Elite members manage everything from here:

- **Events** — add an event (title, date, time, venue, mode, category, registration
  link, description). An event only appears on the website once it is added here.
  **Archive** moves it to the past-events list (past events are read-only).
- **News** — publish updates and announcements.
- **Projects** — add a student project with its **GitHub repository URL**; it appears
  on the Projects page linked to the repo.
- **Gallery** — add photo tiles.
- **Members** — the member list (join-form submissions land here too). Roles:
  Active member, Event host, Core committee, Elite member.
- **Hackathon** — the Horizon Hackathon highlight shown on the home page.
- **Data** — Export/Import the whole content set as JSON, or reset.

Content is stored in the browser (localStorage). Use **Export/Import** to move it
between devices, or connect a backend later for a shared, multi-user list.

---

## Certificate Portal (`certificate.html`)

- **Participant mode:** a student enters their **name + USN**; the certificate is
  generated only if both match the list a member uploaded. Shows the university seal,
  **Visvesvaraya Technological University, Belagavi** on top, **Kalpataru Institute of
  Technology, Tiptur** below, the participant's name and USN, three signature boxes
  (name + designation + photo placeholder) and the club logo. Download as **PNG** or
  print/save as PDF. The certificate scales to fit phone screens.
- **Member mode:** same passcode — set the event name/date/wording, upload the
  participant list (paste `Name, USN` lines or a `.csv`/`.txt`), and manage signatories.

> Passcode: **`ise@2007`**. Change it in `assets/js/store.js` (`PASSCODE`) before going
> live if you wish.

---

## Editing content

- **Club info, team, stats, achievements** → `assets/js/data.js`
- **Events, news, projects, gallery, members** → managed in the Member Panel (stored
  via `assets/js/store.js`)
- **Design / colours** → `assets/css/style.css` (CSS variables at the top)

---

## Hosting

The site is a static site, so any host works — GitHub Pages, Netlify, Vercel,
Cloudflare Pages, or a college server. To test locally:

```bash
python3 -m http.server 8000   # open http://localhost:8000
```

### Auto-deploy from GitHub

Once a host is **connected to this GitHub repo**, every push to `main` redeploys the
site automatically — you never upload anything by hand again.

| Host | Connect it | What happens on a push to `main` |
|---|---|---|
| **Vercel** | vercel.com/new → import this repo | redeploys automatically |
| **Netlify** | Netlify → Add new site → Import from Git | redeploys automatically |
| **GitHub Pages** | already on (Settings → Pages → `main`) | rebuilds automatically, ~40s |

### Shared member registrations (Join Us)

A public page cannot write to the GitHub repo — the token would be visible to anyone.
So the form posts to a small serverless endpoint, which owns the write:

| Host | Endpoint | Storage | Setup needed |
|---|---|---|---|
| **Netlify** | `netlify/functions/join.mjs` + `stats.mjs` | **Netlify Blobs** | **none — just deploy** |
| **Vercel** | `api/join.js` | the GitHub repo | add `GITHUB_TOKEN` (below) |
| **GitHub Pages** | none (no serverless) | — | not supported |

- `POST /api/join` records a registration and returns the new count.
- `GET /api/stats` returns the shared member list, which the home page uses for the
  **Active members** number and the member panel uses to show every registration.

On Netlify there is nothing to configure: Blobs ships with the platform. On Vercel the
function writes to `data/content.json` and needs the token as an environment variable
(never in the code):

```
GITHUB_TOKEN   = <fine-grained token with Contents: Read and write on this repo>
GITHUB_OWNER   = balajitharun-cloud     # optional
GITHUB_REPO    = ise-horizon-website    # optional
GITHUB_BRANCH  = main                   # optional
```

Set it in **Vercel → Project → Settings → Environment Variables**. Without it,
`/api/join` returns "Server not configured" and the form falls back to a local-only
message. The **Active members** number can never fall below the number of members
recorded, and an elite member can always set it by hand in the panel's Stats tab.

---

## Credits

Built by AVYAKT · Department of Information Science & Engineering,
Kalpataru Institute of Technology, Tiptur.
