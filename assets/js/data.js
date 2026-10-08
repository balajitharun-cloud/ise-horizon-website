/* =====================================================================
   ISE HORIZON — site content
   Edit this single file to update events, team, projects, resources,
   gallery, announcements and achievements across the whole website.
   ===================================================================== */

window.HORIZON = {

  club: {
    name: "ISE HORIZON",
    tagline: "Exploring the horizon of Information Science & Engineering.",
    college: "Kalpataru Institute of Technology, Tiptur",
    university: "Visvesvaraya Technological University, Belagavi",
    estd: "2021",
    email: "ise.horizon@kit.edu.in",
    phone: "+91 98765 43210",
    address: "Kalpataru Institute of Technology, B.H. Road, Tiptur, Tumakuru District, Karnataka – 572201",
    socials: {
      instagram: "https://instagram.com/ise.horizon",
      linkedin: "https://linkedin.com/company/ise-horizon",
      github: "https://github.com/ise-horizon",
      whatsapp: "https://chat.whatsapp.com/ISEHORIZON",
      discord: "https://discord.gg/ise-horizon",
      youtube: "https://youtube.com/@isehorizon"
    }
  },

  /* ---------- Upcoming events ---------- */
  events: [
    {
      id: "hack-2026",
      title: "HORIZON Hackathon 2026",
      category: "Hackathon",
      date: "2026-11-15T09:00:00+05:30",
      endDate: "2026-11-16T18:00:00+05:30",
      time: "9:00 AM – 6:00 PM (2 days)",
      venue: "ISE Seminar Hall, KIT Tiptur",
      mode: "Offline",
      featured: true,
      poster: "🚀",
      description: "A 24-hour build sprint where teams of 2–4 solve real-world problem statements in AI, web, and IoT. Mentors from industry guide teams; winners get cash prizes, internships and certificates.",
      registration: "https://forms.gle/horizon-hackathon-2026",
      seats: 120
    },
    {
      id: "ml-bootcamp",
      title: "Machine Learning Bootcamp",
      category: "Workshop",
      date: "2026-10-24T10:00:00+05:30",
      time: "10:00 AM – 4:00 PM",
      venue: "Computer Lab 2",
      mode: "Offline",
      poster: "🤖",
      description: "Hands-on introduction to Python, pandas and scikit-learn. Build your first classifier and deploy it as a simple web app.",
      registration: "https://forms.gle/horizon-ml-bootcamp",
      seats: 60
    },
    {
      id: "uiux-challenge",
      title: "UI/UX Design Challenge",
      category: "Competition",
      date: "2026-11-05T14:00:00+05:30",
      time: "2:00 PM – 6:00 PM",
      venue: "Online (Google Meet)",
      mode: "Online",
      poster: "🎨",
      description: "Design a mobile-first interface for a campus utility app. Judged on usability, accessibility and visual polish. Individual or team of two.",
      registration: "https://forms.gle/horizon-uiux",
      seats: 80
    },
    {
      id: "cloud-studyjam",
      title: "Cloud Study Jam",
      category: "Workshop",
      date: "2026-12-03T11:00:00+05:30",
      time: "11:00 AM – 3:00 PM",
      venue: "ISE Seminar Hall",
      mode: "Offline",
      poster: "☁️",
      description: "Get started with cloud fundamentals and deploy your first containerised app. Bring a laptop and a Google account.",
      registration: "https://forms.gle/horizon-cloud",
      seats: 70
    }
  ],

  /* ---------- Past events ---------- */
  pastEvents: [
    {
      id: "coding-club-launch",
      title: "Weekly DSA Circle — Season 3",
      category: "Series",
      date: "2026-09-20",
      venue: "Computer Lab 1",
      description: "12 weeks of guided data-structures & algorithms practice with weekly contests and peer mentoring.",
      results: "148 participants · 30 completed the full season · 12 ranked in the top percentile of the intra-college contest.",
      poster: "🧩"
    },
    {
      id: "web-dev-workshop",
      title: "Full-Stack Web Dev Workshop",
      category: "Workshop",
      date: "2026-08-16",
      venue: "Computer Lab 2",
      description: "Two-day workshop covering HTML/CSS, JavaScript, React basics and deploying to the cloud.",
      results: "96 attendees · 41 deployed their own portfolio site live.",
      poster: "🌐"
    },
    {
      id: "tech-talk-ai",
      title: "Tech Talk: AI in Everyday Engineering",
      category: "Talk",
      date: "2026-07-28",
      venue: "Auditorium",
      description: "Alumni and industry guests discussed how AI is reshaping software, healthcare and manufacturing.",
      results: "220 attendees · recorded session added to the Learning Hub.",
      poster: "🎙️"
    },
    {
      id: "ideathon-2026",
      title: "Ideathon 2026",
      category: "Competition",
      date: "2026-03-14",
      venue: "ISE Seminar Hall",
      description: "Pitch-a-thon for early-stage ideas with a working prototype requirement.",
      results: "32 teams · 3 winning ideas incubated by the college E-Cell.",
      poster: "💡"
    }
  ],

  /* ---------- Team / Core Committee ---------- */
  team: [
    { name: "Dr. Sunitha R.", role: "Faculty Coordinator", dept: "Dept. of ISE", bio: "Guides the club's technical direction and industry collaborations.", initials: "SR", socials: { linkedin: "#" } },
    { name: "Aarav Kulkarni", role: "President", dept: "ISE · Final Year", bio: "Full-stack developer; led two hackathon-winning teams.", initials: "AK", socials: { linkedin: "#", github: "#" } },
    { name: "Meghana Shetty", role: "Vice President", dept: "ISE · Third Year", bio: "AI/ML enthusiast and the mind behind the ML Bootcamp series.", initials: "MS", socials: { linkedin: "#" } },
    { name: "Rahul Naik", role: "Technical Lead", dept: "ISE · Third Year", bio: "Backend & DevOps; maintains the club's open-source projects.", initials: "RN", socials: { github: "#" } },
    { name: "Sneha Patil", role: "Events Lead", dept: "ISE · Third Year", bio: "Coordinates workshops, competitions and the annual hackathon.", initials: "SP", socials: { linkedin: "#" } },
    { name: "Kiran Kumar", role: "Design Lead", dept: "ISE · Second Year", bio: "UI/UX and branding; designs every event poster and this website.", initials: "KK", socials: { linkedin: "#" } },
    { name: "Divya Rao", role: "Social Media Lead", dept: "ISE · Second Year", bio: "Runs our Instagram and LinkedIn; grows the community online.", initials: "DR", socials: { instagram: "#" } },
    { name: "Arjun Hegde", role: "Treasurer", dept: "ISE · Third Year", bio: "Handles sponsorships, budgeting and partnerships.", initials: "AH", socials: { linkedin: "#" } }
  ],

  /* ---------- Projects showcase ---------- */
  projects: [
    {
      title: "CampusEats",
      status: "Ongoing",
      desc: "A canteen pre-ordering app that lets students order and pay ahead, cutting queue times.",
      stack: ["React", "Node.js", "MongoDB", "Razorpay"],
      team: ["Aarav Kulkarni", "Kiran Kumar"],
      github: "https://github.com/ise-horizon/campuseats",
      demo: "#"
    },
    {
      title: "SmartAttend",
      status: "Completed",
      desc: "Face-recognition based attendance system for classrooms with a faculty dashboard.",
      stack: ["Python", "OpenCV", "Flask", "SQLite"],
      team: ["Rahul Naik", "Meghana Shetty"],
      github: "https://github.com/ise-horizon/smartattend",
      demo: "#"
    },
    {
      title: "Krishi Mitra",
      status: "Ongoing",
      desc: "A multilingual crop-advisory chatbot for local farmers, powered by an LLM and regional data.",
      stack: ["Python", "LangChain", "FastAPI", "Kannada NLP"],
      team: ["Meghana Shetty", "Divya Rao"],
      github: "https://github.com/ise-horizon/krishi-mitra",
      demo: "#"
    },
    {
      title: "Horizon Portal",
      status: "Completed",
      desc: "This website — an open-source club portal with a certificate generator for event participants.",
      stack: ["HTML", "CSS", "JavaScript", "PWA"],
      team: ["Kiran Kumar", "Rahul Naik"],
      github: "https://github.com/ise-horizon/portal",
      demo: "certificate.html"
    },
    {
      title: "BusTrack KIT",
      status: "Ongoing",
      desc: "Live tracking of college buses with ETA notifications for students on the app.",
      stack: ["Flutter", "Firebase", "Google Maps API"],
      team: ["Sneha Patil", "Arjun Hegde"],
      github: "https://github.com/ise-horizon/bustrack",
      demo: "#"
    },
    {
      title: "StudyBuddy",
      status: "Completed",
      desc: "A peer-to-peer notes and past-papers exchange with version history and ratings.",
      stack: ["Next.js", "PostgreSQL", "Prisma"],
      team: ["Aarav Kulkarni", "Sneha Patil"],
      github: "https://github.com/ise-horizon/studybuddy",
      demo: "#"
    }
  ],

  /* ---------- Resources / Learning Hub ---------- */
  resources: [
    { title: "DSA Roadmap 2026", type: "Roadmap", domain: "DSA", desc: "A 12-week structured path from arrays to graphs, with problem sets.", link: "#" },
    { title: "Web Development Starter Kit", type: "Notes", domain: "Web", desc: "Curated HTML/CSS/JS notes and mini-projects for beginners.", link: "#" },
    { title: "Machine Learning Bootcamp — Recording", type: "Recording", domain: "AI/ML", desc: "Full 4-hour session recording and the Colab notebooks used.", link: "#" },
    { title: "Git & GitHub Cheatsheet", type: "Cheatsheet", domain: "Tools", desc: "Every command you need for day-to-day version control.", link: "#" },
    { title: "Placement Prep Handbook", type: "Handbook", domain: "Career", desc: "Aptitude, core CS and interview experiences from seniors.", link: "#" },
    { title: "Cloud Study Jam Slides", type: "Slides", domain: "Cloud", desc: "Deck from the Cloud Study Jam plus deployable sample code.", link: "#" },
    { title: "UI/UX Fundamentals", type: "Notes", domain: "Design", desc: "Design thinking, wireframing and accessibility basics.", link: "#" },
    { title: "Open Source Contribution Guide", type: "Guide", domain: "Career", desc: "How to find issues, raise your first PR and get it merged.", link: "#" }
  ],

  /* ---------- Gallery ---------- */
  gallery: [
    { caption: "HORIZON Hackathon — final demo round", event: "Hackathon", emoji: "🚀", wide: true },
    { caption: "ML Bootcamp in Computer Lab 2", event: "Workshop", emoji: "🤖" },
    { caption: "DSA Circle weekly contest", event: "Series", emoji: "🧩" },
    { caption: "Tech Talk on AI — packed auditorium", event: "Talk", emoji: "🎙️" },
    { caption: "Winning team of Ideathon 2026", event: "Competition", emoji: "🏆" },
    { caption: "Web Dev Workshop, day two", event: "Workshop", emoji: "🌐" },
    { caption: "Core committee team meet", event: "Team", emoji: "👥" },
    { caption: "Certificates distribution ceremony", event: "Ceremony", emoji: "📜" }
  ],

  /* ---------- Announcements / Blog ---------- */
  announcements: [
    {
      title: "Registrations open for HORIZON Hackathon 2026",
      date: "2026-10-05",
      tag: "Event",
      excerpt: "Teams of 2–4 can register now for our flagship 24-hour hackathon. Limited to 120 seats.",
      body: "Our flagship hackathon returns with problem statements in AI, web and IoT. Cash prizes worth ₹50,000, internship opportunities with partner startups, and certificates for every participant. Bring your laptop, your teammates and your best ideas."
    },
    {
      title: "ISE HORIZON wins Best Student Club award",
      date: "2026-09-28",
      tag: "Achievement",
      excerpt: "The club was recognised at the college's annual tech day for community impact.",
      body: "We are thrilled to be named Best Student Club for 2025–26, recognising 40+ events and 600+ active members across the department."
    },
    {
      title: "Season 3 of the DSA Circle wraps up",
      date: "2026-09-22",
      tag: "Recap",
      excerpt: "148 students took part this season, with 12 landing in the top percentile.",
      body: "Twelve weeks of guided practice, weekly contests and peer mentoring came to a close. Congratulations to everyone who finished — and a special shout-out to our top-ranked solvers."
    }
  ],

  /* ---------- Achievements / Hall of Fame ---------- */
  achievements: [
    { year: "2026", title: "Best Student Club — KIT Tech Day", detail: "Recognised for 40+ events and 600+ active members." },
    { year: "2026", title: "2nd Place — State Level Hackathon", detail: "Team 'Krishi Mitra' for their crop-advisory chatbot." },
    { year: "2025", title: "Google Cloud Study Jam Champions", detail: "Highest completion rate among clubs in the region." },
    { year: "2025", title: "18 Placement Offers", detail: "Club members placed in product and service companies." },
    { year: "2024", title: "Smart India Hackathon Finalist", detail: "Team 'SmartAttend' reached the grand finale." }
  ],

  /* ---------- Stats (home) ---------- */
  stats: [
    { num: "600+", lbl: "Active members" },
    { num: "40+", lbl: "Events hosted" },
    { num: "25+", lbl: "Projects built" },
    { num: "15+", lbl: "Hackathon wins" }
  ],

  /* ---------- Sponsors / Partners ---------- */
  partners: [
    { name: "Kalpataru Institute of Technology", kind: "Host Institution", emoji: "🏫" },
    { name: "VTU Belagavi", kind: "Affiliating University", emoji: "🎓" },
    { name: "KIT E-Cell", kind: "Innovation Partner", emoji: "💡" },
    { name: "TechNova Labs", kind: "Industry Sponsor", emoji: "🏢" },
    { name: "GDG Tumakuru", kind: "Community Partner", emoji: "🌐" },
    { name: "Alumni Network", kind: "Mentorship", emoji: "🤝" }
  ]
};
