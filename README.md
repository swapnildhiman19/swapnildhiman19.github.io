# swapnildhiman19.github.io

Swapnil Dhiman's portfolio: **"I build for two runtimes: the phone in your hand and the agent loop behind it."**

The home page is a teardown of an iPhone in 3D (three.js). It opens on the lock screen, whose notifications are the headline numbers. As you scroll, the phone comes apart, and each real part holds one part of the work:

| Part | Work |
|---|---|
| 01 Display | Omni ID, Native Post Purchase, Delivery Pass |
| 02 Secure Enclave | Bodega merge, Global One App linking, consent merge, passkeys, phone verification |
| 03 Neural Engine | VoiceNote, on-device fraud detection, Core AI proposal |
| 04 Logic board | MVVM + Coordinator refactor, Tempo CMS plugins |
| 05 Antennas, and the loop behind them | WibeyConductor, Token-OS, MIMO, Enterprise Brain |

### The phone model (credit)

The outside of the phone is **"iPhone 16 Pro Max" by [MajdyModels](https://sketchfab.com/MG990)**, from [Sketchfab](https://sketchfab.com/3d-models/iphone-16-pro-max-41a071ae12794b668502f58d1e0fd1a3), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Changes: the Apple logo and the wallpaper were removed, and the file was compressed (`scripts/phone-model.mjs`). The screens, the logic board, chip and battery, and the lighting are drawn in code here. The site credits the model under the 3D stage.

To rebuild `public/models/phone.glb`: download the GLB (4k textures) from that page into `assets-src/iphone_16_pro_max.glb` (not committed), then run `npm run model`.

The last chapter is a toy of WibeyConductor: type a coding request, see the intent, the five filters and the cache decision, and watch a packet take the chosen tier's lane around the loop. It is labelled as a toy everywhere.

Everything is real, prerendered HTML first. Without WebGL or JavaScript the page shows a still image of the phone and every chapter as plain text.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + static build into dist/
npm run preview    # serve dist/ at http://localhost:4173
npm test           # unit tests for the toy router
```

## Edit the content

All text lives in **`src/data.ts`**: name, numbers, projects, the five layers, diagrams, journey, awards, side projects, skills. Change it there; the pages, `llms.txt`, `sitemap.xml`, JSON-LD and the classic view all update from it.

- A new project: add an entry to `projects` (it gets its own page at `/work/<slug>/`), then list its slug in one of the `layers`.
- Every number must come from the résumé. Every simulation keeps its label (`labels` in `data.ts`).

## How it is built

| Path | What |
|---|---|
| `src/data.ts` | All content |
| `src/render/` | HTML templates (TypeScript functions). `pages.ts` is the route table |
| `vite.config.ts` | Turns every route into a static HTML file; writes `sitemap.xml`, `robots.txt`, `llms.txt` |
| `src/client/main.ts` | Theme, header, sound, reveal; loads the 3D scene and the demos |
| `src/client/xp/` | The 3D experience: `phone.ts` (loads the model, splits it into layers, adds the inside), `scene.ts` (studio light, poses, loop ring, labels, interaction), `screens.ts` (the live iOS screens, drawn to real iOS sizes), `textures.ts` (board and chip) |
| `public/models/phone.glb` | The phone model, compressed (556 KB) |
| `scripts/phone-model.mjs` | Builds `phone.glb` from the downloaded model (`npm run model`) |
| `src/shared/router.ts` | The toy router's logic (pure functions, unit-tested in `tests/`) |
| `src/styles/` | CSS, one file per area; tokens in `tokens.css` |
| `public/` | Résumé PDF, favicon, OG image, the 3D still image, `.nojekyll` |
| `scripts/og.mjs` | Regenerates `public/og.png` and the touch icon (`npm run og`) |
| `qa/` | Playwright scripts: screenshots, real-input interaction checks, chapter shots, QA report |

No runtime CDN calls, no trackers, no cookies. Fonts are self-hosted (Geist, Geist Mono, Instrument Serif via `@fontsource`). Sound is off by default and synthesized with Web Audio.

## Quality checks

```bash
npm run build && npm run preview     # in one terminal
npm run qa:interact                   # 64 real-input checks (needs Google Chrome)
npm run qa:shots                      # every page at 390, 1280 and 1440 wide
npm run qa:xp                         # every 3D chapter
npx lighthouse http://localhost:4173/ --view
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`: install, test, build, and publish `dist/` to GitHub Pages. In the repository settings, Pages must use **GitHub Actions** as the source. The site is a user site, so Vite's `base` is `/`. Every route is a real file (`/work/<slug>/index.html`), so deep links work without an SPA fallback, and `404.html` handles unknown paths.
