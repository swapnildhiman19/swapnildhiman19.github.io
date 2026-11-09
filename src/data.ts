// All site content lives here. Edit text in this file; layout code never needs to change for a wording fix.
//
// Source of truth: the résumé (Swapnil_Dhiman_Senior_iOS_AI_Engineer.pdf), plus details from the approved brief
// that do not conflict with it. Decision recorded 9 Nov 2026.
// - Everything is Walmart work except VoiceNote and the Sports AI commentary capstone (personal projects).
// - No internal ticket IDs, PR numbers, internal URLs, repo names or colleague names.
// - Every number must be traceable to the résumé or the brief.
// - Every simulation is labelled (see `labels` below).

export const site = {
  url: 'https://swapnildhiman19.github.io',
  title: 'Swapnil Dhiman · Senior iOS Engineer, Applied AI',
  description:
    'Swapnil Dhiman, Senior iOS Engineer and applied-AI builder at Walmart Global Tech. I build for two runtimes: the phone in your hand and the agent loop behind it.',
  // The résumé is published as provided (decision recorded 9 Nov 2026).
  resume: '/Swapnil_Dhiman_Senior_iOS_AI_Engineer.pdf',
  updated: '2026-11-09',
};

export const person = {
  name: 'Swapnil Dhiman',
  initials: 'SD',
  role: 'Senior iOS Engineer · Applied AI',
  roleLong: 'Senior iOS Engineer · Applied AI: LLM agents, AI systems and on-device LLMs (Apple Foundation Models)',
  company: 'Walmart Global Tech',
  location: 'Bengaluru, India',
  tenure: '4+ years, SDE II → SDE III',
  taglineLead: 'I build for two runtimes:',
  taglinePhone: 'the phone in your hand',
  taglineLoop: 'the agent loop behind it.',
  summary:
    'Senior iOS engineer with 4+ years at Walmart Global Tech shipping identity and commerce features in Swift to 10M+ users across the US, Mexico, Canada and Bodega. I build AI systems end to end: LLM routing, multi-agent systems, Model Context Protocol (MCP) servers, agent skills and on-device LLMs with Apple Foundation Models.',
  email: 'swapnildhiman1999@gmail.com',
  linkedin: 'https://www.linkedin.com/in/swapnil-dhiman-603365159/',
  github: 'https://github.com/swapnildhiman19',
  education: {
    school: 'Indian Institute of Technology (BHU), Varanasi',
    short: 'IIT (BHU) Varanasi',
    degree: 'Five-year integrated B.Tech + M.Tech in Mathematics and Computing',
    detail: 'CGPA 8.45/10 · 2022',
    thesis: 'M.Tech thesis: speech emotion recognition with CNN+LSTM (TensorFlow, Librosa), 87% accuracy on RAVDESS and TESS.',
  },
  skills: ['Swift · SwiftUI', 'LLM agents · MCP', 'On-device LLMs (Apple Foundation Models)', 'Identity at scale'],
};

export interface Stat {
  value: string;
  label: string;
}

export const stats: Stat[] = [
  { value: 'Top 20', label: 'of 3,000+ entries, Walmart Global Tech Hackathon 2026' },
  { value: '~1K', label: 'installs of MIMO, the agent-skill recorder, on the internal registry' },
  { value: '10M+', label: 'users across the US, Mexico, Canada and Bodega on flows I ship in Swift' },
  { value: '40%', label: 'faster order verification with the Omni ID identity QR code (Bravo Award)' },
  { value: '4+ yrs', label: 'at Walmart Global Tech, SDE II to SDE III' },
];

export const experience = [
  { org: 'Walmart Global Tech, Bengaluru', role: 'Senior Software Engineer, iOS (SDE III)', when: '07/2024 – Present' },
  { org: 'Walmart Global Tech, Bengaluru', role: 'Software Engineer, iOS (SDE II)', when: '07/2022 – 07/2024' },
  { org: 'Samsung R&D Institute India, Delhi', role: 'Software Development Intern', when: '06/2021 – 07/2021' },
];

// The three lanes of the site. The seam is where AI runs on the phone itself.
export type Lane = 'phone' | 'seam' | 'loop';

export const lanes: Record<Lane, { name: string; blurb: string }> = {
  phone: { name: 'On the phone', blurb: 'iOS I ship to 10M+ users: identity, sign-in, membership, post-purchase.' },
  seam: { name: 'The seam', blurb: 'AI that runs on the device itself, where the two runtimes meet.' },
  loop: { name: 'Behind it', blurb: 'Agent systems: model routing, MCP tooling, agent skills, knowledge graphs.' },
};

export interface Metric {
  value: string;
  label: string;
}

export type Org = 'Walmart' | 'Personal';

export interface Project {
  slug: string;
  lane: Lane;
  org: Org; // who the work was for
  kicker: string;
  title: string;
  oneLiner: string;
  metric: Metric; // shown first, before the title
  extraMetrics?: Metric[];
  status?: string; // shown as a badge when the work is not a shipped product
  credit?: string; // who did what, for team work
  what: string[]; // what I did
  how: string[]; // how it works
  result: string;
  stack: string[];
  flow?: string[]; // a simple left-to-right flow, for pages without a narrated diagram
  diagram?: string; // key into `diagrams`
  demo?: 'router' | 'qr' | 'otp' | 'merge';
}

export const projects: Project[] = [
  // ───────── Behind it: agent systems (Walmart) ─────────
  {
    slug: 'wibeyconductor',
    lane: 'loop',
    org: 'Walmart',
    kicker: 'LLM routing · Hackathon Top 20',
    title: 'WibeyConductor',
    oneLiner:
      'A per-turn LLM router inside Walmart’s AI coding assistant. It picks the cheapest model that can do the job without throwing away the prompt cache.',
    metric: { value: '73%', label: 'cheaper than the premium auto mode in benchmarks' },
    extraMetrics: [{ value: '34–61 ms', label: 'per routing decision' }],
    credit: 'Designed and built by me. Part of Token-OS, a Top 20 hackathon finalist.',
    what: [
      'Built the router that decides, on every turn, which model answers.',
      'Made it cache-aware, so it only switches models when the saving beats the cost of rebuilding the prompt cache.',
      'Added a memory that escalates an intent after redo requests and tool loops.',
    ],
    how: [
      'An embedding-based intent classifier compares the prompt (e5-small-v2) against 12 intent centroids, with a regex fallback below 0.55 confidence.',
      'Tiered model selection: five ordered filters, then a cache-stickiness check that switches models only when the savings beat the cost of rebuilding the cache.',
      'A post-turn escalation memory per intent (at most 3 per session, 8-turn half-life) learns from redo requests and tool loops.',
    ],
    result:
      '73% cheaper than the premium auto mode in benchmarks, with 34–61 ms per decision. Part of Token-OS, a Top 20 finalist of 3,000+ entries in Walmart’s Global Tech Hackathon 2026.',
    stack: ['Embeddings', 'Model routing', 'Claude Agent SDK', 'Prompt caching'],
    diagram: 'wibeyconductor',
    demo: 'router',
  },
  {
    slug: 'token-os',
    lane: 'loop',
    org: 'Walmart',
    kicker: 'MCP tooling · team project',
    title: 'Token-OS',
    oneLiner:
      'A Rust MCP server that trims what AI coding assistants send to the model: compressed shell output, slimmer tool responses, cheap re-reads of unchanged files.',
    metric: { value: '−28.5%', label: 'cost per session on a fixed 21-prompt benchmark' },
    extraMetrics: [
      { value: '21', label: 'MCP tools in one Rust binary' },
      { value: '30%', label: 'fewer output tokens on the same benchmark' },
    ],
    credit: 'Team project. WibeyConductor, the per-turn model router, is the part I designed and built.',
    what: [
      'Designed and built WibeyConductor, the router that picks the model for each turn inside Token-OS.',
      'Part of the team that reached the Top 20 of 3,000+ entries.',
    ],
    how: [
      'One Rust binary exposes 21 Model Context Protocol (MCP) tools.',
      'A shield step intercepts every tool response before it reaches the model.',
      'File intelligence skips re-sending files that have not changed.',
      'WibeyConductor picks the model per turn.',
    ],
    result: 'On a fixed 21-prompt benchmark: 28.5% lower cost per session and 30% fewer output tokens. Top 20 of 3,000+.',
    stack: ['Rust', 'MCP', 'Benchmarks'],
    diagram: 'token-os',
  },
  {
    slug: 'mimo',
    lane: 'loop',
    org: 'Walmart',
    kicker: 'Agent skills · co-built',
    title: 'MIMO',
    oneLiner:
      'A macOS recorder that turns one narrated screen demo into a reusable AI agent skill. “Show it once, never explain it again.”',
    metric: { value: '~1K', label: 'installs on the internal skills registry' },
    credit: 'Co-built. My part: the permission UI, the recording overlay, the microphone capture fix and the desktop-app plan.',
    what: [
      'Built the permission UI and the live recording overlay.',
      'Fixed the microphone capture pipeline.',
      'Planned the desktop app.',
    ],
    how: [
      'A macOS recorder with a permission flow and a live recording overlay captures clicks, keys and one screenshot per step.',
      'Your narration is transcribed and the bundle is redacted before an agent writes a SKILL.md.',
    ],
    result: 'About 1K installs on the internal registry. Demoed to International Tech leadership.',
    stack: ['Swift', 'macOS', 'Agent skills'],
    diagram: 'mimo',
  },
  {
    slug: 'enterprise-brain',
    lane: 'loop',
    org: 'Walmart',
    kicker: 'Knowledge graphs · multi-agent systems',
    title: 'Walmart Enterprise Brain',
    oneLiner:
      'A multi-agent system that turns company documents into a causal knowledge graph, so leadership questions get answers with a “why” and a source.',
    metric: { value: '5-stage', label: 'ingestion; a founder agent and 5 lens agents answer with cited evidence' },
    what: [
      'Built the multi-agent system: the five-stage ingestion pipeline and the agents that answer from the graph.',
      'Kept every decision in an audit trail with supersession history.',
    ],
    how: [
      'Five-stage ingestion: parse → extract with a fast model → resolve entities with embeddings → classify into five business lenses → add causal edges with a reasoning model.',
      'A founder agent and five lens agents answer leadership questions using read-only, guarded graph tools.',
      'Every decision is kept in an audit trail with supersession history.',
    ],
    result: 'Leadership questions answered with a causal chain and cited evidence, not a guess.',
    stack: ['Python', 'FastAPI', 'Neo4j', 'Google Agent Development Kit'],
    diagram: 'enterprise-brain',
  },

  // ───────── The seam: AI on the device ─────────
  {
    slug: 'fraud-signals',
    lane: 'seam',
    org: 'Walmart',
    kicker: 'On-device AI · design',
    title: 'On-device fraud detection',
    oneLiner:
      'Account-takeover pattern detection with an on-device LLM (Apple Foundation Models). Only hashed signals leave the phone; the server keeps the final decision.',
    metric: { value: '~1.5 s', label: 'on-device time budget, zero inference cost' },
    status: 'Design',
    what: ['Designed on-device fraud detection with an on-device LLM (Apple Foundation Models) using tool calling.'],
    how: [
      'A hashed, short-term event journal on the phone.',
      'The on-device model calls local lookup tools over that journal.',
      'Named patterns are checked within a ~1.5 s budget.',
      'Only hashed signals leave the device; the server keeps the final decision.',
    ],
    result: 'A design that checks account-takeover patterns in about 1.5 seconds, at zero inference cost, without raw events leaving the phone.',
    stack: ['Apple Foundation Models', 'Tool calling', 'Privacy by design'],
    flow: ['Hashed event journal', 'Tool calls on device', 'Named patterns, ~1.5 s', 'Hashed signal', 'Server decides'],
  },
  {
    slug: 'core-ai-proposal',
    lane: 'seam',
    org: 'Walmart',
    kicker: 'On-device AI · proposal after WWDC26',
    title: 'Core AI proposal: in-app camera search',
    oneLiner:
      'A proposal for on-device AI in the Walmart app after WWDC26: camera product search, barcode, label and receipt scanning, offline store features, privacy by default.',
    metric: { value: '$0', label: 'per inference, on the device' },
    status: 'Proposal',
    what: ['Wrote the Core AI (WWDC26) proposal for in-app camera search.'],
    how: ['Camera product search.', 'Barcode, label and receipt scanning.', 'Offline store features.', 'Privacy by default: inference stays on the device.'],
    result: 'A roadmap where inference runs on the device, at no per-call cost.',
    stack: ['On-device models', 'Camera', 'Privacy by default'],
  },
  {
    slug: 'voicenote',
    lane: 'seam',
    org: 'Personal',
    kicker: 'On-device AI · personal project',
    title: 'VoiceNote: Dictate into any App',
    oneLiner:
      'Press a shortcut in any Mac app and talk. On-device speech recognition and an on-device LLM sort it into notes and todos. No account, no server.',
    metric: { value: '0', label: 'network calls' },
    what: ['Designed and built it: global shortcuts, on-device transcription, filing with Foundation Models, and on-device OCR.'],
    how: [
      'Press a shortcut in any Mac app and talk; Apple’s on-device speech recognizer transcribes it.',
      'An on-device LLM (Apple Foundation Models) sorts it into a note or a todo.',
      'A second shortcut reads the text under the pointer with on-device OCR.',
    ],
    result: 'Dictation into any app with zero network calls.',
    stack: ['Swift', 'macOS', 'Apple Foundation Models', 'On-device speech', 'On-device OCR'],
    flow: ['Shortcut in any app', 'On-device speech', 'Foundation Models sorts it', 'Note or todo'],
  },

  // ───────── On the phone: iOS shipped (Walmart) ─────────
  {
    slug: 'bodega-account-merge',
    lane: 'phone',
    org: 'Walmart',
    kicker: 'Identity · Mexico',
    title: 'Bodega identity account merge',
    oneLiner:
      'Shipped end to end: app-launch and sign-in triggers, email step-up, merge preview and token exchange.',
    metric: { value: '5.7M', label: 'overlapping identities migrated · launched in Mexico, Aug 2026' },
    what: ['Shipped the Bodega identity account merge end to end on iOS.'],
    how: [
      'Triggers on app launch and on sign-in.',
      'A mandatory email step-up before anything merges.',
      'A merge preview, then token exchange and a success screen.',
    ],
    result: 'Launched in Mexico in August 2026, migrating 5.7M overlapping identities.',
    stack: ['Swift', 'Email step-up', 'Token exchange'],
    flow: ['Launch or sign-in trigger', 'Email step-up', 'Merge preview', 'Token exchange', 'Success'],
    demo: 'merge',
  },
  {
    slug: 'consent-systematic-merge',
    lane: 'phone',
    org: 'Walmart',
    kicker: 'Identity · consent',
    title: 'Consent-based systematic merge',
    oneLiner: 'The cold-launch path for customers who still owe merge consent: the fewest possible steps, server-driven pages, analytics dashboards.',
    metric: { value: 'Live', label: 'in production' },
    what: ['Delivered the consent-based systematic merge.'],
    how: ['Runs on cold launch for customers who still owe merge consent.', 'The fewest possible steps, on server-driven pages.', 'Analytics dashboards on every screen.'],
    result: 'Live in production.',
    stack: ['Swift', 'Server-driven UI', 'Analytics'],
  },
  {
    slug: 'global-one-app-linking',
    lane: 'phone',
    org: 'Walmart',
    kicker: 'Identity · cross-market',
    title: 'Global One App account linking',
    oneLiner: 'US ↔ Mexico accounts linked in one global app, with OTP and risk-based step-up, server-driven pages and clear error states.',
    metric: { value: 'US ↔ MX', label: 'live in production in one global app' },
    what: ['Delivered Global One App account linking for the US and Mexico.'],
    how: ['One-time passcode (OTP) and risk-based step-up.', 'Server-driven pages and analytics dashboards.', 'Clear error states.'],
    result: 'Live in production.',
    stack: ['Swift', 'OTP', 'Risk-based step-up', 'Server-driven UI'],
    flow: ['Link accounts', 'OTP', 'Risk-based step-up', 'Linked'],
    demo: 'otp',
  },
  {
    slug: 'omni-id',
    lane: 'phone',
    org: 'Walmart',
    kicker: 'Identity · Canada + US · Bravo Award',
    title: 'Omni ID, a living identity QR code',
    oneLiner:
      'A dynamic identity QR code on the Account page of the Walmart Canada and US apps. It refreshes on every visit and on a GraphQL-driven expiry.',
    metric: { value: '40%', label: 'higher order verification efficiency (Bravo Award)' },
    what: ['Built Omni ID end to end for the Walmart Canada and US apps.'],
    how: [
      'Refreshes on every visit and on a GraphQL-driven expiry.',
      'Expired-state regeneration and an expanded bottom-sheet view.',
      'An onboarding journey, behind a remote feature flag.',
    ],
    result: 'Raised order verification efficiency by 40%. Recognised with a Bravo Award.',
    stack: ['Swift', 'GraphQL', 'Feature flags'],
    flow: ['Open Account', 'Fresh QR', 'GraphQL-driven expiry', 'Expired → regenerate'],
    demo: 'qr',
  },
  {
    slug: 'native-post-purchase',
    lane: 'phone',
    org: 'Walmart',
    kicker: 'Post-purchase · Canada + Mexico',
    title: 'Native Post Purchase',
    oneLiner: 'Native returns and post-purchase in the Canada and Mexico apps: reason, method, QR code and label, instructions.',
    metric: { value: '1M+', label: 'transactions a month' },
    extraMetrics: [{ value: '25%', label: 'shorter average return cycle' }],
    what: ['Implemented Native Post Purchase for Canada and Mexico.'],
    how: ['Pick a reason.', 'Pick a method.', 'Get a QR code and a label.', 'Follow the instructions.'],
    result: 'Processing 1M+ transactions a month and cutting the average return cycle by 25%.',
    stack: ['Swift', 'Post-purchase', 'QR codes'],
    flow: ['Reason', 'Method', 'QR code and label', 'Instructions'],
  },
  {
    slug: 'delivery-pass-membership',
    lane: 'phone',
    org: 'Walmart',
    kicker: 'Membership · Mexico + Canada',
    title: 'Delivery Pass membership flows',
    oneLiner: 'Free trial, reactivation and membership flows for Delivery Pass in Mexico and Canada.',
    metric: { value: '+25%', label: 'subscriptions in 6 months' },
    what: ['Built the Delivery Pass free trial, reactivation and membership flows.'],
    how: ['Free trial.', 'Reactivation.', 'Membership management.'],
    result: '+25% subscriptions in 6 months.',
    stack: ['Swift', 'Membership'],
  },
  {
    slug: 'tempo-cms-plugins',
    lane: 'phone',
    org: 'Walmart',
    kicker: 'Platform · content',
    title: 'Tempo CMS plugins',
    oneLiner: 'Plugins that let 10+ business teams update app content without an app release.',
    metric: { value: '−45%', label: 'release time' },
    extraMetrics: [{ value: '10+', label: 'business teams shipping without app releases' }],
    what: ['Shipped Tempo CMS plugins for the app.'],
    how: ['Content is driven from the CMS.', 'Business teams update it without waiting for an app release.'],
    result: '10+ business teams update content without app releases, with 45% less release time.',
    stack: ['Swift', 'CMS plugins'],
  },
  {
    slug: 'phone-verification',
    lane: 'phone',
    org: 'Walmart',
    kicker: 'Identity · sign-up to checkout',
    title: 'Phone verification flows',
    oneLiner: 'Verified phone numbers at sign-up, sign-in and checkout, behind feature flags, with dashboards other teams adopted.',
    metric: { value: '5+', label: 'teams adopted the dashboards' },
    what: ['Built phone-verification flows with dashboards adopted by 5+ teams.'],
    how: ['Verify the phone number at sign-up, sign-in and checkout.', 'Each surface behind a feature flag.', 'Dashboards to watch each step.'],
    result: 'Dashboards adopted by 5+ teams.',
    stack: ['Swift', 'Phone verification', 'Feature flags', 'Analytics'],
  },
  {
    slug: 'passkeys-and-consent',
    lane: 'phone',
    org: 'Walmart',
    kicker: 'Identity · privacy',
    title: 'Passkeys and consent',
    oneLiner: 'Passkeys for three markets, and a cookie-consent experience built from server-driven modules.',
    metric: { value: '3', label: 'markets with passkeys' },
    what: ['Shipped passkeys for three markets.', 'Built a cookie-consent experience from server-driven modules.'],
    how: ['Passkeys at sign-in.', 'Consent screens assembled from server-driven modules.'],
    result: 'Passkeys live in three markets.',
    stack: ['Swift', 'Passkeys', 'Server-driven UI'],
  },
  {
    slug: 'architecture-and-account-deletion',
    lane: 'phone',
    org: 'Walmart',
    kicker: 'Architecture · compliance',
    title: 'MVVM + Coordinator refactor and account deletion',
    oneLiner: 'Led an MVVM + Coordinator refactor, and built web-native account deletion from scratch for market compliance.',
    metric: { value: '−30%', label: 'bug rate after the refactor' },
    what: [
      'Led an MVVM + Coordinator refactor.',
      'Built web-native account deletion from scratch, with guides adopted across teams for market compliance.',
    ],
    how: ['MVVM view models, with Coordinators owning navigation.', 'Account deletion built from scratch, plus guides other teams adopted.'],
    result: '−30% bug rate; deletion guides adopted across teams.',
    stack: ['Swift', 'MVVM + Coordinator', 'Compliance'],
  },
];

// The exploded phone on the home page. Each physical layer holds one part of the work, front to back,
// and the phone's radio leads out to the agent loop behind it.
export type LayerId = 'glass' | 'identity' | 'board' | 'neural' | 'loop';

export interface Layer {
  id: LayerId;
  n: string;
  part: string; // the physical part of the phone
  title: string;
  lede: string;
  projects: string[]; // project slugs
}

export const layers: Layer[] = [
  {
    id: 'glass',
    n: '01',
    part: 'Display',
    title: 'The screens 10M+ people tap.',
    lede: 'The UI I ship in Swift: a living identity code, returns, memberships.',
    projects: ['omni-id', 'native-post-purchase', 'delivery-pass-membership'],
  },
  {
    id: 'identity',
    n: '02',
    part: 'Secure Enclave',
    title: 'Who you are, across markets.',
    lede: 'Sign-in, step-up, merge and linking for the US, Mexico and Canada.',
    projects: ['bodega-account-merge', 'global-one-app-linking', 'consent-systematic-merge', 'passkeys-and-consent', 'phone-verification'],
  },
  {
    id: 'neural',
    n: '03',
    part: 'Neural Engine',
    title: 'The seam: AI that never leaves the phone.',
    lede: 'Apple Foundation Models, on-device speech and OCR. No server, no per-call cost.',
    projects: ['voicenote', 'fraud-signals', 'core-ai-proposal'],
  },
  {
    id: 'board',
    n: '04',
    part: 'Logic board',
    title: 'The architecture under it all.',
    lede: 'Patterns and platforms that let teams ship faster and break less.',
    projects: ['architecture-and-account-deletion', 'tempo-cms-plugins'],
  },
  {
    id: 'loop',
    n: '05',
    part: 'Antennas, and the loop behind them',
    title: 'Agent systems behind the phone.',
    lede: 'Model routing, MCP tooling, agent skills and knowledge graphs.',
    projects: ['wibeyconductor', 'token-os', 'mimo', 'enterprise-brain'],
  },
];

// The phone's lock screen in the first chapter: widgets and notifications, all taken from `stats` above.
export const lockScreen = {
  widgets: [
    { k: 'MIMO', v: '~1K installs' },
    { k: 'Walmart', v: '4+ yrs · SDE III' },
  ],
  notes: [
    { app: 'Hackathon', icon: 'trophy', title: 'Top 20 of 3,000+ entries', body: 'Walmart Global Tech Hackathon 2026' },
    { app: 'Omni ID', icon: 'qr', title: '40% faster order verification', body: 'With the Omni ID identity QR code · Bravo Award' },
    { app: 'Shipped', icon: 'plane', title: '10M+ users', body: 'Across the US, Mexico, Canada and Bodega, on flows I ship in Swift' },
  ],
} as const;

// The 3D phone's outside is a free model, credited wherever the phone appears (CC BY 4.0 asks for this).
export const modelCredit = {
  title: 'iPhone 16 Pro Max',
  author: 'MajdyModels',
  url: 'https://sketchfab.com/3d-models/iphone-16-pro-max-41a071ae12794b668502f58d1e0fd1a3',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  changes: 'Apple logo and wallpaper removed; screens, inner parts and lighting are mine.',
};

// Narrated, replayable diagrams. Coordinates are in a 1000 × height viewBox.
export interface DiagramNode {
  id: string;
  label: string;
  sub?: string;
  x: number;
  y: number;
  w: number;
  tone?: 'phone' | 'seam' | 'loop' | 'plain';
}
export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}
export interface Diagram {
  title: string;
  height: number;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  steps: { text: string; focus: string[] }[]; // focus: node ids, or "from>to" for edges
}

export const diagrams: Record<string, Diagram> = {
  wibeyconductor: {
    title: 'How WibeyConductor routes one turn',
    height: 400,
    nodes: [
      { id: 'prompt', label: 'Your prompt', sub: 'one turn', x: 10, y: 40, w: 170 },
      { id: 'intent', label: 'Intent classifier', sub: 'e5-small-v2 · 12 centroids', x: 225, y: 40, w: 235, tone: 'loop' },
      { id: 'regex', label: 'Regex fallback', sub: 'confidence < 0.55', x: 225, y: 190, w: 235, tone: 'plain' },
      { id: 'tier', label: 'Tier picker', sub: 'five ordered filters', x: 505, y: 40, w: 205, tone: 'loop' },
      { id: 'cache', label: 'Cache-stickiness', sub: 'switch only if it pays', x: 755, y: 40, w: 235, tone: 'loop' },
      { id: 'model', label: 'Model call', sub: 'cheapest that can do it', x: 755, y: 190, w: 235 },
      { id: 'memory', label: 'Escalation memory', sub: 'max 3 · 8-turn half-life', x: 505, y: 320, w: 255, tone: 'seam' },
    ],
    edges: [
      { from: 'prompt', to: 'intent' },
      { from: 'intent', to: 'regex', label: '< 0.55', dashed: true },
      { from: 'intent', to: 'tier' },
      { from: 'regex', to: 'tier', dashed: true },
      { from: 'tier', to: 'cache' },
      { from: 'cache', to: 'model' },
      { from: 'model', to: 'memory', label: 'redo / tool loop', dashed: true },
      { from: 'memory', to: 'tier', label: 'escalate', dashed: true },
    ],
    steps: [
      { text: 'A turn arrives from the coding assistant.', focus: ['prompt'] },
      { text: 'The prompt is embedded with e5-small-v2 and compared with 12 intent centroids.', focus: ['prompt>intent', 'intent'] },
      { text: 'If the best match is below 0.55 confidence, a regex fallback decides the intent.', focus: ['intent>regex', 'regex'] },
      { text: 'The tier picker runs five ordered filters to find the cheapest capable tier.', focus: ['intent>tier', 'regex>tier', 'tier'] },
      { text: 'It switches models only when the saving beats the cost of rebuilding the prompt cache.', focus: ['tier>cache', 'cache'] },
      { text: 'The chosen model answers. Each decision takes 34–61 ms.', focus: ['cache>model', 'model'] },
      { text: 'Redo requests and tool loops escalate that intent next time: at most 3 per session, fading with an 8-turn half-life.', focus: ['model>memory', 'memory', 'memory>tier'] },
    ],
  },
  'token-os': {
    title: 'What Token-OS does between the assistant and the model',
    height: 400,
    nodes: [
      { id: 'assistant', label: 'AI coding assistant', sub: 'calls tools over MCP', x: 20, y: 160, w: 210 },
      { id: 'binary', label: 'Token-OS', sub: 'one Rust binary · 21 MCP tools', x: 290, y: 160, w: 250, tone: 'loop' },
      { id: 'shell', label: 'Shell compression', sub: 'short command output', x: 610, y: 20, w: 210, tone: 'plain' },
      { id: 'shield', label: 'Shield step', sub: 'slims every tool response', x: 610, y: 120, w: 210, tone: 'plain' },
      { id: 'files', label: 'File intelligence', sub: 'skips unchanged files', x: 610, y: 220, w: 210, tone: 'plain' },
      { id: 'router', label: 'WibeyConductor', sub: 'my part: model per turn', x: 610, y: 320, w: 210, tone: 'seam' },
      { id: 'model', label: 'Model', sub: 'sees less', x: 860, y: 160, w: 120 },
    ],
    edges: [
      { from: 'assistant', to: 'binary' },
      { from: 'binary', to: 'shell' },
      { from: 'binary', to: 'shield' },
      { from: 'binary', to: 'files' },
      { from: 'binary', to: 'router' },
      { from: 'shield', to: 'model' },
      { from: 'router', to: 'model' },
    ],
    steps: [
      { text: 'The coding assistant calls tools over the Model Context Protocol.', focus: ['assistant', 'assistant>binary', 'binary'] },
      { text: 'Shell output is compressed before it is sent on.', focus: ['binary>shell', 'shell'] },
      { text: 'A shield step intercepts every tool response and slims it.', focus: ['binary>shield', 'shield'] },
      { text: 'Files that have not changed are not sent again.', focus: ['binary>files', 'files'] },
      { text: 'WibeyConductor, the part I built, picks the model for this turn.', focus: ['binary>router', 'router'] },
      { text: 'On a fixed 21-prompt benchmark: 28.5% lower cost per session and 30% fewer output tokens.', focus: ['shield>model', 'router>model', 'model'] },
    ],
  },
  mimo: {
    title: 'From one recording to a reusable skill',
    height: 330,
    nodes: [
      { id: 'perm', label: 'Permission flow', sub: 'my part', x: 20, y: 40, w: 190, tone: 'phone' },
      { id: 'rec', label: 'Recorder + overlay', sub: 'overlay: my part', x: 250, y: 40, w: 240, tone: 'phone' },
      { id: 'mic', label: 'Narration', sub: 'mic pipeline: my fix', x: 250, y: 190, w: 240, tone: 'phone' },
      { id: 'redact', label: 'Transcribe + redact', sub: 'before any agent sees it', x: 540, y: 115, w: 220, tone: 'seam' },
      { id: 'skill', label: 'SKILL.md', sub: 'written by your agent', x: 810, y: 115, w: 170, tone: 'loop' },
    ],
    edges: [
      { from: 'perm', to: 'rec' },
      { from: 'rec', to: 'redact' },
      { from: 'mic', to: 'redact' },
      { from: 'redact', to: 'skill' },
    ],
    steps: [
      { text: 'You grant screen and microphone access in a clear permission flow.', focus: ['perm'] },
      { text: 'You do the task once. A live overlay shows it is recording: clicks, keys, one screenshot per step.', focus: ['perm>rec', 'rec'] },
      { text: 'You narrate as you go; the microphone pipeline captures it.', focus: ['mic'] },
      { text: 'The narration is transcribed and the bundle is redacted before an agent sees it.', focus: ['rec>redact', 'mic>redact', 'redact'] },
      { text: 'The agent you already use writes a SKILL.md. Next time, you just ask.', focus: ['redact>skill', 'skill'] },
    ],
  },
  'enterprise-brain': {
    title: 'From documents to an answer with a “why”',
    height: 400,
    nodes: [
      { id: 'docs', label: 'Company documents', x: 20, y: 30, w: 200 },
      { id: 'parse', label: '1 · Parse', x: 260, y: 30, w: 130, tone: 'plain' },
      { id: 'extract', label: '2 · Extract', sub: 'fast model', x: 420, y: 30, w: 140, tone: 'plain' },
      { id: 'resolve', label: '3 · Resolve entities', sub: 'embeddings', x: 590, y: 30, w: 200, tone: 'plain' },
      { id: 'lens', label: '4 · Five business lenses', x: 590, y: 145, w: 230, tone: 'plain' },
      { id: 'causal', label: '5 · Causal edges', sub: 'reasoning model', x: 340, y: 145, w: 200, tone: 'plain' },
      { id: 'graph', label: 'Causal knowledge graph', sub: 'Neo4j', x: 40, y: 145, w: 250, tone: 'loop' },
      { id: 'agents', label: 'Founder agent + 5 lens agents', sub: 'read-only, guarded graph tools', x: 40, y: 280, w: 330, tone: 'loop' },
      { id: 'answer', label: 'Answer', sub: 'causal chain + cited evidence', x: 430, y: 280, w: 240, tone: 'seam' },
      { id: 'audit', label: 'Audit trail', sub: 'supersession history', x: 730, y: 280, w: 230, tone: 'plain' },
    ],
    edges: [
      { from: 'docs', to: 'parse' },
      { from: 'parse', to: 'extract' },
      { from: 'extract', to: 'resolve' },
      { from: 'resolve', to: 'lens' },
      { from: 'lens', to: 'causal' },
      { from: 'causal', to: 'graph' },
      { from: 'graph', to: 'agents' },
      { from: 'agents', to: 'answer' },
      { from: 'answer', to: 'audit' },
    ],
    steps: [
      { text: 'Company documents are parsed.', focus: ['docs', 'docs>parse', 'parse'] },
      { text: 'A fast model extracts entities and facts.', focus: ['parse>extract', 'extract'] },
      { text: 'Embeddings resolve duplicates into one entity.', focus: ['extract>resolve', 'resolve'] },
      { text: 'Each fact is classified into one of five business lenses.', focus: ['resolve>lens', 'lens'] },
      { text: 'A reasoning model adds causal edges, and everything lands in a graph.', focus: ['lens>causal', 'causal', 'causal>graph', 'graph'] },
      { text: 'A founder agent and five lens agents answer with read-only, guarded graph tools.', focus: ['graph>agents', 'agents'] },
      { text: 'The answer carries a causal chain and cited evidence, and every decision goes into an audit trail.', focus: ['agents>answer', 'answer', 'answer>audit', 'audit'] },
    ],
  },
};

export interface JourneyYear {
  year: string;
  items: string[];
}

export const journey: JourneyYear[] = [
  { year: '2017', items: ['Started at IIT (BHU) Varanasi: five-year integrated B.Tech + M.Tech in Mathematics and Computing'] },
  { year: '2021', items: ['Samsung R&D Institute India, Delhi: a deep neural network (T-Net and convolution layers) for LiDAR point-cloud classification, 90.88% on ModelNet10'] },
  { year: '2022', items: ['M.Tech thesis: speech emotion recognition, CNN+LSTM, 87% on RAVDESS and TESS', 'Graduated, CGPA 8.45/10', 'Joined Walmart Global Tech as an iOS engineer (SDE II)'] },
  { year: '2023', items: ['Omni ID shipped in the Canada and US apps, Bravo Award'] },
  { year: '2024', items: ['Promoted to Senior Software Engineer, iOS (SDE III); owned identity and post-purchase across markets'] },
  { year: '2025', items: ['Native returns in Canada, passkeys and consent flows'] },
  {
    year: '2026',
    items: [
      'Global Tech Hackathon: Top 20 of 3,000+ with Token-OS and WibeyConductor',
      'MIMO and Walmart Enterprise Brain',
      'Bodega identity account merge launched in Mexico',
      'Making a Difference Award',
      'IIT Kharagpur × Walmart applied-AI program and capstone',
      'VoiceNote (personal project)',
    ],
  },
];

export const awards = [
  { title: 'Making a Difference Award', from: 'Walmart', year: '2026' },
  { title: 'Top 20 of 3,000+', from: 'Walmart Global Tech Hackathon', year: '2026' },
  { title: 'Bravo Award', from: 'Walmart, for Omni ID', year: '' },
  { title: 'Customer Champion badge', from: 'Walmart', year: '' },
];

export const sideProjects = [
  {
    title: 'VoiceNote: Dictate into any App',
    kicker: 'Personal project · Swift, macOS',
    text: 'On-device speech recognition and an on-device LLM sort what you say into notes and todos; OCR reads the text under the pointer. Zero network calls.',
    stack: ['Swift', 'macOS', 'Apple Foundation Models'],
    link: '/work/voicenote/',
  },
  {
    title: 'Sports AI commentary from two local LLMs',
    kicker: 'IIT Kharagpur capstone · Python',
    text: 'Action recognition and game state feed one local LLM that commentates and another that evaluates it, in a feedback loop, fully local.',
    stack: ['Python', 'Local LLMs', 'Action recognition'],
    link: '', // TODO(swapnil): public repo or video, if any
  },
  {
    title: 'Speech emotion recognition',
    kicker: 'M.Tech thesis, IIT (BHU)',
    text: 'CNN+LSTM on MFCC, ZCR and RMS features: 87% accuracy on RAVDESS and TESS.',
    stack: ['Python', 'TensorFlow', 'Librosa'],
    link: '', // TODO(swapnil): public repo or paper, if any
  },
];

export const skillGroups = [
  { name: 'iOS', items: ['Swift', 'SwiftUI', 'UIKit', 'MVVM + Coordinator', 'GraphQL', 'REST', 'XCTest', 'Xcode', 'Universal Links', 'Passkeys', 'VoiceOver'] },
  {
    name: 'AI and ML',
    items: ['LLM agents', 'Multi-agent systems', 'Model Context Protocol (MCP)', 'LLM routing', 'On-device LLMs (Apple Foundation Models)', 'Prompt caching', 'Embeddings', 'RAG', 'Knowledge graphs (Neo4j)', 'Google ADK', 'Core ML', 'TensorFlow', 'Hugging Face', 'Vertex AI'],
  },
  { name: 'Languages and tools', items: ['Swift', 'Python', 'C++', 'FastAPI', 'Claude Agent SDK', 'Firebase', 'Git', 'CI/CD', 'Cursor'] },
  { name: 'Engineering practices', items: ['Feature flags', 'Staged rollouts', 'A/B experiments', 'Analytics', 'Release management', 'Code review', 'Mentoring'] },
];

// Labels for every simulation. Never remove these.
export const labels = {
  toy: 'Toy illustration, not the real model',
  reenacted: 'Re-enacted with sample data',
  sample: 'Illustration with sample data',
};
