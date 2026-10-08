/* =====================================================================
   ISE HORIZON — static site content (club info, team, stats, achievements)
   Events, news, projects, gallery and members are managed by elite members
   in the member panel and live in assets/js/store.js.
   ===================================================================== */

window.HORIZON = {

  club: {
    name: "ISE HORIZON",
    tagline: "The Information Science & Engineering club of KIT Tiptur — building, competing and creating.",
    college: "Kalpataru Institute of Technology, Tiptur",
    university: "Visvesvaraya Technological University, Belagavi",
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

  stats: [
    { num: "600+", lbl: "Active members" },
    { num: "40+", lbl: "Events hosted" },
    { num: "25+", lbl: "Projects built" },
    { num: "15+", lbl: "Competitions won" }
  ],

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

  achievements: [
    { year: "2026", title: "Best Student Club — KIT Tech Day", detail: "Recognised for 40+ events and 600+ active members." },
    { year: "2026", title: "2nd Place — State Level Hackathon", detail: "Team 'Krishi Mitra' for their crop-advisory chatbot." },
    { year: "2025", title: "Google Cloud Study Jam Champions", detail: "Highest completion rate among clubs in the region." },
    { year: "2025", title: "18 Placement Offers", detail: "Club members placed in product and service companies." },
    { year: "2024", title: "Smart India Hackathon Finalist", detail: "Team 'SmartAttend' reached the grand finale." }
  ]
};
