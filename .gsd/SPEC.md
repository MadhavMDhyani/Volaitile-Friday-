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
