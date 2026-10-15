# TODO — refresh del progetto (aggiornato 2026-10-15)

Branch di lavoro: `feature/project-refresh` (worktree `C:\__Workspaces\github\qr-code-builder-wt\base`), staccato da `main` dopo #21. **Non pushato.**

## Stato

| Branch | Contenuto | Stato |
|---|---|---|
| `feature/project-refresh` | Copilot rimosso, `.vite` fuori da git, svg morti eliminati, `CLAUDE.md` | committato |
| `wip/preview` | export 512–2048 px e PDF 5 cm/10 cm/A4, jsPDF lazy, scansionabilità, copia PNG, 0 warning lint | **mergiato** in feature |
| `wip/options` | preset utente + import/export JSON, i18n, a11y header/preset, tema di sistema, logo validato con EC→H, bandiere ridotte, react-select lazy | **mergiato** in feature |
| `wip/pwa` | PWA offline, meta/OG, icone, `public/_headers` (CSP) | **mergiato** in feature |
| `wip/templates` | registry template, fix payload, EPC/SEPA, validazione, stato dei form nel generator, history, vitest (70 test) | **mergiato** (lint/test/build ok) |
| `wip/batch` | generazione in serie da CSV → ZIP | in corso |
| `wip/deps` | aggiornamenti minor + major | in corso |
| `wip/fix-core`, `wip/fix-ui` | fix dei rilievi della review (10 correctness, 3 security, 4 performance; nessun P1) | in corso |

## Prossimi passi, in ordine

1. [x] Verificare il merge: in `base` → `npm ci && npm run lint && npm run build` → lint ok, build ok, bundle principale 330 kB (era 892), precache PWA 1,56 MiB (era 5,4).
2. [x] In `templates` → `npm ci && npm run lint && npm test && npm run build`; correggere quello che fallisce.
3. [x] Mergiare `wip/templates` in feature. Conflitti attesi:
   - `src/types/qr.ts`: options ha spostato `countryCodes` in `CountryCodeSelect/countryCodes.ts` e tolto l'import di libphonenumber; templates ha rimosso le parti dei template.
   - `package.json` / `package-lock.json`: vitest (templates) + vite-plugin-pwa (pwa) → tenere entrambi e rigenerare il lock con `npm install`.
   - i18n: sezioni diverse, dovrebbe essere automatico.
4. [x] CI: aggiungere il passo `npm test` in `.github/workflows/ci.yml`.
5. [ ] Prova manuale con `npm run dev` (gli agenti non hanno provato nel browser): export PNG/SVG/PDF e copia, upload del logo e drag&drop, menu lingua da tastiera, import/export dei preset, undo/redo/reset con il form, ogni template scansionato col telefono.
6. [x] Review finale con `code-reviewer` + `review-security` + `review-performance` sul diff `main...feature/project-refresh`.
7. [ ] Documentazione `docs/` in inglese: `architecture.md`, `templates.md` (payload ed escaping), `i18n.md`, `deploy.md` (GitVersion → CI → CD → Netlify, `_headers`), `privacy.md` (niente dati del QR in localStorage). Completare `CLAUDE.md` con i link a `docs/`.
8. [ ] README più corto: link a `docs/`, feature nuove (EPC, preset, PWA, export size), togliere la citazione di flag-icons per le bandiere dei paesi.
9. [ ] PR verso `main` (squash), dopo la #20 di Dependabot.

## Funzionalità ancora da fare

- [ ] Generazione in serie da CSV con export ZIP (dipendenza `fflate`), da fare sopra il registry dei template.
- [ ] Aggiornamenti major, una PR ciascuno (rischio alto): TypeScript 7, lucide-react 1.x, @vitejs/plugin-react 6, globals 17.

## Decisioni aperte (dagli agenti)

- Preset utente: includere anche `errorCorrectionLevel`, `imageSize`, `imageMargin`? Oggi esclusi.
- Capacità: il controllo è solo byte-mode, quindi un contenuto solo numerico molto lungo viene rifiutato in anticipo anche se ci starebbe.
- Il `theme-color` scuro della PWA è `#5a67d8` (gradiente); l'alternativa è `#1e1e2e` (card).
- La CSP richiede `style-src 'unsafe-inline'` (emotion di react-select); va verificata su un deploy preview di Netlify.
- Dopo il merge di options il precache della PWA dovrebbe scendere da 5,4 MiB (le bandiere non ci sono più): controllarlo.

## Rilievi dell'audit ancora aperti

| # | Priorità | Rilievo | Dove |
|---|---|---|---|
| 1–9, 10–12, 18, 21, 22, 30 (dropdown template) | P1–P3 | escaping dei payload, numeri di telefono, geo, importi, social, URL, date UTC, history, stato dei form (P1), refactor | in `wip/templates`, da verificare |
| 26 | P3 | CSS globale senza scope (rischio collisioni) | `QROptions.css` |
| 31 | — | fatto in `wip/pwa` | — |
| — | P3 | classe morta `.option-group input[type="file"]` | `QROptions.css` |

Chiusi da preview/options: 13, 14, 15, 16, 17, 19, 20 (nel generator → templates), 23, 24, 25, 27 (warning spariti; la regola eslint è ancora `warn`), 28, 30 (header/preset), 32, 33, 34.
