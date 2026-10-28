# SPEC.md — Quantus Palette 2025 Re-Theme & Violet 3D Background

Status: FINALIZED

> **Planning Lock**: This specification is finalized and approved for execution.

---

## 1. Vision & Scope
Re-theme the frontend of Volaitile Friday (`frontend/`) from the warm brown/orange palette to the "Quantus Palette 2025", and replace the current background animation with a violet 3D scene using Three.js / React Three Fiber.
Constraint: Do NOT touch `Backend/`, routes, API calls, socket logic, or package scripts.

---

## 2. Palette Specification

| Role | Name | HEX | RGB |
|---|---|---|---|
| accent | Electric Violet | #834DFB | 131, 77, 251 |
| highlight | Turbo | #F0E100 | 240, 225, 0 |
| page bg | Haiti | #18102B | 24, 16, 43 |
| text | Blue Chalk | #F5F3FF | 245, 243, 255 |

Derived Shades:
- `accent-hover`: #6F3BE6
- `accent-press`: #5B2FC4
- `accent-deep`: #3E2380
- `accent-tint`: #2A1B52
- `accent-glow`: #A98BFF
- `surface`: #211737
- `raised`: #2C2048
- `deepest bg`: #110B20
- `text-secondary`: #C9C6D5
- `text-muted`: #9D98AA
- `text-faint`: #6C667C
- `neutral-strong`: #3A3355

Usage Rules:
- Haiti is the base page background.
- Electric Violet is the dominant accent.
- Turbo is used sparingly (~10%) for primary CTA highlights, badges, tiny details.
- Text on Turbo = Haiti (#18102B). Text on Electric Violet = Blue Chalk (#F5F3FF), semibold.
- Small accent text (links, labels, mono captions) uses `accent-glow` (#A98BFF) for contrast against Haiti.
- Semantic status colors (green/red/blue) remain unchanged.

---

## 3. Implementation Tasks

### Task 1 — Design Tokens & CSS
- Update `frontend/tailwind.config.js`:
  - `page`, `surface`, `raised`, `border`, `border-strong`, `text-*`, `neutral-strong`, `accent.*`, `glass-*`.
- Update `frontend/src/index.css`:
  - `:root` variables (`--bg-*`, `--text-*`, `--accent*`, `--glass-*`, `--specular-highlight`, `--accent-rgb`).
  - Set `--accent-rgb: 131 77 251`.
  - Recolor all hardcoded rgba values and gradients.
- Update `frontend/index.html`:
  - `<meta name="theme-color" content="#18102B">`.
  - Body background classes / styles.

### Task 2 — Component & Asset Recoloring
- Find and replace all legacy orange/brown/warm-grey hexes, rgbas, and tailwind classes across `frontend/src/`.
- Update `Logo.jsx` gradient to Electric Violet / Turbo.
- Update `favicon.svg` to Turbo + Haiti with violet.
- Update `Button`, `Modal`, `Toast`, `ConfirmDialog`, `AccountMenu`, `OfflineBanner`, `ErrorBoundary`.
- Update `landing/*`, `dashboard/*`, `Login`, `Register`, `Home`, `Dashboard`, `project.jsx`, `project/*` (editor, chat, files, members), and `AppRoutes`.
- Recolor `AuroraBackground.jsx` gradients to violet tints.
- In `HeroScene.jsx`: remove `<LandscapeScene>` iframe and WebGL mount/unmount logic; keep scrim & fade; recolor poster gradients to Haiti -> faint violet glow.
- Do NOT edit `public/landscape.html` or `third_party/`.

### Task 3 — 3D Animated Background (`Background3D.jsx`)
- Install `three`, `@react-three/fiber` (v9), `@react-three/drei` (v10) compatible with React 19.
- Implement `frontend/src/components/Background3D.jsx`:
  - Fixed full-screen `<Canvas>` (`position: fixed; inset: 0; z-index: 0; pointer-events: none`).
  - Subtle fog, transparent / Haiti background.
  - 3-4 slowly rotating, gently drifting shapes (icosahedron, torus knot, octahedron) wireframe/glassy in Electric Violet, plus one Turbo accent shape.
  - Starfield / particle layer of ~1000 points in Blue Chalk at low opacity.
  - Violet point light + faint Turbo rim light.
  - Mouse parallax (ease camera/objects toward cursor) and scroll drift read via ref in `useFrame` (no state updates per frame).
  - Page-aware intensity: full on `/`, dimmed on Dashboard, Login, Register, Project/Editor/Chat.
  - Performance & accessibility:
    - Lazy load with `React.lazy` + `Suspense`.
    - DPR capped `[1, 1.5]`.
    - Screen width < 768px: reduced objects/particles.
    - Visibility API pause when tab hidden.
    - Geometry/material cleanup on unmount.
    - `prefers-reduced-motion` and WebGL unavailable fallback: static Haiti to faint-violet radial gradient.
- Replace `<CinderBackground />` in `App.jsx` with `<Background3D />`.

### Task 4 — Verification & Evidence
- `npm install`, `npm run lint`, `npm run build` pass in `frontend/`.
- Grep leftover check for forbidden orange/brown patterns returns empty in `src`, `index.html`, `tailwind.config.js`.
- Screenshot verification at 1440px and 390px across `/`, `/login`, `/register`, `/dashboard`, and project page.
- Test reduced-motion fallback.
- Note `public/og-image.png` manual regeneration needed.
- Single atomic commit at the end.
