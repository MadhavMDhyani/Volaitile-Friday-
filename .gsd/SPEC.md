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

## Phase 2 — Motion System

### Global Rules (Strict)
1. **Properties**: Animate ONLY `transform` and `opacity`. Never animate `box-shadow`, `filter`, `blur radius`, `width`, `height`, `top`, `left`, or `margin`. Glows are separate layers whose `opacity` animates.
2. **Backdrop-filter Protection**: Never fade the `opacity` of an ancestor of a `backdrop-filter` element. Use transform-only reveals or fade inner content.
3. **Time-Based Physics**: All motion uses elapsed time ($dt$) so behavior is identical at 60Hz, 120Hz, and 144Hz. Set `will-change` only while animating. Never read layout inside animation loops.
4. **Lifecycle & Accessibility**: Pause animation loops when offscreen or when tab is hidden (`visibilitychange`, `IntersectionObserver`). Strictly honor `prefers-reduced-motion` in CSS and JS.
5. **Zero External Dependencies**: No animation libraries. Use CSS and compact React hooks only.
6. **Timing Tokens**: Add `--ease-out: cubic-bezier(0.22, 1, 0.36, 1);`, `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);`, and durations `150ms`, `250ms`, `450ms`, `700ms` to `:root` in `index.css` and `tailwind.config.js`.

### Task 1 — CinderBackground.jsx
- Convert ember speeds to px/second and sway to elapsed time ($dt$ accumulator capped at 60 updates/sec).
- Use `clearRect` instead of filling canvas background each frame (background color is handled by body); replace canvas bottom vignette with a CSS gradient overlay element.
- Debounce window resize (150ms); reallocate particle count only if viewport changes by >10%. Cache pre-rendered ember sprites by (color, radius bucket).
- Support `intensity` prop: 1 on landing/login/register, 0.4 on `/project/*`, static frame when `prefers-reduced-motion`.
- Delete unused `AuroraBackground.jsx` and remove its unused `.aurora-orb` keyframes/classes from `index.css`.

### Task 2 — Route Transitions
- Integrate React Router 7 view transitions: enable `viewTransition` on primary `<Link>` and `<NavLink>` elements and `navigate(..., { viewTransition: true })` calls (landing $\to$ login/register, dashboard $\to$ project, and back).
- CSS for `::view-transition-old(root)` / `::view-transition-new(root)`: 220ms crossfade + 8px translateY. Assign `view-transition-name: site-logo` to the header logo.
- Retain `PageTransition` component as graceful fallback when `document.startViewTransition` is unavailable (ensure both never run simultaneously).

### Task 3 — Landing Hero Motion
- Line-by-line mask reveal for headline: each line in an `overflow-hidden` container, inner span `translateY(110%)` $\to$ `0` over 700ms with `--ease-out` and 80ms stagger. Subhead and CTAs retain staggered fade-up.
- ProductMockup 3D pointer tilt (max 5deg `rotateX`/`rotateY`, perspective 1200px) driven by rAF + lerp while hovered, scoped to `(hover: hover) and (pointer: fine)`.
- Floating badge pills ("1 member online", "Saved"): smooth vertical oscillation `translateY(±6px)` loop over 5–7s with `ease-in-out`, alternate, desynchronized phases.
- Replace `drop-shadow` filter on "Ship faster." with an absolutely positioned blurred glow element with a 4s gentle opacity pulse.

### Task 4 — Scroll-Driven Animations & Performance
- Implement CSS scroll-driven animations using `animation-timeline: view()` and `animation-range` within `@supports (animation-timeline: view())` for `FeatureBento` cards (staggered entry) and `HowItWorks` connector line (`scaleY`/`scaleX` 0 $\to$ 1), falling back to `Reveal`.
- In `Reveal.jsx`: replace `transition-all` with `transition-[opacity,transform]`.
- Apply `content-visibility: auto` with `contain-intrinsic-size` to below-the-fold landing page sections.

### Task 5 — Feature Card Interactive Spotlight
- Add an absolutely positioned low-alpha accent radial gradient layer inside each `FeatureBento` card, translated via `transform: translate3d()` using rAF tracking pointer movement, fading opacity 0 $\to$ 1 on hover for fine pointers without extra backdrop filters.

### Task 6 — Microinteractions & Transition Cleanup
- **Button**: Hover `translateY(-1px)` with brightening opacity overlay; active `scale(0.97)` over 120ms with `--ease-spring`; no box-shadow transitions.
- **Modal / ConfirmDialog**: Backdrop opacity 200ms; panel `scale(0.96) -> 1` + `translateY(8px)` over 260ms; execute exit animation before unmount.
- **Toast**: Spring slide-in 300ms; auto-dismiss progress bar via `scaleX` over toast duration, pausing on hover.
- **Chat**: Incoming bubbles animate in (`translateY(8px) + opacity`, 220ms) only for new real-time messages after initial history load. Typing indicator with 3 bouncing dots (`translateY`) staggered 120ms. Friday AI thinking bubble with transform-based shimmer overlay.
- **Presence Dot**: Pulse ring on `::after` (`scale(1) -> scale(2.2)`, `opacity 0.5 -> 0`, 2s infinite loop).
- **FilesPanel**: Active file indicator is an absolutely positioned bar transitioning between rows via `translateY`; new rows enter with fade + `translateX`; deletions fade out before DOM removal.
- **Dashboard**: StatCards numeric count-up (rAF, `easeOutExpo`, 700ms, `font-variant-numeric: tabular-nums`, executes once, skipped when reduced-motion active). ProjectGrid cards stagger in (40ms steps, first 12 cards). Skeleton loader shimmer upgraded to transform-based overlay.
- **Transition Cleanup**: Replace remaining `transition-all` declarations (~47 occurrences) with explicit transitions (e.g. `transition-[transform,opacity,background-color,border-color,color]`).

### Task 7 — Verification & FPS Performance Probe
- Implement dev-only FPS probe (rAF delta logger, enabled only when `import.meta.env.DEV` and URL contains `?fps`).
- Record and verify average FPS $\ge 58$ and max frame time $\le 33\text{ms}$ during landing scroll, card hover, modal toggling, and rapid chat message reception.
- Confirm zero Layout/Paint thrashing on animated elements in browser Performance traces, with 4x CPU throttling, and under simulated `prefers-reduced-motion`.

