# Design QA — mobile homepage refinement

- Source screenshot: `/workspace/scratch/0602e99abe62/upload/B8A916FF-C5EE-4E81-ADA7-57414BADFD9D.png`
- Implementation screenshot: `/tmp/llmstudy-mobile-home-after.png`
- Companion desktop screenshot: `/tmp/llmstudy-desktop-home-after.png`
- Target state: English, light theme, homepage
- Mobile viewport: 390 × 844
- Desktop viewport: 1440 × 1000

## Comparison and corrections

1. The source showed a persistent dark strip on the left. The closed off-canvas sidebar now has no shadow; the shadow is applied only while the drawer is open.
2. The source page stopped short of the right viewport edge. The root, shell, main content, page, and hero containers now resolve to the full mobile viewport and horizontal overflow is clipped defensively.
3. The source top bar tried to fit a full search field, shortcut hint, language, theme, and account controls in one row. Mobile now uses menu and search icons, keeps language and account visible, and moves theme control into the drawer.
4. The English hero used a CJK-first font stack and aggressive tracking, creating an apparent break inside “Don’t.” English now uses the native system UI stack with moderated tracking and kerning.
5. The mobile hero was taller than necessary. Type, spacing, actions, and the signal map were reduced while preserving the visual hierarchy.
6. The mobile signal map now shows three legible milestones (Tokens, GPT, Agents); the full five-node map remains on desktop.
7. The signed-in account control now reads as a user control with a small sync-status indicator instead of a large cloud-state button.

## Automated verification

- Mobile page width: 390 px
- Mobile document width: 390 px
- Closed sidebar shadow: none
- Mobile top-bar search label and keyboard shortcut: hidden
- Mobile top-bar theme control: hidden and available in drawer
- Mobile signal nodes: 3
- Desktop sidebar: 172 px
- Desktop hero: two columns
- Desktop search and theme controls: visible
- Browser console/page errors: none
- Production build: passed
- Chinese/English and domestic/international media regression: passed

final result: passed
