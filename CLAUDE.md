# QR Code Builder — project guide

Client-side React 19 + TypeScript + Vite single-page app that builds styled QR codes and exports
them as PNG/SVG/PDF. No backend: everything runs in the browser and deploys as static files to
Netlify.

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Type-check + build | `npm run build` |
| Lint | `npm run lint` |
| Preview build | `npm run preview` |
| Unit tests | `npm test` |

A change is done only when `npm run lint`, `npm test` and `npm run build` pass.

## Rules

1. **Privacy first.** Never persist QR content (`options.data`) or template form data
   (Wi-Fi passwords, locations, contacts…) to `localStorage`. Only styling settings, theme,
   language and user presets are persisted. See `toPersistableOptions` in `QRCodeGenerator`.
2. **Payloads follow their spec.** Every template's payload (`WIFI:`, vCard 3.0, iCalendar,
   `geo:`, BIP21, EPC…) must escape user input per its spec. Payload builders are pure
   functions and must stay covered by unit tests.
3. **i18n parity.** Every user-visible string goes through `useLanguage()`; a new key is added
   to `src/i18n/types.ts` and to **all** of `en.ts`, `it.ts`, `ro.ts` in the same change.
4. **Keep the main bundle lean.** Heavy, rarely used libraries (PDF export…) are loaded with
   dynamic `import()` at the point of use.
5. **Accessibility.** Custom dropdowns follow the WAI-ARIA listbox/menu pattern (keyboard,
   focus, `aria-*`); every image and icon-only button has a translated label.

## Conventions

- Branches: `feature/<slug>`, `fix/<slug>` (GitVersion reads them; see `GitVersion.yml`).
- Commit messages and PR descriptions in **Italian**; code, comments and docs in **English**.
- Releases: pushing a `vX.Y.Z` tag deploys to production; every push to `main` deploys a
  preview (see `.github/workflows/`).
- PR description: Summary · Motivation · Changes · Testing · Breaking changes (omit if none).

## Docs

Technical docs live in `docs/` (index: `docs/README.md`). Keep them in sync with the code they describe.

| Doc | Read when you… |
|-----|----------------|
| `docs/architecture.md` | need the component map, editor/history/debounce flow, exports, batch, lazy chunks or the PWA update flow |
| `docs/templates.md` | change or add a template, a payload format, escaping or phone/URL normalization |
| `docs/i18n.md` | add a string or a language |
| `docs/privacy.md` | store anything or touch persistence or the PWA update behavior |
| `docs/deploy.md` | touch CI/CD, GitVersion, `public/_headers` (CSP) or service worker caching |
| `docs/testing.md` | write or run tests, or do the manual smoke check before a release |
