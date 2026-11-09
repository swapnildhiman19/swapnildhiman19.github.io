# QA report — 9 Nov 2026

**State: passing.** Built output (`npm run build`), served with `vite preview` at http://localhost:4173, tested in Google Chrome (headless, real GPU for WebGL). Re-run in full after the phone rebuild (below).

## The phone rebuild (9 Nov, evening)

The first 3D phone was built from boxes in code and did not look like an iPhone, front or back. It was replaced:

- **Outside:** "iPhone 16 Pro Max" by MajdyModels (Sketchfab, CC BY 4.0), credited under the stage and in the README. `scripts/phone-model.mjs` removes the Apple logo and wallpaper and compresses it: 7.6 MB → 556 KB.
- **Screens:** six iOS screens drawn to real iOS sizes (`src/client/xp/screens.ts`): a lock screen whose notifications are the headline numbers, Omni ID, account merge, Tempo modules, VoiceNote, Conductor. Each simulated app carries "Illustration with sample data". Flat check: `/qa/screens.html` on the dev server.
- **Inside:** my own logic board, chip (Secure Enclave and Neural Engine regions) and battery, so the teardown uses real parts.
- **Load order:** the 3D scene now starts after the page's `load` event, in an idle moment, and the still image has high priority. Without this, the model competed with the first paint and mobile LCP rose to 2.9 s (Perf 95); with it, 2.0 s (Perf 99).
- **Found and fixed while rebuilding:** removing the wallpaper also dropped the screen's texture coordinates, so the screen was see-through; the screen now gets fresh coordinates at load. Removing the logo left a logo-shaped hole; the hole is now filled with the back glass's own material. The classic view preloaded three web fonts it never uses; it no longer does (3 console warnings → 0).

## Results at a glance

| Check | Result | Evidence |
|---|---|---|
| Lighthouse, home, desktop | Perf 100 · A11y 100 · BP 100 · SEO 100 · LCP 0.4 s · TBT 10 ms · CLS 0 | `lighthouse/desktop-home.report.html` |
| Lighthouse, home, mobile (throttled) | Perf 99 · A11y 100 · BP 100 · SEO 100 · LCP 2.0 s · TBT 50 ms · CLS 0 | `lighthouse/mobile-home.report.html` |
| Lighthouse, project page, desktop | 100 · 100 · 100 · 100 | `lighthouse/desktop-project.report.html` |
| Lighthouse, project page, mobile | 100 · 100 · 100 · 100 · LCP 0.8 s | `lighthouse/mobile-project.report.html` |
| Real-input interaction checks | **64 / 64 pass** | `interact/results.json` |
| Every page at 390, 1280, 1440 wide (20 pages × 3) | 60 / 60: no console errors, no horizontal overflow | `screens/report.json` (screenshots git-ignored, regenerate with `npm run qa:shots`) |
| Every 3D chapter at 1440 and 390 | 16 screenshots, no console errors | `xp/` |
| Toy router unit tests | 9 / 9 pass | `npm test` |
| JavaScript off | Name, numbers, all 17 projects, diagrams and the classic view readable; still image of the phone shown | `interact/nojs-home.png` |
| Reduced motion | No reveal hiding, no autoplay, trace appears at once, nothing sways | `interact/results.json` |

## Bugs QA found, and what would have happened without the fix

| # | What a visitor would have hit | Fix |
|---|---|---|
| 1 | **The QR countdown never moved.** The phone showed "Expires in 0:20" forever, so the "living" identity code looked dead. Cause: the frame loop reset its clock every frame, so each frame measured zero time. | The loop keeps its clock between frames (`src/client/qr.ts`). |
| 2 | **Retyping a wrong one-time code did nothing.** After "That code doesn't match", the six boxes kept the wrong digits, and each box only takes one character, so typing the right code was silently ignored. | A wrong code clears the boxes and focuses the first; focusing a filled box selects it (`src/client/flows.ts`). |
| 3 | **"Pause motion" still showed with reduced motion on**, for a scene that does not move. Cause: a CSS `display` rule beat the `hidden` attribute. | `[hidden] { display: none !important }` (`src/styles/base.css`). |
| 4 | **The header stayed light over the dark 3D stage** at the top of the page. Cause: the observer's detection band had zero height. | A thin band at the top of the viewport (`src/client/main.ts`). |
| 5 | **Text jumped when fonts arrived** (layout shift 0.10 on mobile). | The three first-screen fonts are preloaded at build time (`vite.config.ts`); CLS is now 0. |
| 6 | **The rail could jump to the wrong place**: the section and the chapters shared one attribute name. | The active chapter is stored as `data-active`. |
| 7 | Overlapping labels in the exploded view and on the tier rings; the phone's caption over the terminal on phones; arrows through boxes in the WibeyConductor diagram; low-contrast dimmed iOS notes; white-on-white nav pill on the dark header. | Fixed and re-shot (see `xp/`). |

## What the 64 interaction checks cover

- **3D:** scene renders and replaces the still image; every chapter becomes active as you scroll; labels appear; the rail jumps to a chapter; pause motion toggles.
- **Toy router:** a typed prompt routes to premium; screen-reader summary; session turn advances; example buttons; regex fallback for a vague prompt; redo capped at 3; at most 4 traces kept.
- **Living QR (Omni ID page):** expand sheet, Escape closes it, focus returns, the code expires after the sample 20 s, refresh gives a new code.
- **Theme and sound:** theme toggles and is remembered after reload; sound is off by default and toggles.
- **Diagram player:** next, previous, focus highlight, 2× speed.
- **iOS flows (phone size, touch):** wrong code error, right code links (low risk), high risk adds a step-up, merge preview after email step-up, success after token exchange; mobile menu opens and closes.
- **Keyboard:** first Tab reaches "Skip to content"; 60 Tabs reach 60 distinct controls; 59 / 60 show an outline focus ring; the 60th is the toy router's text field, whose focus is shown instead by its whole input box turning green (`:focus-within`).
- **No JavaScript, reduced motion, deep links, 404 page, and every public file** (sitemap, robots, llms.txt, OG image, favicon, résumé PDF).

## Not covered here

- **The real 404 for unknown paths.** GitHub Pages serves `404.html` for any missing URL; the local preview server does not. Checked after deploy.
- **Real phones.** Mobile was tested with Chrome's phone emulation (390 × 844, touch). Safari on a real iPhone should be checked after deploy, especially WebGL performance on older devices.
- **Screen readers** were not run end to end; semantics, labels and live regions were checked in code and by the accessibility audit.
