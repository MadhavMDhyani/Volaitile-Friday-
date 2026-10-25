# SPEC.md — Quick Fixes Specification

Status: FINALIZED

> **Planning Lock**: This specification is finalized and approved for execution across 7 tasks.

---

## 1. Vision & Scope
Implement 7 maintenance and polish tasks for "Volaitile Friday" without introducing new features, altering existing app behavior, or adding new colors outside the existing orange/grey palette (`#140d09`, `--accent-rgb: 217 138 90`, etc.).

---

## 2. Tasks Summary

### Task 1 — Security Audit
- Run `npm audit fix` (strictly without `--force`) in `/Backend` (target: `body-parser` high advisory).
- Run `npm audit fix` (strictly without `--force`) in `/frontend` (target: `follow-redirects` high advisory pulled in by `axios`).
- Run test suites: backend `npm test`, frontend `npm run lint`, and frontend `npm run build`.
- Document any remaining advisories and why they persist.

### Task 2 — Head Metadata & Social Preview
- Update `frontend/index.html`:
  - Change `theme-color` meta tag from `#111111` to `#140d09`.
  - Add Open Graph image (`og:image`) and Twitter image (`twitter:image`) pointing to `/og-image.png`.
  - Add `twitter:card` meta tag set to `summary_large_image`.
- Generate `frontend/public/og-image.png` (dimensions: 1200x630):
  - Dark background `#140d09`.
  - Include logo mark and Anton font wordmark.
  - Headline: "Code together. Ask Friday. Ship faster."
  - Use only existing palette colors.
  - Method: build throwaway static HTML page, capture screenshot at 1200x630 using browser subagent, save to `frontend/public/og-image.png`, and remove throwaway HTML file.

### Task 3 — Hero Text & Color Tokens
- `frontend/src/components/landing/Hero.jsx`: Remove "v2.0" text from the top pill badge; preserve the rest of the pill.
- `frontend/src/index.css`: Add `--accent-rgb: 217 138 90;` to `:root`.
- In `/frontend/src`: Replace all stray hardcoded orange colors (e.g. `rgba(255,87,34,...)`, `#ff5722`, etc. in shadows, glows, and drop-shadows) with `rgb(var(--accent-rgb) / <alpha>)` or equivalent Tailwind accent opacity classes, retaining exact alpha values.
- Verify via grep that no stray hardcoded orange values remain in `/frontend/src`.

### Task 4 — Self-host IBM Plex Fonts
- Install font packages in `/frontend`: `@fontsource/ibm-plex-sans` and `@fontsource/ibm-plex-mono`.
- In `frontend/src/main.jsx`: Import sans weights (400, 500, 600, 700) and mono weights (400, 500, 600) alongside Anton.
- In `frontend/index.html`: Remove Google Fonts stylesheet link (`fonts.googleapis.com`) and preconnect links (`fonts.gstatic.com`).
- Retain font-family names "IBM Plex Sans" and "IBM Plex Mono" in Tailwind configuration and CSS.
- Verify in browser that fonts render identically and no requests are sent to `fonts.googleapis.com` or `fonts.gstatic.com`.

### Task 5 — Line Endings
- Add root `.gitattributes` containing `* text=auto eol=lf`.
- Do NOT run `git add --renormalize` and do NOT rewrite existing repository files.

### Task 6 — Docker Compose
- In `docker-compose.yml`: Update backend `env_file` definition to long-form syntax:
  ```yaml
  env_file:
    - path: Backend/.env
      required: false
  ```
- In `README.md`:
  - Replace all occurrences of `docker-compose` with `docker compose`.
  - Add an instruction guiding users to copy `Backend/.env.example` to `Backend/.env` before running compose.
- Run `docker compose config` to validate configuration syntax (or document if Docker CLI is unavailable).

### Task 7 — CI Workflow
- In `.github/workflows/ci.yml`:
  - Ensure the frontend CI job runs `npm ci`, `npm run lint`, and `npm run build`.
  - Add the `build` step if missing, leaving other steps and jobs unchanged.

---

## 3. Constraints & Validation Criteria
- One git commit per task using Conventional Commits: `type(scope): description`.
- PowerShell-safe commands only (no multi-command `&&` or `||` chaining).
- Zero secrets committed or printed.
- Preserved orange/grey palette; no new color tokens.
- Baseline requirements passed after every task:
  - Backend: 40 tests passing (`npm test`).
  - Frontend: `npm run lint` clean (0 errors, 0 warnings).
  - Frontend: `npm run build` cleanly bundles.
- Empirical proof captured for all changes: terminal command outputs and UI screenshots.

---

## Phase 3 — Landscape Hero

### Overview & Goal
Add ThreeUI's `<LandscapeScene variant="sunset" />` as the landing-page hero background using its EXACT registered source (source revision `e8aab488464bcd44471c390cf309597c6f3adb05`), themed to the site palette (page `#140d09`, accent `#d98a5a`, glow `#f0b088`, text `#f3e6da`), without compromising readability or performance.

### Task 1 — Import the Exact Source
- Fetch complete bundle from `https://threeui.com/source-code/landscape.json`.
- Compare bundle files against registered list and SHA-256 hashes:
  - `src/shaders/landscape/LandscapeScene.tsx` (`7d0bf43cc29a5c43df2a3f84d60c6ea9a86b64f538a96cbec274f0a8d531bf1c`) -> `/frontend/src/components/landing/landscape/LandscapeScene.tsx`
  - `public/landscape.html` (`36673210dd79a53ce691c1633a21502a8df57307a7fe501d1305947ae191414a`) and referenced runtime assets -> `/frontend/public/`
  - `src/shaders/threeui.css` (`efe4447139f1358dd8e9be68edf6fa46cbefbd1de423a4d6c439ca61d2c8eccf`) -> `/frontend/src/components/landing/landscape/threeui.css`
  - `src/shaders/japanese-tower/Towers.html` (`7810e7163c027f654235032fb1eed48846b68bf80f5b1c1c4292e01694b71f3d`) -> `/frontend/third_party/threeui/Towers.html`
  - `scripts/generate-landscape.mjs` (`cb8b941df15e87bb52c7ae89ee0e0c9804758bd3e8ef1f61f388538ea80adf73`) -> `/frontend/third_party/threeui/generate-landscape.mjs`
  - Provenance README at `/frontend/third_party/threeui/README.md`.
- Verify each file hash via `Get-FileHash -Algorithm SHA256`.
- Add registered files to `.gitattributes` as `-text`.
- Install dependencies ONLY if imported by registered files (`@designcodeio/threeui`, `three`).
- Check `threeui.css` for global selectors; scope under `.shader-frame` if conflicts arise.

### Task 2 — Hero Integration (`Hero.jsx` + `HeroScene.jsx`)
- Create `HeroScene.jsx`: absolutely positioned layer behind hero content (`inset-x-0 top-0`, `min-h-[640px] h-[100svh]`, `aria-hidden`), sibling to (never ancestor of) any `backdrop-filter` elements like `ProductMockup`.
- Poster-first loading: render static CSS poster gradient (`#140d09` -> `#2a1a11` -> `#7a4a30` -> `#d98a5a`/`#f0b088` glow).
- Guard mounting: viewport >= 768px, no prefers-reduced-motion, no `saveData`, document visible, IntersectionObserver with 200px margin, mounted after first paint via `requestIdleCallback` (300ms fallback).
- Unmount WebGL context when hero is >1 viewport away.
- Pointer events handling between scene and interactive elements.
- Soft center scrim and bottom 30% fade into `--page-rgb: 20 13 9` (`#140d09`). Contrast >= 4.5:1 at 1440px, 768px, and 390px.

### Task 3 — Theme to Site Palette
- Step A: Non-invasive overlay gradients, center scrim, and edge vignette in page color `#140d09`. No CSS filters or backdrop-filters over iframe.
- Step B (conditional): If sunset sky retains non-palette hues, update color-valued constants of the `sunset` preset in `public/landscape.html` in a dedicated commit `style(landscape): theme sunset palette to site tokens`.

### Task 4 — Production Headers
- In `frontend/vercel.json`, update `X-Frame-Options` from `DENY` to `SAMEORIGIN`.
- Build and run `npm run preview`, verify `Invoke-WebRequest http://localhost:4173/landscape.html` returns 200 and scene HTML.
- Note SPA fallback behavior and CDN dependencies if any.

### Task 5 — Performance and Verification
- FPS probe testing at 1440x900 on hero and scroll: average FPS >= 55, no frame > 50ms.
- Verify scene unmounting when scrolled away and remounting on return.
- Emulate `prefers-reduced-motion` and 390px mobile viewport: verify poster-only fallback.
- Clean console (no 404s, CORS, or frame errors).
- Capture UI screenshots at 1440px, 768px, 390px.
- Confirm all tests, lint, and build pass cleanly; report bundle size delta.

---

## Sign-in reliability

**Status: FINALIZED**

Branch: `fix/signin-reliability`

### Root-cause summary
| Cause | Evidence | Fix |
|---|---|---|
| `process.exit(1)` on first DB connect failure | `db.js:32` | Retry loop w/ exponential backoff |
| `serverSelectionTimeoutMS: 5000` â€” too short for Atlas cold start | `db.js:27` | Raise to 15 000 ms, `maxPoolSize: 10` |
| No DB readiness guard on API routes | `app.js` â€” no middleware before routers | `dbReady` middleware returning 503 + Retry-After |
| No request ID tracing | `app.js`, controllers â€” no x-request-id | `requestId` middleware + expose header in CORS |
| `loginController` catch returns generic 500 for all errors | `user.controller.js:105` | Map Mongo network/selection errors to 503 |
| Rate limiter counts 5xx/503 against quota | `user.routes.js:12` `skipSuccessfulRequests` | `requestWasSuccessful: res.statusCode < 400 || res.statusCode >= 500` |
| `CLIENT_URL` not normalized (trailing slash / path strips CORS match) | `env.js:32` | `new URL(entry).origin` normalization |
| `validateEnv` exits on first error only | `env.js:7-20` | Collect all errors, report once |
| No Axios timeout or retry | `axios.js:10-12` | 15 s timeout, opt-in `retryOnWake` for login/GET/ping |
| No server pre-warm | `App.jsx` | Fire-and-forget GET /health/ping once per 10 min via sessionStorage |
| Render free plan cold starts (~30 s) not surfaced to user | `Login.jsx` | "Waking up the serverâ€¦" banner during retries |
| No keep-warm scheduled job | â€” | `.github/workflows/keep-warm.yml` every 10 min |

### Task 1 â€” Diagnose (no code changes)
Read db.js, env.js, app.js, user.controller.js, user.routes.js, axios.js, Login.jsx, user.context.jsx, health.routes.js. Produce root-cause table.

### Task 2 â€” Resilient DB connection (db.js, app.js)
- Replace `process.exit(1)` on failed connect with retry loop: exponential backoff 1 s doubling to 30 s cap. Log attempt number; never log URI.
- Keep fail-fast for missing `MONGODB_URI`.
- `serverSelectionTimeoutMS: 15000`, `maxPoolSize: 10`.
- `/health/ping` remains pure liveness (Render healthCheckPath).
- `/health/ready` returns 503 until `mongoose.connection.readyState === 1`.
- Add `dbReady` middleware before all routers and rate limiters (except `/health`): 503 `{ error: "Service is starting, please retry", code: "DB_UNAVAILABLE" }` + `Retry-After: 5` header.

### Task 3 â€” Request IDs and clear errors (app.js, user.controller.js)
- `requestId` middleware: `crypto.randomUUID()`; accept incoming `x-request-id` only if safe (<=36 alphanumeric/hyphen chars); return as `x-request-id` response header.
- Expose `x-request-id` in CORS `exposedHeaders`.
- Map `MongoServerSelectionError`, `MongoNetworkError`, buffering-timeout to 503 `DB_UNAVAILABLE` + Retry-After in `loginController`, `registerController`, and global error handler.
- Log real error + requestId server-side; never log passwords, tokens, or full emails.

### Task 4 â€” Rate limiter fix (routes/user.routes.js + tests)
- `loginLimiter` and `registerLimiter`: add `requestWasSuccessful: (req, res) => res.statusCode < 400 || res.statusCode >= 500` so 5xx/503 never consume attempts; 401/400 still do.
- Keep `max`, `windowMs`, messages unchanged.
- Add tests: 5x 503 responses do not trigger 429; wrong password still counts toward limit.

### Task 5 â€” CORS origin normalization (config/env.js, app.js + tests)
- Normalize each `CLIENT_URL` entry with `new URL(entry).origin`; skip invalid entries with a `console.warn`; log final allowed origins at startup.
- `validateEnv`: collect all errors before exiting; warn (don't exit) when `TRUST_PROXY` unset in production.
- Add tests: normalization, 403 CORS rejection.

### Task 6 â€” Wake-aware frontend (axios.js, Login.jsx, utils/getErrorMessage.js, App.jsx)
- Axios: 15 000 ms default timeout; opt-in `retryOnWake: true` for login, GET, /health/ping.
- Retry only on no-response or 502/503/504; delays 2 s, 4 s, 8 s, 12 s, 12 s; honor Retry-After.
- Never retry 4xx; cancel on unmount via AbortController.
- Fast no-response while online (< 1 s): retry at most once, then show error.
- Login screen: "Waking up the serverâ€¦ this can take up to a minute." banner with attempt count during retries.
- Pre-warm: fire-and-forget GET /health/ping on first app load; at most once per 10 min via sessionStorage.
- Extend `getErrorMessage.js`: 401 -> "Invalid email or password"; 429 -> "Too many attempts. Try again in N minutes" (Retry-After); 503/no-response -> "Can't reach the server right now"; 500 -> "Something went wrong (ref: <requestId>)". console.warn hint on fast no-response while online.

### Task 7 â€” Keep-warm GitHub workflow
- `.github/workflows/keep-warm.yml`: `schedule` every 10 min + `workflow_dispatch`.
- `curl -fsS --max-time 60 "$BACKEND_URL/health/ping"` (read from vars.BACKEND_URL).
- If `BACKEND_URL` unset, print notice and exit 0.

### Task 8 â€” Verification
Show: wake scenario, DB_UNAVAILABLE rate-limit proof, wrong-password 401, CLIENT_URL trailing-slash CORS, new test count, lint+build pass.
