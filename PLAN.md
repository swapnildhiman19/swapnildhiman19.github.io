# Portfolio plan — swapnildhiman19.github.io

> Keep the checkboxes below in sync with reality. Tick an item only when it is done and checked.

## What actually shipped vs the first plan

The first build used concept A, "Two Runtimes": a flat hero with a drawn phone and a terminal. On 9 Nov 2026, Swapnil found it too basic next to the benchmark and asked for an immersive 3D, iPhone-like experience that is not the "tap an app" metaphor. The home page was rebuilt as **Exploded View** (`research/concept-3d.md`): a 3D phone that comes apart layer by layer, each layer holding part of the work, with the agent loop as a ring of light behind it. Everything underneath was kept: content, the 17 project pages, demos, SEO, classic view, QA tooling. The résumé became the source of truth for content (`research/content-flags.md`).

## Context — why we are doing this

Two earlier portfolios (an iPhone you step into, a macOS desktop) were memorable, but viewers could not tell within seconds what Swapnil had built. This site shows the work in the first screen *and* is an immersive experience.

## Where things are

| Path | What |
|---|---|
| `research/hardik-teardown.md` | Teardown of Hardik Verma's site, with file:line references and a principle table |
| `research/inspiration.md` | 55-site survey (plus 38 more interactive entries for the 3D pass) |
| `research/concepts.md` | The first three concepts |
| `research/concept-3d.md` | The concept that shipped: Exploded View |
| `research/content-flags.md` | Content decisions and what is still open |
| `qa/` | QA scripts and the QA report |

## Phases

### Phase 1 — Research
- [x] 1.1 Read the résumé and the brief
- [x] 1.2 Teardown of Hardik's site
- [x] 1.3 Wall of Portfolios (wallofportfolios.in) and award-level portfolios; screenshots
- [x] 1.4 Inspiration notes
- [x] 1.5 Content flags

### Phase 2 — Concept
- [x] 2.1 Three concepts with wireframes
- [x] 2.2 Pick: A (Two Runtimes), then the 3D pivot to Exploded View
- [x] 2.3 Content decisions: résumé is the source of truth; PDF published as-is

### Phase 3 — Build
- [x] 3.1 Vite + TypeScript, prerendered routes (home, 17 project pages, classic, 404)
- [x] 3.2 Tokens, self-hosted fonts, light/dark
- [x] 3.3 3D exploded phone (three.js), chapters, labels, live screen, drag-to-spin, hover-to-pick
- [x] 3.4 Agent-loop ring and the routed packet; toy WibeyConductor
- [x] 3.5 Work index, narrated diagrams, iOS tap-through flows (OTP, merge)
- [x] 3.6 Journey, recognition, side projects, toolbox, contact
- [x] 3.7 Classic view, 404, sitemap, robots, llms.txt, JSON-LD, OG image, still image of the 3D scene
- [x] 3.8 Optional synthesized sound (off by default)

### Phase 4 — Test
- [x] 4.1 Screenshots at 390, 1280, 1440 for every page and every 3D chapter
- [x] 4.2 64 real-input checks, zero console errors
- [ ] 4.3 Lighthouse on home + one project page
- [x] 4.4 JavaScript off, reduced motion
- [ ] 4.5 QA report in `qa/REPORT.md`

### Phase 5 — Deploy
- [x] 5.1 README
- [x] 5.2 GitHub Actions workflow, `.nojekyll`, 404
- [ ] 5.3 Ask before creating `swapnildhiman19/swapnildhiman19.github.io` (does not exist yet)
- [ ] 5.4 Show the commit message, ask before every push
- [ ] 5.5 Verify the live URL, deep links and the real 404
