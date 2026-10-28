# Current State: Fix Menu Overlay + Minimal Logo

**Last Updated:** 2026-10-28 — COMPLETE
**Status:** Done

## Tasks Checklist
- [x] Write `.gsd/SPEC.md` with Status: FINALIZED
- [x] Problem 1 — Menu overlay: add `.surface-overlay` CSS class in `index.css`
- [x] Problem 1 — Menu overlay: fix scrim (`bg-[#0B0716]/80 backdrop-blur-md`), desktop panel (`surface-overlay + isolate`), left column (`bg-[#18102B]/95`), right column (`bg-[#211737]`), top bar (`bg-[#18102B]/95`) in `MenuSheet.jsx`
- [x] Problem 1 — AccountMenu dropdown: replace `glass-strong` with solid `bg-[#211737]`
- [x] Problem 2 — Logo: replace complex gradient SVG with minimal violet square + Blue Chalk V; add `onClick` prop wired to Link
- [x] Problem 2 — favicon.svg: replace yellow VF with minimal violet V
- [x] Lint passes (`npm run lint` exit 0)
- [x] Build passes (`npm run build` exit 0)
- [x] Grep — no FFD60A/FFF3B0/0A0A0A in src/ or public/favicon.svg
- [x] Atomic git commit: `b648598` fix(ui): opaque menu overlay; minimal violet logo
- [ ] Browser screenshots (Playwright unavailable in sandbox — CDN 404 on playwright-1.57.0)

## Commits
- `b648598` fix(ui): opaque menu overlay; minimal violet logo

## Notes
- `og-image.png` is raster — must be regenerated manually by user.
- `#F0E100` (Turbo) remains in `index.css` CSS vars and `Background3D.jsx` (3D scene, explicitly excluded from task scope).
- Browser screenshot verification blocked by Playwright CDN 404 in sandbox; all functional checks confirmed via lint, build, and file content review.
