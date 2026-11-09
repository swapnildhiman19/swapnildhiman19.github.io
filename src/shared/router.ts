// A toy version of WibeyConductor, for the site's demo. It is NOT the real model:
// - intents are matched with keyword counts, not e5-small-v2 embeddings;
// - the five filters and the prices are illustrative;
// - latency is simulated inside the real 34–61 ms range.
// The shape is the real one: intent → confidence (regex fallback below 0.55) → five ordered filters →
// cache-stickiness check → model, plus an escalation memory (max 3 per session, 8-turn half-life).
// Pure functions only, so the same code pre-renders the example trace at build time and runs in the browser.

export type Tier = 0 | 1 | 2;
export const TIERS = ['fast', 'balanced', 'premium'] as const;

export interface Intent {
  id: string;
  words: string[];
  floor: Tier; // lowest tier allowed for this intent
}

// 12 sample intents (the real centroids are not public).
export const INTENTS: Intent[] = [
  { id: 'explain', words: ['explain', 'why', 'what', 'understand', 'mean', 'means', 'does', 'how'], floor: 0 },
  { id: 'rename', words: ['rename', 'name', 'variable', 'symbol', 'call'], floor: 0 },
  { id: 'refactor', words: ['refactor', 'clean', 'extract', 'simplify', 'restructure', 'split', 'move', 'tidy'], floor: 1 },
  { id: 'bugfix', words: ['bug', 'fix', 'crash', 'crashing', 'error', 'fails', 'failing', 'broken', 'exception', 'nil'], floor: 1 },
  { id: 'tests', words: ['test', 'tests', 'unit', 'xctest', 'coverage', 'mock', 'assert', 'snapshot'], floor: 0 },
  { id: 'feature', words: ['add', 'implement', 'create', 'feature', 'screen', 'endpoint', 'support', 'new'], floor: 1 },
  { id: 'review', words: ['review', 'check', 'pr', 'diff', 'feedback', 'audit'], floor: 1 },
  { id: 'docs', words: ['doc', 'docs', 'readme', 'comment', 'comments', 'document', 'changelog'], floor: 0 },
  { id: 'shell', words: ['run', 'install', 'git', 'deploy', 'command', 'script', 'ci', 'build'], floor: 0 },
  { id: 'search', words: ['find', 'where', 'search', 'locate', 'usages', 'callers', 'grep'], floor: 0 },
  { id: 'design', words: ['design', 'architecture', 'plan', 'system', 'tradeoff', 'migrate', 'flow', 'protocol'], floor: 2 },
  { id: 'chat', words: ['hi', 'hello', 'thanks', 'thank', 'joke', 'weather'], floor: 0 },
];

export const CONFIDENCE_FLOOR = 0.55;
export const ESCALATION_HALF_LIFE = 8; // turns
export const MAX_ESCALATIONS = 3; // per session

// Toy prices in cost units per 1K tokens. Cache reads cost 10% of input; cache writes cost 125%.
const PRICE_IN = [1, 3, 15];
const PRICE_OUT = [5, 15, 75];
const WINDOW_K = [64, 200, 200]; // context window in K tokens

export interface Session {
  turn: number;
  tier: Tier; // model the previous turn used
  cachedK: number; // cached prompt prefix, in K tokens
  escalations: { intent: string; turn: number }[];
}

export const newSession = (): Session => ({ turn: 3, tier: 1, cachedK: 18, escalations: [] });

export interface FilterResult {
  n: number;
  name: string;
  detail: string;
  min: Tier; // minimum tier this filter allows
}

export interface Trace {
  prompt: string;
  top: { id: string; p: number }[];
  intent: string;
  confidence: number;
  fallback: boolean;
  filters: FilterResult[];
  wanted: Tier;
  cache: { from: Tier; to: Tier; stayCost: number; switchCost: number; decision: 'stay' | 'switch' | 'upgrade' | 'same' };
  routed: Tier;
  ms: number;
  contextK: number;
}

export const words = (s: string): string[] => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Keyword-count "similarity" turned into probabilities with a softmax (k = 3). */
export function classify(prompt: string): { id: string; p: number }[] {
  const w = words(prompt);
  const raw = INTENTS.map((it) => w.filter((x) => it.words.some((k) => x === k || (k.length > 4 && x.startsWith(k)))).length);
  const ex = raw.map((r) => Math.exp(3 * r));
  const sum = ex.reduce((a, b) => a + b, 0);
  return INTENTS.map((it, i) => ({ id: it.id, p: ex[i] / sum })).sort((a, b) => b.p - a.p);
}

const FALLBACK: [RegExp, string][] = [
  [/\b(test|spec)s?\b/i, 'tests'],
  [/\b(crash\w*|error|fail\w*|bug\w*)\b/i, 'bugfix'],
  [/\b(add|make|build)\b/i, 'feature'],
  [/\?\s*$/, 'explain'],
];

export function escalationLevel(s: Session, intent: string): number {
  return s.escalations
    .filter((e) => e.intent === intent)
    .reduce((acc, e) => acc + Math.pow(0.5, (s.turn - e.turn) / ESCALATION_HALF_LIFE), 0);
}

const clampTier = (n: number): Tier => (Math.max(0, Math.min(2, n)) as Tier);

export function route(prompt: string, s: Session): Trace {
  const top = classify(prompt);
  const best = top[0];
  let intent = best.id;
  let fallback = false;
  if (best.p < CONFIDENCE_FLOOR) {
    fallback = true;
    intent = FALLBACK.find(([re]) => re.test(prompt))?.[1] ?? 'explain';
  }
  const it = INTENTS.find((x) => x.id === intent)!;
  const w = words(prompt);
  const promptK = Math.max(0.2, Math.round(w.length * 1.3) / 1000 + 0.8); // prompt + attached code, toy estimate
  const contextK = Math.round((s.cachedK + promptK) * 10) / 10;

  const f1: FilterResult = { n: 1, name: 'intent floor', detail: `${intent} needs ${TIERS[it.floor]}`, min: it.floor };
  const fitTier = WINDOW_K.findIndex((k) => contextK <= k);
  const f2: FilterResult = { n: 2, name: 'context fits', detail: `${contextK}K tokens`, min: clampTier(fitTier < 0 ? 2 : fitTier) };
  const wide = w.some((x) => ['all', 'across', 'every', 'entire', 'whole', 'files', 'codebase', 'project'].includes(x));
  const f3: FilterResult = { n: 3, name: 'scope', detail: wide ? 'many files' : 'one file', min: wide ? 1 : 0 };
  const level = escalationLevel(s, intent);
  const bump = level >= 0.5 ? 1 : 0;
  const f4: FilterResult = {
    n: 4,
    name: 'escalation memory',
    detail: level > 0 ? `${intent} redone, level ${level.toFixed(2)}` : 'none',
    min: clampTier(it.floor + bump),
  };
  const wanted = clampTier(Math.max(f1.min, f2.min, f3.min, f4.min));
  const f5: FilterResult = { n: 5, name: 'cheapest that passes', detail: TIERS[wanted], min: wanted };

  // Cache-stickiness: a downgrade only happens when it is cheaper even after rebuilding the cache.
  const outK = 0.5;
  const cost = (t: Tier, cachedRead: boolean) =>
    s.cachedK * PRICE_IN[t] * (cachedRead ? 0.1 : 1.25) + promptK * PRICE_IN[t] + outK * PRICE_OUT[t];
  const stayCost = Math.round(cost(s.tier, true) * 10) / 10;
  const switchCost = Math.round(cost(wanted, false) * 10) / 10;
  let decision: Trace['cache']['decision'];
  let routed: Tier;
  if (wanted === s.tier) { decision = 'same'; routed = wanted; }
  else if (wanted > s.tier) { decision = 'upgrade'; routed = wanted; }
  else if (switchCost < stayCost) { decision = 'switch'; routed = wanted; }
  else { decision = 'stay'; routed = s.tier; }

  return {
    prompt,
    top: top.slice(0, 3),
    intent,
    confidence: best.p,
    fallback,
    filters: [f1, f2, f3, f4, f5],
    wanted,
    cache: { from: s.tier, to: wanted, stayCost, switchCost, decision },
    routed,
    ms: 34 + (hash(prompt.trim().toLowerCase()) % 28),
    contextK,
  };
}

/** Apply a routed turn to the session: the routed model now holds the cache, which grows a little each turn. */
export function commit(s: Session, t: Trace): Session {
  return { turn: s.turn + 1, tier: t.routed, cachedK: Math.round((s.cachedK + 1.2) * 10) / 10, escalations: s.escalations };
}

/** The visitor pressed "Redo": escalate the last turn's intent, at most 3 times per session. */
export function redo(s: Session, intent: string): { session: Session; accepted: boolean } {
  if (s.escalations.length >= MAX_ESCALATIONS) return { session: s, accepted: false };
  return { session: { ...s, escalations: [...s.escalations, { intent, turn: s.turn }] }, accepted: true };
}

export const EXAMPLES = [
  'rename this view model',
  'why is checkout crashing on launch?',
  'design a token exchange flow for account linking',
  'write unit tests for the OTP screen',
];
