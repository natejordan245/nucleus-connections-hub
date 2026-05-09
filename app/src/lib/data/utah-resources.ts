import type { ResourceDTO } from "./types";

// Curated, real Utah-specific resources. Each entry is meant to close a
// concrete gap between a Utah talent and a dream role on the local scene —
// founder ecosystem, workforce upskilling, women / under-represented founder
// support, community meetups, and bootcamps.
//
// kind is constrained at the DB layer to one of:
//   guide | video | deck | playbook | link
// We map cohorts / structured programs to "playbook", standalone resources to
// "link", and primer-style writeups to "guide".
//
// URLs are real top-level org domains so they remain stable; the description
// names the specific program.
export const UTAH_RESOURCES: ResourceDTO[] = [
  // ── Tech ecosystem hubs ──────────────────────────────────────────────────
  {
    id: "ut-silicon-slopes",
    title: "Silicon Slopes",
    description:
      "Utah's tech community nonprofit. Hosts chapters, podcasts, the annual Silicon Slopes Tech Summit, and weekly events across the Wasatch Front.",
    kind: "link",
    url: "https://siliconslopes.com",
    tags: ["community", "events", "network", "founders", "operators"],
    summary:
      "Closes the network gap for anyone new to Utah tech — the single best entry point to meet operators, founders, and investors across the Wasatch Front.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-silicon-slopes-summit",
    title: "Silicon Slopes Tech Summit",
    description:
      "Utah's flagship two-day tech conference at the Salt Palace. Free tickets historically available for community members; sessions span founder, engineering, and ops tracks.",
    kind: "link",
    url: "https://summit.siliconslopes.com",
    tags: ["event", "tech-summit", "founders", "operators", "free"],
    summary:
      "Closes the visibility gap — one weekend in SLC puts you in the same room as most of the Utah tech ecosystem.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-techbuzz",
    title: "TechBuzz News",
    description:
      "Independent news coverage of Utah startups, funding rounds, and tech-industry shifts. Run by Doug Pugmire.",
    kind: "link",
    url: "https://www.techbuzz.news",
    tags: ["news", "startups", "research", "industry"],
    summary:
      "Closes the awareness gap — the fastest way to know who in Utah just raised, hired, or pivoted.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-utah-business",
    title: "Utah Business Magazine",
    description:
      "Industry publication covering Utah's business and tech scene, with the Forty Under 40 and CXO of the Year features.",
    kind: "link",
    url: "https://www.utahbusiness.com",
    tags: ["news", "industry", "research", "leadership"],
    summary:
      "Closes the context gap on who the recognized operators and executives are across Utah industries.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-edcutah",
    title: "EDCUtah — Economic Development Corporation",
    description:
      "Publishes Utah industry research, employer maps, and relocation data. Useful when scoping target companies or sector trends.",
    kind: "link",
    url: "https://edcutah.org",
    tags: ["research", "industry", "data", "employers"],
    summary:
      "Closes the market-research gap — authoritative public data on Utah industries and target employers.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },

  // ── University founder programs ──────────────────────────────────────────
  {
    id: "ut-lassonde",
    title: "Lassonde Entrepreneur Institute (U of U)",
    description:
      "U of U's flagship entrepreneur program. Free workshops, residential Lassonde Studios housing, mentorship, and pitch competitions for student founders.",
    kind: "link",
    url: "https://lassonde.utah.edu",
    tags: ["u-of-u", "students", "founders", "free", "mentorship"],
    summary:
      "Closes the founder-readiness gap for U of U students — the on-ramp for almost every U-affiliated startup story.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-lassonde-hours",
    title: "Hours @ Lassonde — drop-in founder office hours",
    description:
      "Free 30-minute drop-in slots with Lassonde mentors covering ideation, customer discovery, fundraising, and incorporation. Open to U of U students.",
    kind: "playbook",
    url: "https://lassonde.utah.edu/hours",
    tags: ["mentorship", "u-of-u", "office-hours", "free", "founders"],
    summary:
      "Closes the founder-feedback gap for U of U students — talk to a real mentor before committing time or money.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-lassonde-get-seeded",
    title: "Get Seeded — monthly Lassonde pitch night",
    description:
      "Monthly pitch event where U of U student founders pitch for non-dilutive seed grants from a community-funded pool.",
    kind: "playbook",
    url: "https://lassonde.utah.edu/get-seeded",
    tags: ["pitch", "funding", "students", "u-of-u", "early-stage"],
    summary:
      "Closes the first-dollar gap for student founders — practice pitching and walk away with grant capital, no equity.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-bench-to-bedside",
    title: "Bench-to-Bedside — health-tech competition",
    description:
      "Multi-school competition pairing health-sciences and engineering students to design and prototype medical devices over an academic year. Prize pool funded by Utah donors.",
    kind: "playbook",
    url: "https://benchtobedside.utah.edu",
    tags: ["healthtech", "competition", "u-of-u", "medical-devices", "students"],
    summary:
      "Closes the cross-disciplinary gap for clinicians + engineers — structured way to ship a health-tech prototype as a Utah student.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-byu-sandbox",
    title: "BYU Sandbox (Rollins Center)",
    description:
      "Year-long startup cohort run out of BYU's Rollins Center. Students build real companies for real customers under a structured curriculum and mentor pool.",
    kind: "playbook",
    url: "https://sandbox.byu.edu",
    tags: ["byu", "students", "founders", "cohort", "rollins"],
    summary:
      "Closes the founder-execution gap for BYU students — the closest Utah analogue to YC for undergrads.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-byu-rollins",
    title: "BYU Rollins Center for Entrepreneurship & Technology",
    description:
      "BYU's central entrepreneurship hub. Hosts the Sandbox cohort, the Big Idea Pitch, the New Venture Challenge, and a mentor network of BYU-affiliated founders.",
    kind: "link",
    url: "https://rollins.byu.edu",
    tags: ["byu", "entrepreneurship", "competitions", "mentorship", "students"],
    summary:
      "Closes the network gap for BYU-affiliated founders — single front door to BYU's entrepreneurship programming.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },

  // ── Workforce upskilling & career change ─────────────────────────────────
  {
    id: "ut-tech-moms",
    title: "Tech-Moms — free tech training for Utah moms",
    description:
      "Eight-week donor-funded cohort that teaches Utah moms web fundamentals, common tech roles, and portfolio building. Graduates land entry-level tech jobs across Silicon Slopes employers.",
    kind: "playbook",
    url: "https://www.techmoms.co",
    tags: ["women-in-tech", "career-change", "free", "cohort", "utah"],
    summary:
      "Closes the career-change gap for Utah moms re-entering the workforce — the most distinctly-Utah path from caregiver to tech hire.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-women-tech-council",
    title: "Women Tech Council",
    description:
      "Utah-headquartered nonprofit with 11k+ members. Runs Women Tech Awards, the Pathway Mentorship Program, and SheTech for high schoolers.",
    kind: "link",
    url: "https://www.womentechcouncil.com",
    tags: ["women-in-tech", "mentorship", "events", "network", "utah"],
    summary:
      "Closes the visibility-and-mentorship gap for women in Utah tech — the single most active community of its kind in the state.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-shetech",
    title: "SheTech Explorer Day",
    description:
      "WTC's annual one-day hands-on STEM event for thousands of Utah high-school girls. Workshops led by engineers from Adobe, Domo, Qualtrics, and others.",
    kind: "link",
    url: "https://www.shetechexplorer.com",
    tags: ["women-in-tech", "students", "stem", "wtc", "free"],
    summary:
      "Closes the early-exposure gap for Utah high-school girls — first contact with real engineers and product teams.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-suazo",
    title: "Suazo Business Center — bilingual founder support",
    description:
      "Salt Lake City nonprofit offering free business workshops, lending, and one-on-one coaching in English and Spanish. Affiliated with the Utah Hispanic Chamber.",
    kind: "link",
    url: "https://www.suazocenter.org",
    tags: ["latino", "small-business", "bilingual", "free", "slc"],
    summary:
      "Closes the small-business-readiness gap for Utah's Latino founders — incorporation, lending, and tax workshops in their first language.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-sbdc",
    title: "Utah Small Business Development Center (SBDC)",
    description:
      "Statewide network of free business advising and workshops, hosted at SLCC, USU, SUU, and other Utah institutions. SBA-funded.",
    kind: "link",
    url: "https://utahsbdc.org",
    tags: ["small-business", "free", "workshops", "mentorship", "statewide"],
    summary:
      "Closes the operational-fundamentals gap for any Utah-based small business — free no-strings advising from real practitioners.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-wbcutah",
    title: "Women's Business Center of Utah",
    description:
      "SBA-funded center offering free business training, financial coaching, and lending support to Utah women starting or growing businesses.",
    kind: "link",
    url: "https://wbcutah.com",
    tags: ["women-founders", "free", "training", "counseling", "utah"],
    summary:
      "Closes the founder-readiness gap for Utah women — structured, free programming from idea through revenue.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-score-utah",
    title: "SCORE Northern Utah — free mentorship",
    description:
      "Volunteer SCORE chapter pairing Utah small-business owners with retired-executive mentors for unlimited free 1:1 sessions.",
    kind: "link",
    url: "https://www.score.org/northernutah",
    tags: ["mentorship", "free", "small-business", "utah"],
    summary:
      "Closes the experience-gap for first-time Utah operators — match with a senior mentor who's run a real business.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-slcc-10ksb",
    title: "10,000 Small Businesses (Salt Lake)",
    description:
      "Goldman Sachs–funded executive education for established small-business owners, hosted in Salt Lake. 12-week curriculum on growth strategy, finance, and HR. No tuition.",
    kind: "playbook",
    url: "https://www.10ksbapply.com",
    tags: ["founders", "growth", "cohort", "free", "slc"],
    summary:
      "Closes the second-stage growth gap for established Utah small businesses — formal MBA-style training without the tuition.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-custom-fit",
    title: "Custom Fit Training",
    description:
      "Utah workforce-services program that subsidizes tailored employee training delivered through community colleges. Employer applies on behalf of the team.",
    kind: "link",
    url: "https://www.customfittraining.org",
    tags: ["upskilling", "subsidized", "workforce", "employers", "utah"],
    summary:
      "Closes the team-skills gap for Utah employers — state-subsidized training delivered to your existing workforce.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-jobs-utah-gov",
    title: "Utah Workforce Services — free job-search workshops",
    description:
      "State Department of Workforce Services. Free career counseling, resume workshops, and Workforce Innovation grants for retraining at qualifying programs.",
    kind: "link",
    url: "https://jobs.utah.gov",
    tags: ["workforce", "free", "career", "retraining", "utah"],
    summary:
      "Closes the job-search-mechanics gap — free state-run workshops, plus retraining grants if you qualify.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },

  // ── Capital / investor access ────────────────────────────────────────────
  {
    id: "ut-park-city-angels",
    title: "Park City Angels",
    description:
      "Utah's most active angel group. Members write checks into seed-stage Utah and Mountain West companies; founders apply via the website.",
    kind: "link",
    url: "https://www.parkcityangels.com",
    tags: ["angels", "investors", "park-city", "early-stage", "fundraising"],
    summary:
      "Closes the first-check gap for early-stage Utah founders — most direct path into the Park City angel network.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-vc-org",
    title: "VentureCapital.org",
    description:
      "Utah-based nonprofit running founder boot camps, the Investors Choice pitch competition, and the Utah Angels network. Public events open to founders.",
    kind: "link",
    url: "https://www.venturecapital.org",
    tags: ["fundraising", "angels", "events", "pitch", "utah"],
    summary:
      "Closes the fundraising-readiness gap — structured pitch coaching plus direct access to Utah angel investors.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },

  // ── Coworking / community events ─────────────────────────────────────────
  {
    id: "ut-kiln",
    title: "Kiln — coworking + founder events",
    description:
      "Utah-born coworking with locations in Lehi, Salt Lake, and Park City. Hosts free founder talks, demo nights, and operator meetups.",
    kind: "link",
    url: "https://kiln.co",
    tags: ["coworking", "events", "founders", "lehi", "slc"],
    summary:
      "Closes the in-person-network gap — show up to a free Kiln event, leave knowing five Utah operators.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-utahjs",
    title: "UtahJS — Utah JavaScript community",
    description:
      "Volunteer-run Utah JavaScript community. Monthly meetups in SLC and Provo plus the annual UtahJS Conference at Snowbird.",
    kind: "link",
    url: "https://utahjs.com",
    tags: ["javascript", "meetup", "free", "community", "engineering"],
    summary:
      "Closes the engineer-network gap — the central JS community for hiring managers and devs across Utah.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-women-who-code-utah",
    title: "Women Who Code Utah",
    description:
      "Local chapter of Women Who Code. Free monthly meetups, study groups, and a job board geared to women engineers across the Wasatch Front.",
    kind: "link",
    url: "https://www.meetup.com/women-who-code-utah",
    tags: ["women-in-tech", "meetup", "engineering", "free", "utah"],
    summary:
      "Closes the community gap for women engineers in Utah — recurring free meetups and a peer network for job searches.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-spy-hop",
    title: "Spy Hop — youth digital media in SLC",
    description:
      "Salt Lake nonprofit teaching audio, film, music production, and game design to Utah youth ages 10–19. Most programs are free or sliding-scale.",
    kind: "link",
    url: "https://www.spyhop.org",
    tags: ["youth", "media", "film", "audio", "slc"],
    summary:
      "Closes the creative-skills gap for Utah youth — hands-on media production at near-zero cost.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-slc-public-library",
    title: "Salt Lake City Public Library — workshops & makerspace",
    description:
      "City library system with The Tessellate makerspace, free workshops on tools, software, and small-business basics, plus free database access.",
    kind: "link",
    url: "https://slcpl.org",
    tags: ["library", "workshops", "free", "slc", "makerspace"],
    summary:
      "Closes the access gap — free workshops, free databases, and a real makerspace inside walking distance of downtown SLC.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },

  // ── Continuing education / bootcamps ─────────────────────────────────────
  {
    id: "ut-uofu-continuing-ed",
    title: "U of U Professional Education",
    description:
      "University of Utah's continuing-ed arm. Industry certificates in software development, UX, project management, and data analytics — flexible evenings and online.",
    kind: "link",
    url: "https://continue.utah.edu",
    tags: ["u-of-u", "continuing-ed", "certificates", "professional"],
    summary:
      "Closes the credential gap for working Utahns — accredited certificates without leaving your day job.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-slcc-community-ed",
    title: "SLCC Community Education",
    description:
      "Salt Lake Community College's affordable non-credit programs covering trades, languages, computer skills, and personal enrichment.",
    kind: "link",
    url: "https://www.slcc.edu/communityed",
    tags: ["slcc", "classes", "affordable", "workforce"],
    summary:
      "Closes the access gap — low-cost classes that don't require enrolling in a degree program.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-helio-training",
    title: "Helio Training (formerly V School)",
    description:
      "Salt Lake City coding bootcamp with full-stack, UX, and data programs. Outcomes-based tuition options.",
    kind: "playbook",
    url: "https://www.heliotraining.com",
    tags: ["bootcamp", "slc", "tech", "career-change"],
    summary:
      "Closes the career-pivot gap for Utahns moving into tech — structured bootcamp with employer-pay tuition options.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-devmountain",
    title: "DevMountain — Provo coding bootcamp",
    description:
      "Provo-headquartered coding bootcamp offering full-stack web, iOS, UX, and software QA tracks. Local employer network.",
    kind: "playbook",
    url: "https://devmountain.com",
    tags: ["bootcamp", "provo", "tech", "career-change"],
    summary:
      "Closes the technical-skills gap for Utah Valley career-changers — bootcamp with the deepest Utah employer pipeline.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },

  // ── International / refugee / under-served ───────────────────────────────
  {
    id: "ut-wtc-utah",
    title: "World Trade Center Utah",
    description:
      "State trade promotion org. Free export workshops, country-market briefings, and trade missions for Utah companies looking to sell internationally.",
    kind: "link",
    url: "https://wtcutah.com",
    tags: ["export", "international", "growth", "free", "utah"],
    summary:
      "Closes the international-go-to-market gap for Utah companies — free programming on selling abroad.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "ut-irc-slc",
    title: "International Rescue Committee — Salt Lake City",
    description:
      "IRC's Salt Lake office helps refugees and immigrants resettling in Utah with employment, English-language training, and small-business support.",
    kind: "link",
    url: "https://www.rescue.org/united-states/salt-lake-city-ut",
    tags: ["refugee", "immigrant", "career", "free", "slc"],
    summary:
      "Closes the resettlement-to-employment gap for Utah's refugee community — direct path from arrival into the local job market.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-05-08T00:00:00.000Z",
  },
];
