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

## Phase 4 — Mobile, Pages and Content

### Overview & Goal
1. Landing page contains ONLY the hero (nav, headline, CTAs, "Built with" chips, product mockup hosting HeroScene), followed by a slim footer.
2. Content sections move to separate public pages (`/about`, `/features`, `/how-it-works`, `/why-friday`, `/faq`), lazy-loaded in separate chunks.
3. Fix ProductMockup styling, model pill alignment, and code preview.
4. Verify and correct all claims against backend code (no invented metrics or unbacked claims).
5. Comprehensive mobile responsiveness across all viewports (360px up to desktop), touch targets >= 44px, input font size >= 16px, bottom panel navigation on mobile project view.
6. Rigorous verification: direct route loads, responsive screenshots, Lighthouse audits, zero lint/build regressions.

### Task 1 — Routes and Shared Layout
- Create `components/landing/InfoPageLayout.jsx`: `LandingNav` + `<main id="main-content">` + compact CTA band (reused FinalCTA, shorter) + `Footer`.
- Create `usePageMeta({ title, description })` hook and `ScrollToTop` component mounted in `BrowserRouter`.
- Create screens: `About.jsx`, `Features.jsx`, `HowItWorks.jsx`, `WhyFriday.jsx`, `Faq.jsx` (one `<h1>` per page).
- Register lazy routes in `AppRoutes.jsx` outside ProtectedRoute and GuestRoute.
- In `LandingNav`: replace `#anchor` links with `NavLink` to `/features`, `/how-it-works`, `/why-friday`, `/about`, `/faq` (active style, `aria-current="page"`). Logged-in users see "Open dashboard" instead of Log in / Get started. Full-screen mobile glass sheet navigation (hamburger, `aria-expanded`, `aria-controls`, >= 48px item height, closes on route change and Escape, scroll-lock).
- Hero "Explore features" links to `/features`. Footer links all 5 pages + Log in / Register (<= 2 rows on mobile).
- Ensure direct loads and refreshes work in preview and static host configuration.

### Task 2 — Trim the Landing Page
- `Landing.jsx` renders only `LandingNav`, `Hero` (with `HeroScene`, chips, `ProductMockup`), and slim `Footer`.
- Tighten Hero spacing so at 1440x900 whole page is <= 2 viewport heights, ending right after mockup and footer on mobile.
- Set `py-12 sm:py-16` section spacing on info pages without bottom dead space.
- Measure and record `document.scrollHeight` before and after at 1440x900 and 390x844.

### Task 3 — Mockup and Hero Fixes
- Add `text-left` on mockup root in `ProductMockup.jsx` to prevent inheriting `text-center`. Fixed-width right-aligned `tabular-nums` line-number gutter.
- Reposition "Room Presence" pill and model chip to prevent overlap at any width.
- Model chip text: "Friday AI · Auto". Demo code snippet: excerpt from real `Backend/middleware/auth.middleware.js`.
- Hero subhead: balance text wrapping and use non-breaking hyphen for "context-aware".
- Mobile mockup: hide file explorer column below 768px, Code / Chat tab toggle, cap height at ~420px with internal scroll, keep floating pills in viewport.

### Task 4 — Make Every Claim True
- `FeatureBento.jsx`: remove "Latency: 280ms"; "Models: Fast · Balanced · Deep"; replace "Sub-millisecond room broadcasts" with "Live room broadcasts over Socket.IO"; retain "Rate limit: 20 req/min".
- `ChatDemo.jsx`: "Gemini 2.5 Flash" -> "Gemini"; "Responses stream in real-time" -> "Replies are shared with the whole room".
- `FAQ.jsx`: "Google Gemini 2.5 models" -> "Google Gemini models (Fast, Balanced and Deep modes)". Validate all room/chat/file limits against backend code (25 members, 100 files, 200 KB per file, rate limits) and align exactly.
- `Hero.jsx`: "MongoDB 7" -> "MongoDB"; "Redis 7" -> "Redis (optional)".
- `Benefits.jsx`: heading -> "Why Volaitile Friday"; remove "Built for developers >" faux link.
- Align card headings and body text across rows (equal min-height or items-start). No invented numbers, customers, testimonials or metrics.

### Task 5 — Mobile Responsiveness for the Whole App
- Global: `index.html` viewport `width=device-width, initial-scale=1, viewport-fit=cover`, `100dvh`/`100svh`, safe area padding (`env(safe-area-inset-*)`).
- No horizontal overflow at 360px. Touch targets >= 44px. Inputs/textareas/selects font-size >= 16px on mobile. `overscroll-behavior: contain` on scroll panels. Skip hover-only effects on `(hover: none)`.
- `CinderBackground`: cap particles at ~40% below 768px, static on reduced-motion.
- Login/Register: single column, collapsed header for info panel, keyboard-friendly.
- Home/Dashboard: StatCards responsive grid (2 cols -> 1 col), ProjectGrid 1 col on mobile, truncate headers and AccountMenu cleanly.
- Project page: below 1024px show ONE panel at a time with bottom tab bar (Files / Editor / Chat; safe-area aware, >= 48px, persistent tab). Horizontally scrollable editor. Pinned bottom chat composer fitting input, model picker, and send button on 360px without keyboard overlap. Full-width Members sheet and modals <= 90dvh. ProjectHeader responsive overflow menu.

### Task 6 — Verification
- Responsive screenshots at 360x640, 390x844, 768x1024, 1024x768, and 1440x900 for all specified pages and states.
- Automated check: `document.documentElement.scrollWidth <= clientWidth`, tap targets >= 44px, computed input font-size >= 16px.
- Refresh direct URL routes as guest and authenticated user.
- Grep checks for removed claims ("280ms", "Sub-millisecond", "stream in real-time", "2.5", "7'").
- Lighthouse mobile audit on `/` and `/faq` (Perf >= 85, A11y >= 95, CLS <= 0.1).
- End-to-end user sanity: sign-in, project creation, file editing, chat. Clean lint and build; chunk sizes reported.

---

## Phase 5 — Menu Sheet

### Overview & Goal
Transform the landing page into a clean, minimalist hero (navigation, headline, CTAs, "Built with" chips, product mockup) plus a slim footer with minimal vertical scrolling (~1.25x viewport height at 1440x900, ~2x at 390x844). All informational content (About, Features, How it works, Why Friday, FAQ) is consolidated inside an accessible, high-performance translucent glass MenuSheet opened by a single three-bars (hamburger) button in the navigation or links in the footer. The sheet's open state and active tab are synchronized with the URL routes (`/`, `/about`, `/features`, `/how-it-works`, `/why-friday`, `/faq`) as the single source of truth.

### Task 1 — Menu Sheet Component (`components/landing/MenuSheet.jsx`)
- Dialog pattern (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`).
- Tab navigation following ARIA tabs pattern:
  - `role="tablist"`
  - `role="tab"`, `id="tab-<key>"`, `aria-controls="panel-<key>"`, `aria-selected`, roving `tabIndex`
  - `role="tabpanel"`, `id="panel-<key>"`, `aria-labelledby="tab-<key>"`, `tabIndex={0}`
  - Keyboard navigation: Left/Right/Up/Down/Home/End keys for roving tabindex and tab switching.
- Five tabs: About, Features, How it works, Why Friday, FAQ.
- Reuse existing section content:
  - About (Pillars, Who it's for, Tech stack)
  - Features (`FeatureBento`)
  - How it works (`HowItWorks` + `ChatDemo`)
  - Why Friday (`Benefits`)
  - FAQ (`FAQ` accordion)
  - Wrapped in compact layouts without duplicating copy.
- Full accessibility:
  - Focus trap keeping focus within the dialog while active.
  - Escape closes sheet and returns focus to the three-bars button.
  - Main content inert / aria-hidden when open.
  - Body scroll locked when open.
- Responsive layout:
  - Desktop (>= 768px): Centered glass panel, max-width ~960px, max-height 82dvh, vertical tabs on left, compact content on right (tight spacing, 2-column grids) with internal scrolling (`overflow-y: auto; overscroll-behavior: contain`).
  - Mobile (< 768px): Full-screen sheet (100dvh, safe-area insets), top horizontal snap-scrolling tab strip (items >= 44px tall), content area scrolling below, close button >= 44px, bottom auth CTAs ("Log in" & "Get started" or "Open dashboard").
- Visual design: Translucent glass tokens (`glass`, `glass-strong`, `bg-page/80`, etc.), accent color for active tab, no new hardcoded colors.

### Task 2 — Nav and URL Sync (`LandingNav.jsx`, `AppRoutes.jsx`, `Landing.jsx`)
- Replace inline desktop navigation links with one three-bars button across all viewports (`aria-label="Open menu"`, `aria-expanded`, `aria-controls`).
  - Nav layout: Logo left; Right: "Log in", "Get started", and three-bars button (on mobile: "Get started" and three-bars button).
  - Animate three bars into an X using CSS transforms only.
- URL as single source of truth:
  - `/` = sheet closed.
  - `/about`, `/features`, `/how-it-works`, `/why-friday`, `/faq` = sheet open on corresponding tab.
  - All routes (plus `/welcome`) render lazy-loaded `Landing`.
  - Tab switching navigates to URL; closing navigates back to `/`. Browser back button closes sheet.
  - Direct loads and refreshes work without 404 (covered by SPA rewrites).
  - Retain `RootRoute` behavior (authenticated users see `Home` at `/`).
- Update document title and meta description per tab using `usePageMeta` hook; revert to default when closed.
- Delete separate page screens (`About.jsx`, `Features.jsx`, `HowItWorks.jsx`, `WhyFriday.jsx`, `Faq.jsx`) and `InfoPageLayout.jsx`, pruning dead imports and routes in `AppRoutes.jsx`. Keep section components.
- Slim footer: single row on desktop, max 2 rows on mobile; Features / FAQ / About links navigate to sheet URLs.

### Task 3 — Shrink Landing Page Spacing
- `Landing.jsx` renders only `LandingNav`, `Hero` (with `HeroScene` if supported), and slim `Footer`.
- Tighten spacing and dimensions:
  - 1440x900: total page height <= 1.25 viewport heights (~1125px).
  - 390x844: total page height <= 2 viewport heights (~1688px).
  - Cap mockup height (~360px on desktop, ~300px on mobile with internal scroll).
  - Reduce headline and vertical padding as needed.
  - Record and report `document.scrollHeight` before and after.
- Retain mockup fixes: `text-left` on mockup root, tabular-nums line-number gutter, non-overlapping presence pill and model chip, chip text "Friday AI · Auto".

### Task 4 — Smooth 60 FPS Motion
- Animate only `transform` and `opacity`.
- Separate scrim backdrop for 200ms opacity fade (never animate backdrop-filter opacity on the panel).
- Animate panel with transform: `scale(0.98)` -> `scale(1)` and `translateY(12px)` -> `0` over 260ms with `cubic-bezier(0.22, 1, 0.36, 1)`; on mobile slide up from bottom (`translateY(100%)` -> `0`).
- Fade inner content separately; play exit animation before unmounting.
- Tab switching: 150ms fade/translate of content and sliding active tab indicator.
- Honor `prefers-reduced-motion` with instant transitions and zero transforms.

### Task 5 — Enforce Accurate Claims
- Verify absence of unbacked claims: "280ms", "Sub-millisecond", "stream in real-time", "Gemini 2.5", "2.5 Flash", "MongoDB 7", "Redis 7".
- Ensure accurate copy across all components:
  - "Live room broadcasts over Socket.IO"
  - "Replies are shared with the whole room"
  - "Google Gemini models (Fast, Balanced and Deep modes)"
  - Tech chips: "MongoDB", "Redis (optional)"
  - FAQ limits: 25 members, 100 files, 200 KB per file, 20 AI requests/min.
  - Zero invented metrics, customer logos, or fake testimonials.

### Task 6 — Verification & Evidence
- Visual verification across viewports: 360x640, 390x844, 768x1024, 1024x768, 1440x900 (closed landing, each of 5 tabs, open mobile sheet).
- Overflow check: `document.documentElement.scrollWidth <= clientWidth` across all widths.
- Touch targets >= 44px.
- Keyboard navigation: Tab navigation, Enter to open, trapped focus, arrow keys switch tabs, Escape closes and restores focus, browser Back closes.
- Direct route loading tests as guest and authenticated user.
- Performance profiling: 60fps animations without frames > 33ms; CPU throttling and reduced-motion tests.
- Lighthouse mobile audit on `/`: Performance >= 85, Accessibility >= 95, CLS <= 0.1.
- Sanity tests: user authentication, project creation, file editing, chat. Clean `npm run lint` and `npm run build`.


