<p align="center">
  <img src="public/logo.svg" alt="QR Code Builder" width="120" />
</p>

# QR Code Builder

A free, fully customizable QR code builder built with React, TypeScript and Vite. Pick one of 20 content types, style the code, and export it as PNG, SVG or PDF. Everything runs in the browser: no account, no backend, your data never leaves the page.

**Live demo:** [https://free-qr-builder.netlify.app](https://free-qr-builder.netlify.app)

## Features

- **20 content templates** with spec-compliant payloads and proper escaping: URL, Wi-Fi, calendar event, geo location, vCard, email, SMS, phone call, WhatsApp, Telegram, Instagram, X/Twitter, LinkedIn, TikTok, YouTube, Facebook, Snapchat, PayPal, Bitcoin and **SEPA/EPC** bank transfer.
- **Inline validation** on every form, with international phone input (country selector).
- **Styling** - 6 dot styles, independent corner styles, solid or linear/radial gradient, transparent or colored background, 6 built-in color presets, and **your own presets** with JSON import/export.
- **Center logo** (PNG, JPEG, WebP, SVG) with size and margin controls; error correction levels L/M/Q/H.
- **Export** - PNG and SVG at 512, 1024 or 2048 px, PDF at 5 cm, 10 cm or A4-fit print size (300 DPI), copy to clipboard; blocked with a message when the content exceeds the QR capacity.
- **Scannability warnings** - low contrast, inverted colors, logo with a low error correction level.
- **Batch mode** - upload a CSV, get a ZIP with one QR image per row.
- **Undo / redo** (`Ctrl+Z`, `Ctrl+Y`) and reset to defaults.
- **PWA** - installable, works offline, asks before applying an update so a half-filled form is never lost.
- **Multi-language UI** - English, Italiano, Română.
- **Dark and light theme** - follows the system preference until you pick one.
- **Private by design** - styling, presets, theme and language are saved locally; QR content and form data never are ([docs/privacy.md](docs/privacy.md)).

## Quick start

Requires Node.js 22+ and npm.

```bash
git clone https://github.com/davide-pi/qr-code-builder.git
cd qr-code-builder
npm install
npm run dev
```

## Scripts

| Command | Does |
|---------|------|
| `npm run dev` | Development server |
| `npm run build` | Type-check and production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (vitest) |

## Tech stack

- **React 19**, **TypeScript**, **Vite 8**
- **qr-code-styling** - QR generation and styling
- **jsPDF** - PDF export (loaded on demand)
- **fflate** - ZIP for batch export (loaded on demand)
- **libphonenumber-js** + **react-select** - country dialing codes (loaded on demand)
- **vite-plugin-pwa** - service worker, offline, update prompt
- **flag-icons** - only the three flags of the UI languages
- **lucide-react** - icons
- **vitest** - unit tests

## Documentation

Technical docs are in [docs/](docs/README.md): [architecture](docs/architecture.md), [templates](docs/templates.md), [i18n](docs/i18n.md), [privacy](docs/privacy.md), [deploy](docs/deploy.md), [testing](docs/testing.md). Contributor rules are in [CLAUDE.md](CLAUDE.md).

## License

MIT License © 2025 Davide Piccinini - free to use for personal or commercial purposes. See [LICENSE](LICENSE).

## Credits

- [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) - QR code generation
- [jsPDF](https://github.com/parallax/jsPDF) - PDF export
- [fflate](https://github.com/101arrowz/fflate) - ZIP creation
- [libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js) - phone number handling
- [flag-icons](https://github.com/lipis/flag-icons) - language flags
- [lucide](https://lucide.dev/) - icons
