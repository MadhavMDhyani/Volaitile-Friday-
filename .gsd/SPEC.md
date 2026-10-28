# SPEC: Fix Menu Overlay Opacity and Replace Logo/Favicon

Status: FINALIZED
Date: 2026-10-28

## Problem 1: See-through menu overlay

Root cause: glass-strong has rgba(24,16,43,0.58) background — only 58% opaque.
When the 3D/canvas background or hero content renders behind the menu, it bleeds through.

Fix plan:
- MenuSheet.jsx desktop panel: replace glass-strong with surface-overlay + isolate
- MenuSheet.jsx left column: bg-page/70 -> bg-[#18102B]/95
- MenuSheet.jsx right column: bg-transparent -> bg-[#211737]
- MenuSheet.jsx right top bar: bg-page/40 -> bg-[#18102B]/95
- MenuSheet.jsx scrim: bg-black/70 backdrop-blur-sm -> bg-[#0B0716]/80 backdrop-blur-md
- index.css: add .surface-overlay with background: rgba(24,16,43,0.97)
- AccountMenu.jsx: glass-strong dropdown -> bg-[#211737] explicit

## Problem 2: Minimal violet logo

Fix plan:
- Logo.jsx: remove useId/gradients/highlights. Replace SVG with violet rect + V stroke.
  Accept onClick prop and pass to Link.
- favicon.svg: replace yellow VF monogram with violet rect + Blue Chalk V.

## Verification
1. lint + build pass
2. Screenshots of open menu at 1440px and 390px, 5 tabs
3. Esc/click-outside/X close; logo click closes menu
4. Logo screenshots (nav, footer, login, favicon)
5. grep for FFD60A/FFF3B0/0A0A0A returns nothing
6. One atomic commit
