// Unit tests for the toy router. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, commit, EXAMPLES, escalationLevel, MAX_ESCALATIONS, newSession, redo, route } from '../src/shared/router.ts';

test('confidences form a probability distribution', () => {
  const sum = classify('rename this view model').reduce((a, b) => a + b.p, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
});

test('a clear prompt picks its intent above the 0.55 floor', () => {
  const t = route('design a token exchange flow for account linking', newSession());
  assert.equal(t.intent, 'design');
  assert.equal(t.fallback, false);
  assert.ok(t.confidence >= 0.55);
});

test('a vague prompt falls back to the regex rules', () => {
  const t = route('hmm', newSession());
  assert.equal(t.fallback, true);
});

test('the design intent needs the premium tier, so the router upgrades', () => {
  const t = route('design the system architecture', newSession());
  assert.equal(t.routed, 2);
  assert.equal(t.cache.decision, 'upgrade');
});

test('a small task on a warm cache stays on the current model', () => {
  const t = route(EXAMPLES[0], newSession()); // session starts on balanced with 18K cached
  assert.equal(t.wanted, 0);
  assert.equal(t.cache.decision, 'stay');
  assert.equal(t.routed, 1);
  assert.ok(t.cache.switchCost > t.cache.stayCost);
});

test('a small task with a cold cache switches down', () => {
  const t = route(EXAMPLES[0], { ...newSession(), cachedK: 1 });
  assert.equal(t.cache.decision, 'switch');
  assert.equal(t.routed, 0);
});

test('simulated latency stays inside the real 34–61 ms range', () => {
  for (const p of [...EXAMPLES, 'a', 'refactor every file in the project', '???']) {
    const { ms } = route(p, newSession());
    assert.ok(ms >= 34 && ms <= 61, `${p}: ${ms}`);
  }
});

test('redo escalates an intent, capped at 3 per session, with an 8-turn half-life', () => {
  let s = newSession();
  for (let i = 0; i < 5; i++) s = redo(s, 'rename').session;
  assert.equal(s.escalations.length, MAX_ESCALATIONS);
  const before = escalationLevel(s, 'rename');
  for (let i = 0; i < 8; i++) s = commit(s, route('rename x', s));
  const after = escalationLevel(s, 'rename');
  assert.ok(Math.abs(after - before / 2) < 1e-9, `${before} → ${after}`);
});

test('an escalated intent is routed one tier higher', () => {
  const s = redo(newSession(), 'rename').session;
  assert.equal(route('rename this variable', s).wanted, 1);
});
