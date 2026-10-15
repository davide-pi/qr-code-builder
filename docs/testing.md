# Testing

## Automated: vitest

| Item | Value |
|------|-------|
| Run all | `npm test` (= `vitest run`) |
| One file / folder | `npx vitest run src/templates` |
| Watch | `npx vitest` |
| Config | `vitest.config.ts`: `include: ['src/**/*.test.ts']`, Node environment |
| CI | The `Lint & test` job runs `npm run lint` then `npm test` |

Tests are co-located with the code (`*.test.ts`) and cover **pure modules only**: no DOM, no React rendering
(the React plugin is not loaded in `vitest.config.ts`). Logic that must be tested goes in a pure module.

### What is covered

| Area | Test file | Covers |
|------|-----------|--------|
| Templates | `src/templates/templates.test.ts` | Registry consistency (20 types), empty defaults invalid, `validate` and `buildPayload` of every template (URL, vCard, Wi-Fi, email, phone/SMS/WhatsApp, calendar, location, social, PayPal, Bitcoin, EPC) |
| Template helpers | `src/templates/lib/lib.test.ts` | `escapeText`, `foldLine`, `escapeWifi`, `normalizeAmount`, IBAN/BIC, `toE164` (trunk rules), URL normalize/validate, `buildSocialUrl` |
| Batch | `src/components/Batch/csv.test.ts`, `batchRows.test.ts` | Delimiter detection, RFC 4180 parsing, `toCsvLine`, boolean coercion, file-name sanitizing and de-duplication, header template, `buildBatchRows` |
| History | `src/components/QRCodeGenerator/history.test.ts` | The undo/redo reducer (`edit`, `commit`, `undo`, `redo`, `reset`, cap) |
| Saved settings | `src/components/QRCodeGenerator/savedOptions.test.ts` | `parseSavedOptions` on corrupted or hand-edited JSON |

### Not covered by automated tests

`qrChecks.ts`, `qrExport.ts` and `presetStorage.ts` are pure but have no tests yet; everything React
(components, keyboard handling, focus), export/download, the logo upload, the PWA and the batch dialog UI are
checked by hand (below).

Rule: every payload builder stays pure and covered (rule 2 in `CLAUDE.md`). A bug fix in a builder starts with a
failing test.

## Manual smoke checklist

Run `npm run dev` (or `npm run build && npm run preview` for the PWA items) and go through it before a release or
after touching the preview, options, batch or PWA code.

### Content and templates

- [ ] Each template: an empty required field shows its error only after the field is left, other errors show as you type; the preview is empty until the data is valid.
- [ ] Scan a few payloads with a phone: URL, Wi-Fi, vCard, calendar event, geo, a SEPA/EPC transfer, a phone/SMS/WhatsApp number.
- [ ] Switching template keeps what was typed in the others; typing in a phone field loads the country select (disabled placeholder first).

### Preview and exports

- [ ] PNG at 512, 1024 and 2048 px: file opens, size matches, file name `qr-<template>-<yyyymmdd-hhmm>.png`.
- [ ] SVG downloads and opens in a browser.
- [ ] PDF at 5 cm, 10 cm and A4: single A4 page, QR centered, prints at the chosen size (the first export loads the jsPDF chunk).
- [ ] Copy to clipboard (where available) pastes a PNG.
- [ ] Buttons are disabled with empty or invalid content; a payload over the capacity shows the error and blocks export.
- [ ] Scannability warnings appear for low contrast, inverted colors, and a logo with error correction L or M.

### Styling, logo and presets

- [ ] Dot / corner styles, gradient on/off, transparent background, built-in presets.
- [ ] Logo: file picker and drag and drop; PNG/JPEG/WebP/SVG accepted, other types and files over 2 MiB rejected with a message; error correction jumps to H.
- [ ] Save a user preset, reload the page, apply it; delete it.
- [ ] Export presets to JSON, delete them, import the file back; import a garbage file (error message) and one with the same names (replaced, not duplicated).
- [ ] Reload: styling persists; the QR content, form fields and logo do **not**.

### Undo / redo

- [ ] Type in a form, pause, change a color: `Ctrl+Z` steps back; `Ctrl+Shift+Z` / `Ctrl+Y` steps forward; the buttons enable and disable accordingly.
- [ ] `Ctrl+Z` inside a text field uses the browser's own undo, not the app history.
- [ ] Reset to defaults clears styling and forms and can be undone.

### Batch

- [ ] Download the CSV header template for a template (`,` in English, `;` in Italian/Romanian), fill 3 rows, upload.
- [ ] Preview table marks invalid rows as skipped with the reason; generate PNG and SVG ZIPs; open them: one image per valid row, file names unique.
- [ ] Cancel during generation stops it; closing the dialog with Escape cancels it.
- [ ] A CSV saved by Excel in Windows-1252 (accents) decodes correctly.

### Keyboard, accessibility, i18n, theme

- [ ] Template dropdown: Arrow keys, Home/End, Enter/Space, Escape, Tab.
- [ ] Language menu: open and navigate by keyboard, choice persists after reload; all three languages render without missing text.
- [ ] Tab order is sensible everywhere; focus is visible; the batch dialog traps focus and returns it on close.
- [ ] Dark and light theme (first visit follows the OS; the toggle is remembered).

### PWA and offline (production build)

- [ ] Load `npm run preview` once, then go offline (DevTools > Network > Offline) and reload: the app works; PNG/SVG export and batch work.
- [ ] PDF export offline fails before a first online PDF export, and works after it (`pdf-chunks` cache).
- [ ] Ship a new build while a tab is open: the "update available" prompt appears; **Later** keeps the form intact; **Reload** applies the update.
