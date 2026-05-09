import type {
  Availability,
  Compensation,
  FundingStatus,
  Network,
  Origin,
  Sector,
  Stage,
  StartupDTO,
  StartupNeed,
  TalentCategory,
  TalentDTO,
} from "./types";

/**
 * Extra batch of 300 procedurally-built candidate personas. Same shape as
 * `LIVE_TALENT` in `live-seed.ts` — kept in a separate file so the curated
 * hand-written set stays readable. Loaded by `/api/admin/seed-live`.
 *
 * IDs occupy the `…100000000100` → `…100000000399` block so they don't
 * collide with the curated 36 in `live-seed.ts` (which use 001-036).
 *
 * Tier A — idx 0-99: original curated archetype distribution.
 * Tier B — idx 100-199: expanded skill catalog (broad generalist stacks plus
 *          niche specialist bundles), ~40% ship without a photo.
 * Tier C — idx 200-299: "supercharged" — three merged skill bundles per
 *          persona drawn from an ultra-specific catalog whose terms mirror
 *          the business archetypes' one-liners and descriptions, so some
 *          candidates hit very high match scores against specific companies
 *          (e.g. an AI radiology startup or a construction-payments fintech).
 *          ~50% ship without a photo.
 */

const seedTime = "2026-05-01T12:00:00.000Z";

type Archetype = {
  category: "engineer" | "operator" | "sales" | "marketing" | "student" | "advisor" | "fractional" | "executive" | "intern";
  headlinePool: string[];
  bioPool: string[];
  lookingForPool: string[];
  categories: TalentCategory[];
  needs: StartupNeed[];
  skillsPool: string[][];
  domains: Sector[];
  availability: Availability;
  compensation: Compensation[];
  stagePrefs: Stage[];
  riskTolerance: 1 | 2 | 3 | 4 | 5;
  networks: Network[];
};

const FIRST_NAMES = [
  "Alex", "Maya", "Jordan", "Riley", "Taylor", "Morgan", "Casey", "Jamie",
  "Avery", "Quinn", "Harper", "Rowan", "Sage", "River", "Skyler", "Reese",
  "Kai", "Noor", "Aarav", "Diego", "Sofia", "Lucas", "Mia", "Ethan",
  "Liam", "Olivia", "Noah", "Emma", "Mason", "Ava", "Logan", "Isabella",
  "James", "Sophia", "Benjamin", "Charlotte", "Elijah", "Amelia", "Henry", "Evelyn",
  "Sebastian", "Abigail", "Owen", "Emily", "Caleb", "Madison", "Wyatt", "Scarlett",
  "Nolan", "Layla", "Asher", "Camila", "Levi", "Aria", "Theo", "Zoe",
  "Mateo", "Penelope", "Aiden", "Stella", "Leo", "Lila", "Felix", "Iris",
  "Hugo", "Nora", "Silas", "Luna", "Miles", "Ruby", "Dante", "Hazel",
  "Omar", "Naomi", "Yusuf", "Anya", "Idris", "Maya", "Kenji", "Rin",
  "Hana", "Wren", "Soren", "Imani", "Cyrus", "Esme", "Bodhi", "Talia",
  "Rafael", "Lina", "Niko", "Saige", "Amir", "Vera", "Jonas", "Cleo",
  "Tariq", "Maren", "Indra", "Beatrix", "Otis", "Juniper",
];

const LAST_NAMES = [
  "Harris", "Nguyen", "Patel", "Cohen", "Rivera", "Brooks", "Reyes", "Park",
  "Thompson", "Walker", "Khan", "Anderson", "Wright", "Scott", "Sanders", "Mitchell",
  "Cruz", "Hughes", "Morales", "Foster", "Hayes", "Kim", "Lee", "Russell",
  "Bennett", "Coleman", "Powell", "Jenkins", "Long", "Patterson", "Hughes", "Flores",
  "Washington", "Butler", "Simmons", "Foster", "Bryant", "Alexander", "Russell", "Griffin",
  "Diaz", "Hayes", "Myers", "Ford", "Hamilton", "Graham", "Sullivan", "Wallace",
  "Woods", "Cole", "West", "Jordan", "Owens", "Reynolds", "Fisher", "Ellis",
  "Harrison", "Gibson", "McDonald", "Cruz", "Marshall", "Ortiz", "Gomez", "Murray",
  "Freeman", "Wells", "Webb", "Simpson", "Stevens", "Tucker", "Porter", "Hunter",
  "Hicks", "Crawford", "Henry", "Boyd", "Mason", "Morales", "Kennedy", "Warren",
  "Dixon", "Ramos", "Reyes", "Burns", "Gordon", "Shaw", "Holmes", "Rice",
  "Robertson", "Hunt", "Black", "Daniels", "Palmer", "Mills", "Nichols", "Grant",
  "Knight", "Ferguson", "Rose", "Stone",
];

const LOCATIONS = [
  "Salt Lake City, UT",
  "Lehi, UT",
  "Provo, UT",
  "Park City, UT",
  "Ogden, UT",
  "Logan, UT",
  "Draper, UT",
  "South Jordan, UT",
  "Sandy, UT",
  "Cedar City, UT",
  "St. George, UT",
];

const ORG_BUNDLES: string[][] = [
  ["org-uu"],
  ["org-uu", "org-utto"],
  ["org-byu", "org-byutto"],
  ["org-byu", "org-byualum"],
  ["org-usu"],
  ["org-uu", "org-uea"],
  ["org-pelion"],
  ["org-pyc"],
  ["org-bw"],
  ["org-uu", "org-pelion"],
];

const ARCHETYPES: Archetype[] = [
  {
    category: "engineer",
    headlinePool: [
      "Full-stack engineer · ex-Series-B fintech",
      "Backend engineer · distributed systems",
      "Frontend engineer · design-systems lead",
      "Mobile engineer · iOS · ex-consumer",
      "Platform engineer · ex-cloud infra",
      "Data engineer · streaming pipelines",
    ],
    bioPool: [
      "Ten years shipping production systems. Want to be employee #1 or #2 at a Utah startup where I own the codebase and don't need to ask permission to refactor.",
      "Spent the last six years on infra at high-growth companies. Looking to trade scope-of-system for scope-of-decision and join a small team where I can shape the foundation.",
      "Strong opinions about boring stack choices. Have shipped ML, payments, and CRUD; happy to be the generalist who keeps the lights on while founders sell.",
      "Tired of optimizing dashboards 0.3% at a time. Want to work on something where the bottleneck is figuring out what to build, not yet another A/B test.",
    ],
    lookingForPool: [
      "Founding engineer at a seed-stage Utah startup. Equity-heavy is fine if the founders are credible and the product is real.",
      "Tech-lead role at Series A — somewhere I can hire 2-3 engineers under me and own a product surface end-to-end.",
      "Senior engineer at pre-seed / seed. I'd rather wear five hats than be a cog at a Series C.",
    ],
    categories: ["engineer", "operator"],
    needs: ["engineer", "cofounder"],
    skillsPool: [
      ["typescript", "react", "postgres", "aws"],
      ["go", "kubernetes", "distributed-systems", "observability"],
      ["python", "ml-infra", "data-pipelines", "snowflake"],
      ["swift", "objective-c", "ios", "core-data"],
      ["rust", "wasm", "systems-programming"],
      ["next.js", "tailwind", "design-systems", "typescript"],
    ],
    domains: ["software", "ai", "fintech"],
    availability: "full-time",
    compensation: ["cash", "equity"],
    stagePrefs: ["pre-seed", "seed", "series-a"],
    riskTolerance: 4,
    networks: ["operator"],
  },
  {
    category: "operator",
    headlinePool: [
      "Operator · ex-COO at logistics SaaS",
      "Two-time operator · BizOps and finance",
      "Generalist operator · ex-McKinsey",
      "Ops lead · ex-marketplace startup",
    ],
    bioPool: [
      "I'm the person founders hire when the spreadsheet sprawl is killing them. Built ops, hiring, and finance functions from zero at two seed-to-Series-B companies.",
      "Seven years bridging product, finance, and people. Strong at the un-glamorous middle layer — billing, comp bands, vendor contracts, the stuff that breaks at 30 employees.",
      "Generalist who is happiest at chaos points: 5→25 employees, pre-Series-A → Series-B. Want to do that one more time.",
    ],
    lookingForPool: [
      "Chief of staff or COO #1 at a seed/Series-A startup. Not interested in a director-of-ops slot at scale.",
      "Founding ops role — the person who sets up payroll, picks the CRM, and writes the first employee handbook.",
    ],
    categories: ["operator", "coo", "executive"],
    needs: ["operator", "coo", "executive"],
    skillsPool: [
      ["bizops", "finance", "fp&a", "vendor-management"],
      ["operations", "people-ops", "hiring", "comp-bands"],
      ["bizops", "go-to-market", "process-design", "tooling"],
    ],
    domains: ["software", "fintech", "ai"],
    availability: "full-time",
    compensation: ["cash", "equity"],
    stagePrefs: ["seed", "series-a"],
    riskTolerance: 4,
    networks: ["operator"],
  },
  {
    category: "sales",
    headlinePool: [
      "Enterprise AE · seven years at SaaS scale-ups",
      "Founding AE · two seed-stage exits",
      "Sales leader · built three pipelines from scratch",
    ],
    bioPool: [
      "Closed $4M+ ARR at two early-stage companies as the first AE. I write my own playbook, build my own pipeline, and don't need a marketing team to make a quarter.",
      "Eight years selling six-figure deals to operations and IT buyers. I want to take what I've learned to a Utah company where I can build out the function, not just hit a quota.",
      "Sales leader looking for an early-stage product I actually believe in. Burned out on selling vapor; want a real wedge and a real ICP.",
    ],
    lookingForPool: [
      "Founding AE or first sales hire at a B2B startup with a working wedge and ~$200K ARR proof.",
      "VP Sales role at a seed → Series-A B2B SaaS. Open to advisor relationships during diligence.",
    ],
    categories: ["sales", "executive"],
    needs: ["sales", "executive"],
    skillsPool: [
      ["enterprise-sales", "outbound", "discovery", "negotiation"],
      ["pipeline-build", "ramp-design", "deal-strategy"],
      ["mid-market-sales", "land-and-expand", "saas-pricing"],
    ],
    domains: ["software", "fintech"],
    availability: "full-time",
    compensation: ["cash", "equity"],
    stagePrefs: ["seed", "series-a"],
    riskTolerance: 3,
    networks: ["operator"],
  },
  {
    category: "marketing",
    headlinePool: [
      "Brand & content marketer · early-stage SaaS",
      "Demand-gen marketer · paid + lifecycle",
      "Product marketer · ex-developer-tools",
    ],
    bioPool: [
      "Five years building marketing functions at two seed-stage SaaS companies. Comfortable being a one-person team and hiring my own replacement once we hit Series A.",
      "Strong at the messaging-and-positioning side of marketing. I'm the person who rewrites the homepage so it actually says what the product does.",
      "Performance-marketing background — paid, lifecycle, attribution. Tired of working on B2C; want to apply the same playbook to a focused B2B audience.",
    ],
    lookingForPool: [
      "Head of marketing role at a seed / Series-A startup, ideally B2B vertical SaaS or developer tools.",
      "Founding marketer at a pre-seed / seed company with a strong product and no positioning.",
    ],
    categories: ["marketing"],
    needs: ["marketing"],
    skillsPool: [
      ["positioning", "content", "brand", "product-marketing"],
      ["paid-acquisition", "lifecycle", "analytics", "attribution"],
      ["developer-marketing", "docs", "DX-content"],
    ],
    domains: ["software", "fintech", "ai"],
    availability: "full-time",
    compensation: ["cash", "equity"],
    stagePrefs: ["pre-seed", "seed", "series-a"],
    riskTolerance: 3,
    networks: ["operator"],
  },
  {
    category: "student",
    headlinePool: [
      "BS Computer Science, U of U · senior",
      "MS Mechanical Engineering, BYU · graduating",
      "PhD candidate, USU · materials science",
      "BS Bioengineering, U of U · junior",
      "MS Data Science, U of U · graduating",
    ],
    bioPool: [
      "Senior at the U with two internships under my belt. Want to start a career at a Utah startup where I can wear multiple hats — not a rotational program at a big company.",
      "Graduating from BYU's mechanical program. Done two co-ops in additive manufacturing. Looking for an early-stage hardware or robotics team.",
      "PhD candidate — three published papers in my domain — but I want to ship product, not write more papers. Looking for an applied research / engineer role at a deep-tech spinout.",
      "Junior in bioengineering at the U. Strong wet-lab and Python skills. Looking for a summer internship that could turn into a return offer.",
    ],
    lookingForPool: [
      "Junior engineer or research-engineer role at a Utah deep-tech / SaaS company. Open to internship-to-full-time.",
      "Summer internship at a Utah startup; convertible to full-time after graduation.",
      "Founding-engineer or applied-research role at a deep-tech spinout coming out of a U-of-U or BYU lab.",
    ],
    categories: ["student", "intern", "engineer"],
    needs: ["student", "intern", "engineer"],
    skillsPool: [
      ["python", "javascript", "git", "data-structures"],
      ["solidworks", "matlab", "additive-manufacturing", "cad"],
      ["materials-science", "characterization", "matlab"],
      ["wet-lab", "microfluidics", "python", "bioinformatics"],
      ["python", "pytorch", "data-engineering", "sql"],
    ],
    domains: ["software", "advanced-manufacturing", "life-sciences", "ai"],
    availability: "internship",
    compensation: ["cash"],
    stagePrefs: ["seed", "series-a"],
    riskTolerance: 3,
    networks: ["operator"],
  },
  {
    category: "intern",
    headlinePool: [
      "Sophomore CS · looking for a summer internship",
      "Junior business analytics · ops internship",
      "Sophomore EE · embedded-systems intern",
    ],
    bioPool: [
      "Sophomore in CS at the U. Strong fundamentals, two side projects shipped, looking for an internship at a startup small enough that I get real work.",
      "Junior at BYU studying business analytics. Want to spend a summer doing operations or BizOps at an early-stage Utah company.",
      "Sophomore EE student at USU. Built two embedded projects (RTOS-based) and want to apply that on a real product team.",
    ],
    lookingForPool: [
      "Engineering or BizOps internship at a Utah startup. Comfortable being thrown into the deep end.",
      "Summer internship — anywhere from pre-seed to Series-A. I'd rather have scope than salary.",
    ],
    categories: ["intern", "student"],
    needs: ["intern", "student"],
    skillsPool: [
      ["python", "git", "react"],
      ["sql", "excel", "tableau", "ops-analytics"],
      ["c", "embedded", "rtos", "kicad"],
    ],
    domains: ["software", "advanced-manufacturing"],
    availability: "internship",
    compensation: ["cash"],
    stagePrefs: ["seed", "series-a"],
    riskTolerance: 2,
    networks: ["operator"],
  },
  {
    category: "advisor",
    headlinePool: [
      "Two-time founder · advisor / angel",
      "Ex-VP Engineering · advising 4 startups",
      "Ex-CMO · advisor + early-stage angel",
    ],
    bioPool: [
      "Founded and exited two SaaS companies (one acquihire, one $30M acquisition). Now advising a handful of Utah teams; have room for one more board seat.",
      "Twenty years in engineering leadership at two unicorns. Now advise founders on hiring engineers #1-#5 and avoiding the obvious infra mistakes.",
      "Marketing leader through three Series-B/C scale-ups. Advise on positioning, hiring the first marketer, and when not to hire one yet.",
    ],
    lookingForPool: [
      "One more board-advisor seat at a seed-stage Utah company building something I'd care about as a customer.",
      "Hands-on advisor relationship (4-6 hours / month) with a pre-seed / seed founder I can learn from.",
      "Angel-investor + advisor role at the seed stage. Cheque size $25-50K.",
    ],
    categories: ["advisor-paid", "board-member", "mentor-free"],
    needs: ["advisor-paid", "board-member"],
    skillsPool: [
      ["fundraising", "board-management", "exec-coaching"],
      ["engineering-management", "infra", "hiring"],
      ["positioning", "early-stage-marketing", "narrative"],
    ],
    domains: ["software", "fintech", "ai", "life-sciences"],
    availability: "advisory",
    compensation: ["cash", "equity", "mentor"],
    stagePrefs: ["pre-seed", "seed", "series-a"],
    riskTolerance: 4,
    networks: ["mentor", "sme-advisory"],
  },
  {
    category: "fractional",
    headlinePool: [
      "Fractional CFO · two days a week",
      "Fractional Head of People · seed-stage specialist",
      "Fractional designer · brand + product",
    ],
    bioPool: [
      "Run a fractional CFO practice — work with five to seven Utah seed/Series-A companies at a time. Help with fundraising, pricing, and the first finance hire.",
      "Fractional people-ops lead. Spent eight years building HR and recruiting functions at scale; now I do this for early-stage teams who can't justify a full-time hire yet.",
      "Solo design consultant. Brand systems and product UI for seed-stage SaaS — six week to twelve week engagements. Not interested in retainer for retainer's sake.",
    ],
    lookingForPool: [
      "Two-to-four fractional engagements at Utah seed-stage companies, billable at a clear day-rate.",
      "Fractional engagement (8-16 hours / month) with a Utah startup raising or about-to-raise.",
    ],
    categories: ["fractional"],
    needs: ["fractional"],
    skillsPool: [
      ["fp&a", "cap-table", "financial-modeling", "fundraising"],
      ["recruiting", "compensation", "performance-management"],
      ["brand-design", "product-design", "design-systems"],
    ],
    domains: ["software", "fintech", "ai"],
    availability: "fractional",
    compensation: ["cash", "equity"],
    stagePrefs: ["pre-seed", "seed", "series-a"],
    riskTolerance: 3,
    networks: ["service-provider"],
  },
  {
    category: "executive",
    headlinePool: [
      "Two-time CEO · seed → Series-B",
      "Ex-CTO · life-sciences software",
      "Ex-CRO · enterprise SaaS",
    ],
    bioPool: [
      "Founded and ran two B2B SaaS companies. Last one sold to a strategic in 2024. Looking for what's next — open to founder-CEO at a deep-tech spinout where the science is the moat.",
      "Spent ten years as CTO at a life-sciences software company. Have shipped through FDA — comfortable in regulated environments, which not many software CTOs are.",
      "Built and ran the revenue org at a Series-B SaaS company through a 4× growth window. Looking for one more exec seat at a Series-A → Series-B company that needs that playbook.",
    ],
    lookingForPool: [
      "CEO seat at a deep-tech spinout coming out of U-of-U or BYU. Open to a meaningful equity grant + a real cash component.",
      "CTO role at a Series-A life-sciences software company.",
      "CRO role at a Series-A → Series-B B2B SaaS company.",
    ],
    categories: ["executive", "cofounder"],
    needs: ["executive", "cofounder"],
    skillsPool: [
      ["fundraising", "ceo", "go-to-market", "exec-leadership"],
      ["cto", "regulated-software", "fda", "platform-engineering"],
      ["sales-leadership", "rev-ops", "exec-leadership"],
    ],
    domains: ["software", "life-sciences", "ai", "fintech"],
    availability: "full-time",
    compensation: ["cash", "equity"],
    stagePrefs: ["seed", "series-a", "series-b"],
    riskTolerance: 4,
    networks: ["operator", "venture"],
  },
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

// ── Per-candidate variation pools ─────────────────────────────────────────
//
// Without these, every candidate that lands on the same archetype + bioPool
// + lookingForPool slot gets a byte-identical embedding_wants_text → the
// `embedding_wants` vector is identical → cos(cand.wants, viewer.profile)
// is the same number for every member of that group, which collapses the
// match-score distribution to a single value (the original 77.6% bug).
//
// We append a per-candidate "specifics" sentence to lookingFor and a
// "flavor" tail to bio. Each draws from a 7-15 entry pool with a different
// idx multiplier, so the pools desynchronize and give every candidate a
// distinct cosine fingerprint.

const COMP_HOOKS = [
  "cash-heavy with a real equity component",
  "equity-heavy if the founders are credible",
  "balanced cash and equity with a 4-year vest",
  "low-cash, high-equity if the wedge is real",
  "market-rate cash with a meaningful grant",
  "below-market cash + double-digit founding equity",
  "deferred cash + early-employee option grant",
  "advisor-style equity-only with a 12-month cliff",
];

const TIMELINE_HOOKS = [
  "Available immediately.",
  "Looking to start in the next 60 days.",
  "Open to a Q3 start once I wrap a current engagement.",
  "Graduating in May; available full-time after.",
  "Starting conversations now for a January start.",
  "Could start in two weeks for the right team.",
  "Have a 30-day notice period at my current shop.",
  "Open to fractional now → full-time after diligence.",
];

const RISK_HOOKS = [
  "Comfortable with pre-revenue chaos.",
  "Want a working wedge before joining.",
  "Need to see real customer signal — no pure science projects.",
  "Open to deep-tech / regulated paths even when timelines are long.",
  "Prefer companies past first-customer-paid milestone.",
  "Fine being employee #1 if the founders have shipped before.",
  "Avoiding bridge rounds and zombie companies.",
];

const TONE_HOOKS = [
  "Done with kingmaker politics; want builders.",
  "Bored of optimizing for OKRs nobody believes in.",
  "Looking for a team that ships on Fridays.",
  "Want product, not deck-driven storytelling.",
  "Burned by founders who can't make a decision.",
  "Tired of being the only one who reads the dashboards.",
  "Want fewer meetings, more pull requests.",
  "Done renting attention from a brand I don't own.",
];

const TEAM_SIZE_HOOKS = [
  "Team of 3-8 ideal.",
  "Comfortable being employee #1.",
  "Open to teams up to ~15.",
  "Prefer a 5-12 person team where I see every face.",
  "Want to be the second hire in my function.",
  "Happy to build the function from zero.",
];

function deterministic<T>(arr: readonly T[], seed: number): T {
  // Spread small idx values across the pool by mixing with a prime.
  const i = Math.abs(Math.floor(seed)) % arr.length;
  return arr[i];
}

function buildLookingForSpecifics(
  idx: number,
  arch: Archetype,
  location: string,
): string {
  const stage = deterministic<string>(arch.stagePrefs, idx * 3 + 1);
  const domain = deterministic<string>(arch.domains, idx * 5 + 7);
  const compHook = deterministic(COMP_HOOKS, idx * 7 + 11);
  const timeline = deterministic(TIMELINE_HOOKS, idx * 11 + 13);
  const risk = deterministic(RISK_HOOKS, idx * 13 + 17);
  const teamSize = deterministic(TEAM_SIZE_HOOKS, idx * 19 + 23);
  const city = location.split(",")[0]?.trim() ?? location;
  return `Specifically a ${stage} ${domain} team based in ${city} or hiring there. ${teamSize} ${timeline} ${risk} Comp shape: ${compHook}.`;
}

function buildBioFlavor(idx: number, location: string): string {
  const tone = deterministic(TONE_HOOKS, idx * 17 + 5);
  const city = location.split(",")[0]?.trim() ?? location;
  return ` Based in ${city}. ${tone}`;
}

// Expanded skill catalog used for idx >= 100. Mixes broad generalist stacks
// with niche/specialist bundles so the second batch of personas reads as a
// realistically diverse talent pool — some T-shaped, some hyper-specific.
type ArchCategory = Archetype["category"];

const EXPANDED_SKILL_BUNDLES: Record<ArchCategory, string[][]> = {
  engineer: [
    ["typescript", "react", "next.js", "tailwind", "tRPC", "postgres", "redis", "graphql", "websockets", "stripe-billing"],
    ["go", "kubernetes", "kafka", "grpc", "etcd", "envoy", "service-mesh", "distributed-tracing", "chaos-engineering"],
    ["rust", "tokio", "wasm", "axum", "no-std", "embedded-rust", "zerocopy", "wgpu"],
    ["python", "pytorch", "jax", "triton", "vllm", "ray", "dask", "spark", "airflow", "dbt", "snowflake", "duckdb"],
    ["swift", "swiftui", "core-ml", "metal", "arkit", "watch-os", "ios", "objective-c"],
    ["c++", "real-time", "lock-free", "simd", "openmp", "cuda", "vulkan", "shaders", "ray-tracing"],
    ["postgres", "row-level-security", "logical-replication", "pgvector", "citus", "patroni", "wal-g", "explain-analyze"],
    ["solidity", "foundry", "anchor", "halo2", "evm-internals", "account-abstraction", "mev-aware"],
    ["embedded-firmware", "stm32", "freertos", "zephyr", "can-bus", "modbus", "ble", "lora"],
    ["data-engineering", "apache-iceberg", "delta-lake", "trino", "fivetran", "airbyte", "snowflake", "dbt"],
    ["security-engineering", "fuzzing", "afl++", "sandboxing", "ebpf", "selinux", "capabilities", "binary-analysis"],
    ["graphics", "three.js", "shadertoy", "compute-shaders", "real-time-rendering", "houdini-vex"],
    ["full-stack-generalist", "scrappy-mvp", "supabase", "vercel", "feature-flags", "ab-testing", "growth-experiments"],
    ["robotics-software", "ros2", "gazebo", "moveit", "slam", "sensor-fusion", "kalman-filters"],
    ["compiler-engineering", "llvm", "mlir", "type-inference", "borrow-checking", "incremental-compilation"],
    ["devops", "terraform", "pulumi", "aws-cdk", "github-actions", "argocd", "vault", "datadog", "sentry"],
    ["ml-research", "transformers", "diffusion", "rlhf", "dpo", "evals", "huggingface", "weights-and-biases"],
    ["fintech-engineering", "ledgering", "double-entry", "ach", "wire", "card-networks", "kyc-tooling", "1099-ops"],
    ["healthcare-engineering", "hl7", "fhir", "epic-integration", "hipaa", "phi-handling", "audit-logging"],
    ["site-reliability", "slo-design", "error-budgets", "postmortems", "incident-command", "runbook-automation"],
  ],
  operator: [
    ["bizops", "fp&a", "cap-table-modeling", "vendor-management", "saas-stack-rationalization", "rev-leakage-audit"],
    ["operations", "people-ops", "performance-management", "comp-bands", "pip-design", "exit-management"],
    ["bizops", "go-to-market-execution", "process-design", "tooling-selection", "playbook-authoring"],
    ["chief-of-staff", "exec-comms", "board-decks", "all-hands-design", "meeting-hygiene", "okr-rollout"],
    ["revops", "salesforce-admin", "outreach-admin", "hubspot", "lead-routing", "territory-design", "quota-modeling"],
    ["finance-leader", "audit-readiness", "asc-606", "revenue-recognition", "monthly-close", "investor-reporting"],
    ["legal-ops", "contract-redlining", "msa-templating", "data-room-curation", "privacy-program-rollout"],
    ["procurement", "sourcing", "vendor-consolidation", "saas-spend-management", "renewal-negotiation"],
    ["customer-ops", "billing-disputes", "dunning", "churn-saves", "qbrs", "renewals-playbook"],
    ["data-ops", "metric-definitions", "north-star-instrumentation", "amplitude", "mixpanel", "looker-modeling"],
  ],
  sales: [
    ["enterprise-sales", "outbound", "discovery", "champion-building", "multithreading", "mutual-action-plans"],
    ["pipeline-build", "ramp-design", "deal-strategy", "competitive-displacement", "renewal-protection"],
    ["mid-market", "land-and-expand", "saas-pricing", "value-engineering", "roi-calculators"],
    ["public-sector-sales", "sled", "gsa", "sba-set-asides", "dod-rapid-acquisition", "afwerx-pathway"],
    ["channel-sales", "partner-recruitment", "co-sell-with-aws", "co-sell-with-gcp", "isv-marketplace-listings"],
    ["sales-engineering", "discovery-demo", "poc-design", "security-questionnaires", "soc2-collateral"],
    ["technical-sales", "developer-tools-selling", "bottom-up-plg", "tier-conversion", "self-serve-to-enterprise"],
    ["healthcare-sales", "ids-buying-cycles", "rfp-responses", "value-analysis-committees"],
    ["construction-sales", "contractor-buyers", "saas-for-trades", "field-sales-rides", "trade-show-circuits"],
    ["financial-services-sales", "selling-to-banks", "selling-to-fintechs", "vendor-onboarding-cycles"],
  ],
  marketing: [
    ["positioning", "category-design", "messaging-architecture", "narrative-arcs", "win-loss-interviewing"],
    ["paid-acquisition", "google-ads", "linkedin-ads", "meta-ads", "reddit-ads", "attribution-modeling", "mmm-lite"],
    ["lifecycle", "segment", "customer-io", "onboarding-flows", "in-product-tours", "retention-experiments"],
    ["developer-marketing", "docs-as-marketing", "sample-app-libraries", "dx-content", "hackathon-sponsorship"],
    ["content-marketing", "long-form-thought-leadership", "seo-cluster-design", "newsletter-curation"],
    ["product-marketing", "launch-tier-design", "competitive-battlecards", "pricing-pages", "release-notes-as-marketing"],
    ["brand", "visual-identity", "tone-of-voice-rewrites", "design-system-for-brand", "swag-program-curation"],
    ["community-led-growth", "discord-ops", "user-group-curation", "ambassador-programs"],
    ["events", "field-marketing", "user-conferences", "executive-roundtables", "sponsor-economics"],
    ["analyst-relations", "gartner-briefings", "forrester-waves", "idc-marketscapes", "category-validation"],
  ],
  student: [
    ["python", "javascript", "git", "data-structures", "algorithms", "leetcode-grinder", "competitive-programming"],
    ["solidworks", "matlab", "additive-manufacturing", "cad", "fea-analysis", "tolerance-stack-ups"],
    ["materials-science", "characterization", "tem-imaging", "xrd", "afm", "rheometry", "matlab"],
    ["wet-lab", "microfluidics", "plate-reader-automation", "pcr", "western-blot", "python-for-bio", "bioinformatics"],
    ["python", "pytorch", "data-engineering", "sql", "tableau", "jupyter", "scikit-learn", "kaggle-experience"],
    ["robotics", "ros2", "gazebo", "arduino", "raspberry-pi", "computer-vision", "openCV", "yolo-finetuning"],
    ["embedded", "stm32", "freertos", "kicad", "altium", "soldering", "oscilloscope-debugging"],
    ["aerospace-engineering", "ansys-fluent", "openfoam", "trajectory-optimization", "rocket-propulsion-fundamentals"],
    ["chemical-engineering", "process-simulation", "aspen-plus", "reactor-design", "thermodynamics-cycles"],
    ["civil-engineering", "structural-analysis", "etabs", "revit-bim", "site-survey-tooling"],
    ["product-design-student", "figma", "user-research", "rapid-prototyping", "service-blueprints"],
    ["data-journalism", "scrapy", "pandas", "ggplot", "investigative-foia-process"],
  ],
  intern: [
    ["python", "git", "react", "tailwind", "vite", "vercel-deploys", "feature-flagging-basics"],
    ["sql", "excel-power-query", "tableau", "ops-analytics", "looker-explore-building"],
    ["c", "embedded", "rtos", "kicad", "circuit-bring-up", "i2c-debugging"],
    ["go", "rest-api-stubbing", "test-fixtures", "container-builds", "github-actions-basics"],
    ["javascript", "node", "next.js-pages-router", "supabase-quickstart", "stripe-checkout-integration"],
    ["product-management-intern", "competitive-teardowns", "user-interview-notes", "spec-drafting"],
    ["growth-intern", "cold-outbound-templates", "linkedin-sequencing", "hubspot-data-cleanup"],
  ],
  advisor: [
    ["fundraising", "board-management", "exec-coaching", "ceo-onboarding", "first-investor-update"],
    ["engineering-management", "hiring-engineers-1-to-5", "tech-debt-triage", "first-incident-process"],
    ["positioning", "early-stage-marketing", "narrative-clarity", "pitch-deck-surgery"],
    ["public-company-readiness", "audit-committee", "sox-readiness", "s1-narrative", "ipo-roadshow"],
    ["m&a-advisory", "buyer-mapping", "lou-negotiation", "diligence-prep", "earn-out-structuring"],
    ["regulatory-strategy", "fda-pre-submission", "510k-pathway", "de-novo-classification", "qsr-readiness"],
    ["dod-sbir-strategy", "phase-i-to-phase-iii", "topa-pathway", "afwerx-strategy", "ngad-supplier-pathway"],
    ["go-to-market-coaching", "icp-clarity", "first-three-customers-playbook", "pricing-tiering"],
  ],
  fractional: [
    ["fp&a", "cap-table", "financial-modeling", "fundraising-support", "first-cfo-pre-hire-coverage"],
    ["recruiting", "compensation-bands", "performance-management-rollout", "people-ops-bootstrap"],
    ["brand-design", "product-design", "design-systems", "marketing-website-overhaul"],
    ["fractional-cto", "stack-selection", "first-engineer-hire", "code-review-cadence", "infra-rationalization"],
    ["fractional-cmo", "first-marketer-spec", "agency-vetting", "media-mix-design", "seo-foundation"],
    ["fractional-controller", "monthly-close", "ar-aging-cleanup", "ap-process-rollout", "audit-prep"],
    ["fractional-general-counsel", "msa-template-library", "privacy-program-bootstrap", "ip-assignment-cleanup"],
    ["fractional-data-lead", "warehouse-bootstrap", "first-metric-definitions", "instrumentation-rollout"],
  ],
  executive: [
    ["fundraising", "ceo", "go-to-market", "exec-leadership", "board-management", "investor-relations"],
    ["cto", "regulated-software", "fda", "platform-engineering", "ml-platform-leadership"],
    ["sales-leadership", "rev-ops", "exec-leadership", "vp-sales-playbook", "seg-coverage-design"],
    ["coo", "ops-scaling", "5-to-50-headcount", "international-expansion-playbook"],
    ["chief-product-officer", "category-strategy", "platform-pricing", "ecosystem-strategy"],
    ["chief-revenue-officer", "go-to-market-overhaul", "channel-design", "pricing-overhaul", "annual-planning"],
    ["chief-medical-officer", "kol-network", "clinical-evidence-strategy", "label-expansion-strategy"],
    ["chief-people-officer", "exec-team-formation", "leadership-development", "succession-planning"],
  ],
};

function buildOne(idx: number): TalentDTO {
  const arch = pick(ARCHETYPES, idx);
  const first = pick(FIRST_NAMES, idx * 7 + 3);
  const last = pick(LAST_NAMES, idx * 11 + 5);
  const name = `${first} ${last}`;
  const slug = `${first}.${last}`.toLowerCase().replace(/[^a-z0-9.]/g, "");

  const num = String(100 + idx).padStart(12, "0");
  const id = `11111111-1111-4111-8111-${num}`;

  const headline = pick(arch.headlinePool, idx);
  let bio = pick(arch.bioPool, idx);
  let lookingFor = pick(arch.lookingForPool, idx);
  const location = pick(LOCATIONS, idx);
  const utahOrgIds = pick(ORG_BUNDLES, idx);

  const isExtended = idx >= 100;

  if (isExtended) {
    // Pull two skill bundles from the expanded catalog and weave them into
    // the bio. Mixing two yields the "broad + specific" feel — e.g. a backend
    // engineer who also has fintech-engineering or a marketer who also runs
    // analyst relations.
    const bundles = EXPANDED_SKILL_BUNDLES[arch.category] ?? [];
    if (bundles.length > 0) {
      const a = pick(bundles, idx * 3 + 1);
      const b = pick(bundles, idx * 5 + 7);
      const merged = Array.from(new Set([...a, ...b]));
      bio = `${bio} Skills: ${merged.join(", ")}.`;
    }
  }

  // Per-candidate variation. Without this every candidate that maps onto the
  // same arch + bioPool slot ends up with byte-identical lookingFor text →
  // identical wants vectors → identical match scores. The deterministic
  // helpers below yield a unique sentence per `idx` while still respecting
  // the archetype's allowed stages / domains / comp.
  bio = `${bio}${buildBioFlavor(idx, location)}`;
  lookingFor = `${lookingFor} ${buildLookingForSpecifics(idx, arch, location)}`;

  // ~40% of the new batch (idx >= 100) ship with no profile photo to mimic
  // realistic onboarding gaps. Existing 100 keep their pravatar URL so the
  // curated demo doesn't regress.
  const omitPhoto = isExtended && (idx * 17) % 10 < 4;
  const photoIdx = ((idx * 13) % 70) + 1;
  const photoUrl = omitPhoto ? undefined : `https://i.pravatar.cc/240?img=${photoIdx}`;

  return {
    id,
    name,
    email: `${slug}+seed${idx}@nucleus.demo`,
    headline,
    bio,
    lookingFor,
    categories: arch.categories,
    lookingForNeeds: arch.needs,
    domains: arch.domains,
    availability: arch.availability,
    compensation: arch.compensation,
    stagePrefs: arch.stagePrefs,
    riskTolerance: arch.riskTolerance,
    location,
    utahOrgIds,
    networks: arch.networks,
    photoUrl,
    linkedinUrl: `https://linkedin.com/in/${slug}-demo`,
    createdAt: seedTime,
  };
}

// ── Tier C — 100 supercharged candidates, idx 200-299 ─────────────────────
//
// Each candidate explicitly mirrors a single curated business archetype so
// the bidirectional embedding cosine (the `min` of viewerWantsCand and
// candWantsViewer) clears 0.4 raw → > 70% normalized. Three skill bundles
// stacked (15-30 skills/persona). ~50% ship without a profile photo to
// reflect real onboarding gaps.

type TierCRoleVariant = {
  /** Headline prefix, e.g. "Founding ML engineer". Combined with target tag. */
  rolePrefix: string;
  /** Candidate-side category list. */
  categories: TalentCategory[];
  /** Roles this candidate is looking to fill. */
  needs: StartupNeed[];
  /** Availability + comp + risk tilt by role variant. */
  availability: Availability;
  compensation: Compensation[];
  riskTolerance: 1 | 2 | 3 | 4 | 5;
  /** Networks this candidate sits in (must overlap with target.networks). */
  networks: Network[];
  /** A short context sentence for the bio. */
  bioContext: string;
  /** Three skill bundles (stacked → 15-30 unique tokens). */
  skillBundles: string[][];
};

type TierCTarget = {
  /** Verbatim one-liner from the curated business this persona is shaped to. */
  oneLiner: string;
  /** Sector tag — must align with the business `sector`. */
  sector: Sector;
  /** Stage the candidate is targeting — must align with business funding stage. */
  stagePrefs: Stage[];
  /** Domain-of-interest hints used in `domains` and bio prose. */
  domains: Sector[];
  /** Networks the target business pulls from — candidate sits in at least one. */
  networks: Network[];
  /** Sector keywords used to spice the bio + lookingFor copy. */
  keywords: string[];
};

const TIER_C_TARGETS: TierCTarget[] = [
  {
    oneLiner: "Cardiology decision support that lives inside Epic",
    sector: "life-sciences",
    stagePrefs: ["seed", "series-a"],
    domains: ["life-sciences", "ai", "software"],
    networks: ["operator", "sme-advisory", "venture"],
    keywords: ["cardiology", "Epic SMART-on-FHIR", "AHA guidelines", "FDA 510(k)", "clinical decision support"],
  },
  {
    oneLiner: "Microfluidic point-of-care diagnostics for sepsis",
    sector: "life-sciences",
    stagePrefs: ["seed"],
    domains: ["life-sciences"],
    networks: ["operator", "sme-advisory", "service-provider"],
    keywords: ["microfluidics", "sepsis", "bloodstream infection", "point-of-care", "U of U bioengineering"],
  },
  {
    oneLiner: "Customer-conversation analytics for vertical SaaS",
    sector: "software",
    stagePrefs: ["seed", "series-a"],
    domains: ["software", "ai"],
    networks: ["operator", "venture"],
    keywords: ["call recording analytics", "conversation intelligence", "vertical SaaS", "retention", "Gong alternative"],
  },
  {
    oneLiner: "Autonomous haul trucks for open-pit mining",
    sector: "advanced-manufacturing",
    stagePrefs: ["series-a"],
    domains: ["advanced-manufacturing", "ai"],
    networks: ["operator", "venture"],
    keywords: ["autonomy stack", "mining haul trucks", "Tooele County", "lithium", "rare-earths", "off-road autonomy"],
  },
  {
    oneLiner: "Continuous SOC 2 / ISO automation for mid-market",
    sector: "cyber",
    stagePrefs: ["seed"],
    domains: ["cyber", "software"],
    networks: ["operator", "mentor"],
    keywords: ["SOC 2", "ISO 27001", "compliance automation", "Drata alternative", "mid-market security"],
  },
  {
    oneLiner: "Low-temperature solar-cell deposition",
    sector: "energy",
    stagePrefs: ["pre-seed", "seed"],
    domains: ["energy", "advanced-manufacturing"],
    networks: ["operator", "venture", "sme-advisory"],
    keywords: ["perovskite photovoltaics", "vapor-phase deposition", "flexible substrates", "USU spinout"],
  },
  {
    oneLiner: "Virtual power plant for residential batteries",
    sector: "energy",
    stagePrefs: ["seed", "series-a"],
    domains: ["energy", "software"],
    networks: ["operator", "venture", "sme-advisory"],
    keywords: ["virtual power plant", "residential batteries", "wholesale dispatch", "Rocky Mountain Power", "VPP"],
  },
  {
    oneLiner: "Mineralization-based carbon removal in basalt deposits",
    sector: "energy",
    stagePrefs: ["pre-seed", "seed"],
    domains: ["energy"],
    networks: ["operator", "venture", "sme-advisory"],
    keywords: ["carbon removal", "basalt mineralization", "Frontier", "Stripe carbon credits", "CO2 injection"],
  },
  {
    oneLiner: "Solid-rocket motor manufacturing for small launch + defense",
    sector: "advanced-manufacturing",
    stagePrefs: ["series-a"],
    domains: ["advanced-manufacturing", "defense-aerospace"],
    networks: ["operator", "sme-advisory", "venture"],
    keywords: ["solid-propellant", "tactical missiles", "small-launch upper stage", "AFRL", "ITAR"],
  },
  {
    oneLiner: "AI tutor for high-school math, embedded in Chromebooks",
    sector: "software",
    stagePrefs: ["seed"],
    domains: ["software", "ai"],
    networks: ["operator", "mentor", "sme-advisory"],
    keywords: ["AI tutor", "high-school math", "Chromebook fleet", "school districts", "K-12"],
  },
  {
    oneLiner: "Workforce-AI upskilling for the trades",
    sector: "software",
    stagePrefs: ["seed"],
    domains: ["software", "ai"],
    networks: ["operator"],
    keywords: ["AI coaching", "HVAC", "welding", "electrical apprenticeships", "workforce upskilling"],
  },
  {
    oneLiner: "AI dock-scheduling for mid-market 3PLs",
    sector: "software",
    stagePrefs: ["seed"],
    domains: ["software", "advanced-manufacturing"],
    networks: ["operator"],
    keywords: ["dock scheduling", "3PL", "WMS", "TMS", "carrier mix optimization"],
  },
  {
    oneLiner: "Resident-experience software for multifamily managers",
    sector: "software",
    stagePrefs: ["pre-seed", "seed"],
    domains: ["software"],
    networks: ["operator", "venture"],
    keywords: ["multifamily", "property management", "resident experience", "leasing", "renewals"],
  },
  {
    oneLiner: "AI-native MGA for small-business cyber insurance",
    sector: "fintech",
    stagePrefs: ["series-a"],
    domains: ["fintech", "cyber", "ai"],
    networks: ["operator", "sme-advisory", "venture"],
    keywords: ["MGA", "cyber liability", "small commercial", "Lloyd's syndicate", "real-time exposure"],
  },
  {
    oneLiner: "Preview environments for full-stack monorepos",
    sector: "software",
    stagePrefs: ["seed"],
    domains: ["software"],
    networks: ["operator"],
    keywords: ["preview environments", "monorepo", "ephemeral DBs", "PR previews", "platform engineering"],
  },
  {
    oneLiner: "Open-core observability for ML pipelines",
    sector: "software",
    stagePrefs: ["seed"],
    domains: ["software", "ai"],
    networks: ["operator", "venture"],
    keywords: ["observability", "ML training", "inference traces", "open-core", "OpenTelemetry"],
  },
  {
    oneLiner: "Quantum-magnetometer-based navigation for GPS-denied operations",
    sector: "advanced-manufacturing",
    stagePrefs: ["pre-seed", "seed"],
    domains: ["advanced-manufacturing", "defense-aerospace"],
    networks: ["operator", "venture", "sme-advisory"],
    keywords: ["quantum magnetometer", "GPS-denied navigation", "DoD primes", "trapped-ion sensing", "SBIR"],
  },
  {
    oneLiner: "Inventory-counting robots for distribution centers",
    sector: "advanced-manufacturing",
    stagePrefs: ["seed"],
    domains: ["advanced-manufacturing", "ai"],
    networks: ["operator", "venture"],
    keywords: ["DC robots", "inventory reconciliation", "WMS integration", "ROS2", "fleet autonomy"],
  },
  {
    oneLiner: "Row-crop scouting robots for dryland agriculture",
    sector: "advanced-manufacturing",
    stagePrefs: ["seed"],
    domains: ["advanced-manufacturing", "ai"],
    networks: ["operator", "venture", "mentor"],
    keywords: ["row-crop scouting", "dryland farming", "wheat barley alfalfa", "field robots", "agronomy"],
  },
  {
    oneLiner: "Long-read sequencing for non-human-pathogen surveillance",
    sector: "life-sciences",
    stagePrefs: ["pre-seed", "seed"],
    domains: ["life-sciences"],
    networks: ["mentor", "venture", "sme-advisory"],
    keywords: ["long-read sequencing", "nanopore", "pathogen surveillance", "USU spinout", "Cache Valley"],
  },
  {
    oneLiner: "Telemedicine for rural Utah Medicaid populations",
    sector: "life-sciences",
    stagePrefs: ["seed", "series-a"],
    domains: ["life-sciences", "software"],
    networks: ["operator", "sme-advisory"],
    keywords: ["telemedicine", "Utah Medicaid", "rural primary care", "FQHC", "virtual care"],
  },
  {
    oneLiner: "High-altitude atmospheric data for wildfire risk",
    sector: "energy",
    stagePrefs: ["seed"],
    domains: ["energy", "ai"],
    networks: ["operator", "venture", "sme-advisory"],
    keywords: ["high-altitude balloons", "wildfire forecasting", "atmospheric sensors", "insurance underwriting"],
  },
  {
    oneLiner: "Live-service mobile games with a strong narrative thesis",
    sector: "software",
    stagePrefs: ["pre-seed", "seed"],
    domains: ["software"],
    networks: ["operator", "venture"],
    keywords: ["live-service games", "narrative-led mobile", "soft launch", "Disney Interactive", "Plarium"],
  },
  {
    oneLiner: "Procurement software for state and local government",
    sector: "software",
    stagePrefs: ["seed"],
    domains: ["software"],
    networks: ["operator", "mentor"],
    keywords: ["RFP-to-contract", "state and local procurement", "GovTech", "Utah counties", "Idaho cities"],
  },
  {
    oneLiner: "AI-assisted radiology workflow for community hospitals",
    sector: "life-sciences",
    stagePrefs: ["seed", "series-a"],
    domains: ["life-sciences", "ai"],
    networks: ["operator", "sme-advisory"],
    keywords: ["radiology AI", "community hospitals", "PACS integration", "FDA 510(k)", "imaging workflow"],
  },
];

const TIER_C_ROLE_VARIANTS: TierCRoleVariant[] = [
  {
    rolePrefix: "Founding engineer",
    categories: ["engineer", "operator", "cofounder"],
    needs: ["engineer", "cofounder"],
    availability: "full-time",
    compensation: ["cash", "equity"],
    riskTolerance: 5,
    networks: ["operator"],
    bioContext:
      "Eight years shipping production code at fast-growth companies. Want to be employee #1 or #2 on something where my decisions show up in the architecture forever, not buried under three layers of process.",
    skillBundles: [
      ["typescript", "react", "next.js", "tailwind", "tRPC", "postgres", "redis", "graphql", "websockets"],
      ["go", "kubernetes", "kafka", "grpc", "service-mesh", "distributed-tracing", "site-reliability"],
      ["full-stack-generalist", "scrappy-mvp", "supabase", "vercel", "feature-flags", "ab-testing", "growth-experiments"],
    ],
  },
  {
    rolePrefix: "Domain expert",
    categories: ["engineer", "advisor-paid", "executive"],
    needs: ["engineer", "advisor-paid", "cofounder"],
    availability: "full-time",
    compensation: ["cash", "equity", "mentor"],
    riskTolerance: 4,
    networks: ["operator", "sme-advisory"],
    bioContext:
      "Twelve years deep in this exact problem space. I've seen every wrong way to solve it and I have very strong opinions about the right one. Looking for a founding team where the science / domain is the moat.",
    skillBundles: [
      ["regulatory-strategy", "fda-pre-submission", "510k-pathway", "de-novo-classification", "qsr-readiness"],
      ["healthcare-engineering", "hl7", "fhir", "epic-integration", "hipaa", "phi-handling", "audit-logging"],
      ["clinical-evidence-strategy", "kol-network", "label-expansion-strategy", "hospital-procurement"],
    ],
  },
  {
    rolePrefix: "Founding GTM lead",
    categories: ["sales", "executive", "operator"],
    needs: ["sales", "executive", "operator"],
    availability: "full-time",
    compensation: ["cash", "equity"],
    riskTolerance: 4,
    networks: ["operator", "venture"],
    bioContext:
      "Closed $5M+ ARR at two early-stage companies as the first commercial hire. Build my own playbook, my own pipeline, and my own ramp. Want a real wedge with a defensible product, not vapor.",
    skillBundles: [
      ["enterprise-sales", "outbound", "discovery", "champion-building", "multithreading", "mutual-action-plans"],
      ["pipeline-build", "ramp-design", "deal-strategy", "competitive-displacement", "renewal-protection"],
      ["sales-engineering", "discovery-demo", "poc-design", "security-questionnaires", "soc2-collateral"],
    ],
  },
  {
    rolePrefix: "Founding ops lead",
    categories: ["operator", "coo", "executive"],
    needs: ["operator", "coo", "executive"],
    availability: "full-time",
    compensation: ["cash", "equity"],
    riskTolerance: 4,
    networks: ["operator", "mentor"],
    bioContext:
      "Bridge product, finance, and people. The 5→25 chaos point is where I do my best work — billing, comp bands, hiring loops, vendor sprawl, the un-glamorous middle. Done it twice; want to do it again.",
    skillBundles: [
      ["bizops", "fp&a", "cap-table-modeling", "vendor-management", "saas-stack-rationalization", "rev-leakage-audit"],
      ["chief-of-staff", "exec-comms", "board-decks", "all-hands-design", "meeting-hygiene", "okr-rollout"],
      ["revops", "salesforce-admin", "lead-routing", "territory-design", "quota-modeling", "data-ops"],
    ],
  },
];

function buildTierC(idx: number): TalentDTO {
  // Tier C indices run 200..299 — but we slot 100 personas as targetIdx ×
  // roleIdx. Each of the 25 targets gets all 4 role variants.
  const i = idx - 200;
  const target = TIER_C_TARGETS[i % TIER_C_TARGETS.length];
  const role = TIER_C_ROLE_VARIANTS[Math.floor(i / TIER_C_TARGETS.length) % TIER_C_ROLE_VARIANTS.length];

  // Stable name + slug per i so re-runs upsert into the same row.
  const first = pick(FIRST_NAMES, i * 13 + 17);
  const last = pick(LAST_NAMES, i * 19 + 23);
  const name = `${first} ${last}`;
  const slug = `${first}.${last}`.toLowerCase().replace(/[^a-z0-9.]/g, "");

  const num = String(100 + idx).padStart(12, "0");
  const id = `11111111-1111-4111-8111-${num}`;

  const skills = Array.from(
    new Set([...role.skillBundles[0], ...role.skillBundles[1], ...role.skillBundles[2]]),
  );

  // Headline mirrors the business one-liner so the candidate's profileText
  // shares vocabulary with the business profile (helps both directions of
  // the bidirectional cosine).
  const headline = `${role.rolePrefix} · ${target.oneLiner}`;

  const location = pick(LOCATIONS, i * 3);
  const utahOrgIds = pick(ORG_BUNDLES, i);

  // Per-Tier-C variation. Two candidates can land on the same (target, role)
  // pair (100 candidates / 108 combinations leaves dupes), so we sprinkle
  // the same `idx`-driven specifics here that Tier A/B uses. Different idx
  // multipliers from buildOne so the pools don't lock-step with the lower
  // tier.
  const compHook = deterministic(COMP_HOOKS, idx * 23 + 5);
  const timeline = deterministic(TIMELINE_HOOKS, idx * 29 + 7);
  const risk = deterministic(RISK_HOOKS, idx * 31 + 11);
  const tone = deterministic(TONE_HOOKS, idx * 37 + 13);
  const teamSize = deterministic(TEAM_SIZE_HOOKS, idx * 41 + 17);
  const city = location.split(",")[0]?.trim() ?? location;
  const distinctiveSkill = skills[idx % skills.length];

  const bio = [
    role.bioContext,
    `Want to ship ${target.oneLiner.toLowerCase()} with a small founding team in Utah.`,
    `Domain context: ${target.keywords.join(", ")}.`,
    `Skills: ${skills.join(", ")}.`,
    `Based in ${city}. Strongest in ${distinctiveSkill}. ${tone}`,
  ].join(" ");

  // lookingFor is the highest-leverage field — it dominates `wantsText`,
  // which gets cosined against the business `profileText`. Keep it dense
  // with target keywords + the verbatim one-liner.
  const lookingFor = [
    `${role.rolePrefix} role at a ${target.stagePrefs[target.stagePrefs.length - 1]} ${target.sector} startup building ${target.oneLiner.toLowerCase()}.`,
    `Especially interested in: ${target.keywords.join(", ")}.`,
    `${teamSize} ${timeline} ${risk} Comp shape: ${compHook}.`,
  ].join(" ");

  // ~50% of Tier C ships without a profile photo to reflect realistic
  // onboarding gaps. Hash on i to keep the choice stable across runs.
  const omitPhoto = (i * 23 + 7) % 10 < 5;
  const photoIdx = ((i * 19) % 70) + 1;
  const photoUrl = omitPhoto ? undefined : `https://i.pravatar.cc/240?img=${photoIdx}`;

  return {
    id,
    name,
    email: `${slug}+seed${idx}@nucleus.demo`,
    headline,
    bio,
    lookingFor,
    categories: role.categories,
    lookingForNeeds: role.needs,
    domains: target.domains,
    availability: role.availability,
    compensation: role.compensation,
    stagePrefs: target.stagePrefs,
    riskTolerance: role.riskTolerance,
    location,
    utahOrgIds,
    networks: role.networks.filter((n) => target.networks.includes(n)).length
      ? role.networks.filter((n) => target.networks.includes(n))
      : role.networks,
    photoUrl,
    linkedinUrl: `https://linkedin.com/in/${slug}-demo`,
    createdAt: seedTime,
  };
}

export const EXTRA_LIVE_TALENT: TalentDTO[] = [
  ...Array.from({ length: 200 }, (_, i) => buildOne(i)),
  ...Array.from({ length: 100 }, (_, i) => buildTierC(200 + i)),
];

// ── Procedural businesses ──────────────────────────────────────────────────
//
// Same approach as `EXTRA_LIVE_TALENT` — a handful of business archetypes
// crossed with name / one-liner / description pools, sampled deterministically
// by index. IDs occupy `…200000000100` → `…200000000199` so they don't
// collide with the curated 24 (which use 001-024).

type BusinessArchetype = {
  sector: Sector;
  origins: Origin[];
  stages: Stage[];
  fundingStatuses: FundingStatus[];
  trls: Array<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>;
  needs: StartupNeed[][];
  networksWanted: Network[][];
  nameWords: { left: string[]; right: string[] };
  oneLinerPool: string[];
  descriptionPool: string[];
};

const BUSINESS_ARCHETYPES: BusinessArchetype[] = [
  {
    sector: "software",
    origins: ["vc-backed", "u-of-u-spinout", "byu-spinout", "bootstrapped"],
    stages: ["pre-seed", "seed", "series-a"],
    fundingStatuses: ["pre-revenue", "revenue"],
    trls: [6, 7, 8],
    needs: [
      ["engineer", "sales"],
      ["engineer", "marketing"],
      ["sales", "marketing"],
      ["engineer", "operator"],
    ],
    networksWanted: [
      ["operator"],
      ["operator", "venture"],
      ["operator", "mentor"],
    ],
    nameWords: {
      left: ["Quill", "Forge", "Anchor", "Bramble", "Junction", "Larkfield", "Northbeam", "Cipher", "Lattice", "Granite"],
      right: ["Labs", "Stack", "Cloud", "Works", "OS", "AI", "Data", "Logic", "HQ", "Core"],
    },
    oneLinerPool: [
      "Workflow automation for mid-market operations teams",
      "AI assistant embedded in B2B accounting software",
      "Data infrastructure for vertical-SaaS companies",
      "Internal-tools platform for non-engineering teams",
      "Customer-onboarding automation for B2B SaaS",
      "Knowledge-base AI for customer-success teams",
      "Spend-management platform for SMB",
    ],
    descriptionPool: [
      "Founder is a repeat operator out of a Mountain West SaaS scale-up. Two paying design partners; usable beta launching this quarter. Building toward a $1M ARR goal in the next twelve months.",
      "Bootstrapping out of Lehi with a small team of three engineers. Serving niche industries the big horizontal players ignore — light-industrial, dental, regional logistics. Pricing transparent.",
      "Spun out of a U-of-U research project on retrieval-augmented generation. Six months in. Have an LOI from a Fortune-500 anchor customer; need to ship the first production deployment.",
      "Founders met at a Pelion-backed prior company. They're rebuilding the playbook for a different ICP — small operations teams that can't afford enterprise tools but can't live without them either.",
    ],
  },
  {
    sector: "ai",
    origins: ["vc-backed", "u-of-u-spinout"],
    stages: ["pre-seed", "seed", "series-a"],
    fundingStatuses: ["pre-revenue", "revenue", "grant"],
    trls: [4, 5, 6, 7],
    needs: [
      ["engineer", "sales"],
      ["engineer"],
      ["engineer", "operator"],
      ["sales", "marketing"],
    ],
    networksWanted: [
      ["operator", "venture"],
      ["operator", "sme-advisory"],
    ],
    nameWords: {
      left: ["Vector", "Synapse", "Cortex", "Reflex", "Lumen", "Atlas", "Mira", "Helix", "Tessera", "Argent"],
      right: ["AI", "ML", "Reason", "Cognition", "Neural", "Sense", "Mind", "Logic"],
    },
    oneLinerPool: [
      "Specialized LLM for clinical-trial document review",
      "Voice-AI for residential-services call centers",
      "Visual-inspection AI for food and beverage manufacturing",
      "AI agent for procurement-RFP responses",
      "RAG-as-a-service for compliance-heavy industries",
      "Speech-recognition tuned for industrial environments",
    ],
    descriptionPool: [
      "Two-person founding team out of the U of U's Kahlert school. Trained a domain-specific model on 1.4M annotated documents. First two paying customers signed during the academic spinout phase.",
      "Building purpose-built models for an industry where general-purpose LLMs hallucinate too often to ship. Founder ran ML at a public consumer-internet company before this.",
      "Closed a small pre-seed round from a regional family office. Six months of runway; aiming to land three lighthouse customers before raising the seed.",
      "Spun out of a defense-industry collaboration; the IP is licensed exclusively. Expanding from defense into adjacent commercial use cases this year.",
    ],
  },
  {
    sector: "fintech",
    origins: ["vc-backed", "byu-spinout", "bootstrapped"],
    stages: ["seed", "series-a", "series-b"],
    fundingStatuses: ["revenue", "pre-revenue"],
    trls: [6, 7, 8],
    needs: [
      ["sales", "engineer"],
      ["sales", "marketing"],
      ["engineer", "operator", "regulatory"],
    ],
    networksWanted: [
      ["operator", "sme-advisory"],
      ["operator", "venture"],
    ],
    nameWords: {
      left: ["Settle", "Ledger", "Tally", "Kindred", "Revere", "Plumb", "Northstar", "Verity", "Beacon", "Sterling"],
      right: ["Pay", "Treasury", "Capital", "Finance", "Credit", "Money", "Books", "Books"],
    },
    oneLinerPool: [
      "B2B payments for the construction supply chain",
      "Treasury-management software for venture-backed startups",
      "Embedded lending for vertical-SaaS platforms",
      "AP automation for mid-market manufacturers",
      "Compliance-first payments for cannabis retailers",
      "Working-capital lending for trucking carriers",
    ],
    descriptionPool: [
      "Founders are ex-fintech operators from a public payments company. Live with twelve customers; processing low-eight-figure GMV monthly. Series A coming up in the second half.",
      "Built on top of a sponsor-bank partnership in Utah. Have the bank-relationship moat; need to scale the customer-acquisition motor.",
      "Bootstrapped from Provo to $4M ARR. Founders own the company outright; raising one institutional round to compound a wedge that's already working.",
      "Spun out of a BYU finance lab. Risk model trained on a proprietary dataset that competitors don't have access to.",
    ],
  },
  {
    sector: "life-sciences",
    origins: ["u-of-u-spinout", "byu-spinout", "usu-spinout"],
    stages: ["pre-seed", "seed", "series-a"],
    fundingStatuses: ["grant", "pre-revenue", "revenue"],
    trls: [3, 4, 5, 6, 7],
    needs: [
      ["regulatory", "engineer", "executive"],
      ["regulatory", "sales"],
      ["engineer", "operator", "regulatory"],
    ],
    networksWanted: [
      ["operator", "sme-advisory", "venture"],
      ["mentor", "venture", "sme-advisory"],
    ],
    nameWords: {
      left: ["Mira", "Vela", "Aria", "Lumen", "Beacon", "Helix", "Perla", "Cantle", "Ardent", "Pyxis"],
      right: ["Bio", "Therapeutics", "Health", "Diagnostics", "Medical", "Sciences", "Labs"],
    },
    oneLinerPool: [
      "Wearable for at-home heart-failure monitoring",
      "Single-cell sequencing for autoimmune-disease research",
      "Surgical-robotics platform for spine procedures",
      "Bench-top organ-on-a-chip for early-stage drug discovery",
      "AI-assisted radiology workflow for community hospitals",
      "Continuous glucose-monitoring for type-1 pediatric care",
    ],
    descriptionPool: [
      "Spun out of the U of U bioengineering department in 2025. Three issued patents; FDA pre-submission meeting scheduled. Backed by a small NIH SBIR Phase I award.",
      "Founder is a clinician-researcher from Intermountain Health. Building a tool he wished existed during his fellowship. Convertible-note round closed; seed coming next year.",
      "USU spinout focused on the agricultural-veterinary side of diagnostics. Transitioning the platform from animal-health to a parallel human-health beachhead this year.",
      "BYU chemistry-department spinout. Wet-lab work proven; transitioning to a manufacturing-readiness phase. Need a regulatory leader and a CEO with FDA experience.",
    ],
  },
  {
    sector: "energy",
    origins: ["u-of-u-spinout", "vc-backed", "usu-spinout"],
    stages: ["pre-seed", "seed", "series-a"],
    fundingStatuses: ["grant", "pre-revenue", "revenue"],
    trls: [4, 5, 6, 7],
    needs: [
      ["engineer", "sales"],
      ["engineer", "operator"],
      ["engineer", "regulatory", "executive"],
    ],
    networksWanted: [
      ["operator", "venture", "sme-advisory"],
      ["operator", "venture"],
    ],
    nameWords: {
      left: ["Obelisk", "Cinder", "Voltic", "Strata", "Ridgeline", "Zenith", "Helio", "Caldera", "Anvil", "Plateau"],
      right: ["Energy", "Power", "Grid", "Carbon", "Climate", "Watts", "Fields"],
    },
    oneLinerPool: [
      "Long-duration iron-air battery storage for grid operators",
      "Software-defined transformer for distribution utilities",
      "Methane-leak detection drones for oil-and-gas operators",
      "EV charging hardware for fleet-depot use cases",
      "Geothermal-drilling analytics for the western US",
      "Behind-the-meter solar + storage for industrial sites",
    ],
    descriptionPool: [
      "Five-person team building hardware out of a small Salt Lake City facility. Test cell installed at a partner utility; second installation later this year.",
      "U of U materials-science spinout. Battery chemistry validated at lab scale; raising a seed to fund a 100kWh pilot.",
      "Servicing a real customer pull from oil-and-gas majors that have made methane-reduction commitments. Five paid pilots running.",
      "USU mechanical-engineering spinout. Field deployment underway with a Wyoming utility; expanding to two more grids in Q3.",
    ],
  },
  {
    sector: "advanced-manufacturing",
    origins: ["byu-spinout", "u-of-u-spinout", "vc-backed"],
    stages: ["seed", "series-a", "series-b"],
    fundingStatuses: ["pre-revenue", "revenue"],
    trls: [5, 6, 7, 8],
    needs: [
      ["engineer", "operator"],
      ["engineer", "sales", "regulatory"],
      ["engineer", "executive"],
    ],
    networksWanted: [
      ["operator", "venture"],
      ["operator", "sme-advisory", "venture"],
    ],
    nameWords: {
      left: ["Forge", "Anvil", "Bedrock", "Granite", "Saltflats", "Wasatch", "Foundry", "Ironbar", "Compass", "Ridge"],
      right: ["Robotics", "Manufacturing", "Industries", "Systems", "Works", "Mechanics", "Forge"],
    },
    oneLinerPool: [
      "Robotic welding cells for mid-tier metal fabricators",
      "Vision-system retrofits for legacy injection-molding lines",
      "Additive-manufacturing service bureau for aerospace primes",
      "Autonomous forklifts for distribution centers",
      "Digital-thread software for discrete manufacturers",
      "Computer-vision quality control for automotive suppliers",
    ],
    descriptionPool: [
      "Two-time founders who exited a manufacturing-software company in 2023. Now applying robotics to a problem they understand well. Three customer pilots active.",
      "Spun out of BYU's mechanical-engineering department. Hardware iteration cycle is fast; software is the bottleneck.",
      "Operating out of a 12,000-sqft facility in Ogden. Backed by a Mountain West family office. Selling primarily to Tier-2 automotive suppliers.",
      "U of U robotics lab spinout. Current focus: deploying the second-generation hardware at three reference customers before raising the Series A.",
    ],
  },
  {
    sector: "cyber",
    origins: ["vc-backed", "u-of-u-spinout"],
    stages: ["seed", "series-a"],
    fundingStatuses: ["revenue", "pre-revenue"],
    trls: [6, 7, 8],
    needs: [
      ["sales", "marketing"],
      ["engineer", "sales"],
      ["sales", "operator"],
    ],
    networksWanted: [
      ["operator", "mentor"],
      ["operator", "venture"],
    ],
    nameWords: {
      left: ["Cipher", "Sentinel", "Bastion", "Argo", "Watcher", "Halberd", "Veil", "Cordon", "Beacon", "Redoubt"],
      right: ["Security", "Cyber", "Defense", "Trust", "Shield", "Watch", "Guard"],
    },
    oneLinerPool: [
      "Identity-threat detection for cloud-first enterprises",
      "SaaS-supply-chain risk monitoring for security teams",
      "Continuous-pen-testing platform for mid-market",
      "Privileged-access management for non-human identities",
      "Cloud-misconfiguration remediation for security teams",
      "Phishing-simulation-and-training for distributed teams",
    ],
    descriptionPool: [
      "Founder ran a cloud-security team at a public SaaS company. Knows the buyer; targets companies whose security org is exactly the size his used to be.",
      "Six paying customers in the design-partner phase. Average ACV is $35K; clear path to $100K with the next-tier product.",
      "Spun out of a U-of-U cybersecurity research lab. Two issued patents on the detection methodology; venture backers from a Boston firm and a SLC-based fund.",
      "Replacing a manual workflow that security ops teams hate. Selling into the same buyer who already has SOC2 and a CISO — ICP is well-defined.",
    ],
  },
  {
    sector: "defense-aerospace",
    origins: ["u-of-u-spinout", "byu-spinout", "vc-backed"],
    stages: ["pre-seed", "seed", "series-a"],
    fundingStatuses: ["grant", "pre-revenue", "revenue"],
    trls: [4, 5, 6, 7],
    needs: [
      ["engineer", "regulatory"],
      ["engineer", "executive", "regulatory"],
      ["engineer", "operator"],
    ],
    networksWanted: [
      ["operator", "sme-advisory", "venture"],
      ["operator", "venture"],
    ],
    nameWords: {
      left: ["Skyline", "Apogee", "Vector", "Ironwing", "Beacon", "Talon", "Hummingbird", "Vortex", "Flare", "Meridian"],
      right: ["Aerospace", "Aero", "Defense", "Systems", "Dynamics", "Industries", "Avionics"],
    },
    oneLinerPool: [
      "Small-satellite propulsion units for LEO constellations",
      "Counter-UAS systems for border-and-base protection",
      "ISR sensors for tactical small-format aircraft",
      "Precision-navigation software for GPS-denied environments",
      "Hypersonic-component testing services",
      "Tactical-comms encryption modules",
    ],
    descriptionPool: [
      "Spun out of a U of U mechanical-engineering lab. SBIR Phase II award secured; first commercial customer in talks.",
      "Two former defense-prime engineers building outside the prime ecosystem. AFWERX contract awarded last year.",
      "Targeting the rapid-acquisition pathways the DoD has stood up for non-traditional vendors. Have a working hardware prototype and a TRL-6 readiness review scheduled.",
      "Building dual-use technology — defense buyer pulls the production volume; commercial market opens up adjacent revenue.",
    ],
  },
];

const UTAH_ORG_BUNDLES_FOR_BIZ: string[][] = [
  ["org-uu"],
  ["org-uu", "org-utto"],
  ["org-uu", "org-uea"],
  ["org-uu", "org-bw"],
  ["org-byu", "org-byutto"],
  ["org-byu", "org-byualum"],
  ["org-byu", "org-pelion"],
  ["org-usu"],
  ["org-pelion"],
  ["org-pyc"],
  ["org-bw"],
  ["org-uu", "org-pelion"],
];

const BUSINESS_LOCATIONS = [
  "Salt Lake City, UT",
  "Lehi, UT",
  "Provo, UT",
  "Park City, UT",
  "Ogden, UT",
  "Logan, UT",
  "Draper, UT",
  "South Jordan, UT",
  "Sandy, UT",
  "Cedar City, UT",
  "St. George, UT",
];

function buildBusiness(idx: number): StartupDTO {
  const arch = pick(BUSINESS_ARCHETYPES, idx);
  const left = pick(arch.nameWords.left, idx * 7 + 1);
  const right = pick(arch.nameWords.right, idx * 13 + 5);
  const name = `${left} ${right}`;
  const slug = `${left}.${right}`.toLowerCase().replace(/[^a-z0-9.]/g, "");

  const num = String(100 + idx).padStart(12, "0");
  const id = `22222222-2222-4222-8222-${num}`;

  const oneLiner = pick(arch.oneLinerPool, idx);
  const description = pick(arch.descriptionPool, idx);
  const stage = pick(arch.stages, idx);
  const fundingStatus = pick(arch.fundingStatuses, idx);
  const origin = pick(arch.origins, idx);
  const trl = pick(arch.trls, idx);
  const needs = pick(arch.needs, idx);
  const networksWanted = pick(arch.networksWanted, idx);
  const location = pick(BUSINESS_LOCATIONS, idx);
  const utahOrgIds = pick(UTAH_ORG_BUNDLES_FOR_BIZ, idx);

  return {
    id,
    name,
    oneLiner,
    description,
    sector: arch.sector,
    origin,
    trl,
    fundingStage: stage,
    fundingStatus,
    needs,
    networksWanted,
    location,
    utahOrgIds,
    websiteUrl: `https://${slug}.demo`,
    createdAt: seedTime,
  };
}

export const EXTRA_LIVE_STARTUPS: StartupDTO[] = Array.from(
  { length: 80 },
  (_, i) => buildBusiness(i),
);
