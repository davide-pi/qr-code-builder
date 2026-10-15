# Privacy

The app has no backend and application code makes no network requests (no `fetch`, no analytics). What
you type never leaves the browser. This page lists what is stored locally, what never is, and why.

## Persisted (`localStorage`)

| Key | Content | Written by |
|-----|---------|------------|
| `qr-generator-settings` | Styling only: `templateType`, `size`, `margin`, `errorCorrectionLevel`, dot / corner / background colors and types, `dotGradient`, `transparentBackground`, `imageSize`, `imageMargin`. Written 300 ms after the last change | `QRCodeGenerator.tsx` (`toPersistableOptions`) |
| `qr-generator-presets` | User presets: up to 50 `{ name, style }` entries (colors, types, gradient, transparency) | `QROptions/presetStorage.ts` |
| `qr-generator-theme` | `light` or `dark`, only after an explicit toggle (otherwise the OS preference applies) | `App.tsx` |
| `qr-generator-language` | `en`, `it` or `ro` | `i18n/LanguageContext.tsx` |

Everything read back is untrusted: `parseSavedOptions` and `parseImportedPresets` validate types, enums,
hex colors and numeric ranges, drop unknown keys and fall back to defaults. Storage failures (private mode,
quota) are caught and the app keeps working for the session.

The service worker also fills Cache Storage with the app's own static files (precache and the `pdf-chunks`
runtime cache, see [deploy.md](deploy.md)). No user content goes there.

## Never persisted

| Data | Where it lives | Why |
|------|----------------|-----|
| QR content (`options.data`, the payload) | Memory only | May hold secrets |
| Template form data (`EditorState.forms`): Wi-Fi passwords, contacts (vCard), locations, IBANs, calendar events, messages | Memory only | Personal data. Excluded by construction: `toPersistableOptions` strips `data` and `image`, and `forms` is not part of `options` |
| Logo image (data URL) | Memory only (`options.image`) | Can exceed the storage quota and may be personal |
| Undo/redo history (max 50 snapshots of options **and** forms) | Memory only (`history.ts`) | Contains form data. Cleared on page reload. Reset to defaults is itself an undo step, so earlier values stay undoable until reload |
| Batch CSV and generated ZIP | Memory only | Contains the same personal data as the forms |
| Exported PNG/SVG/PDF, copied image | Handed to the browser (download / clipboard) | The app keeps no copy |
| Imported presets file | Only the validated entries are stored | Never `data` or `image`, whatever the file says |

Rule for contributors: never persist `options.data` or any template form data (rule 1 in `CLAUDE.md`).
A new setting must go through `toPersistableOptions` / the preset `PresetStyle` pick, never around them.

## Why the PWA asks before updating

`vite-plugin-pwa` is configured with `registerType: 'prompt'`, not `autoUpdate`. An automatic update
reloads the page, and because form data lives only in memory, a reload would silently destroy a half-filled
form (a Wi-Fi QR, a vCard). `UpdatePrompt` shows **Reload** / **Later** and the user chooses when. See
[architecture.md](architecture.md#pwa-update-flow).

## Network surface

The CSP in `public/_headers` limits `connect-src` to `'self' data: blob:`, so even a bug in a dependency
cannot post data to a third party. Details: [deploy.md](deploy.md#security-headers-public_headers). Outbound links
exist only in the footer (GitHub, with `rel="noopener noreferrer"`).
