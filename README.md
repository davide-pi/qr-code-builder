<p align="center">
  <img src="public/logo.svg" alt="QR Code Builder" width="120" />
</p>

# QR Code Builder

A modern, fully customizable QR code builder built with React, TypeScript, and Vite. Generate styled QR codes for 19 content types, personalize every detail, localize the UI, and export to PNG, SVG, or PDF — all client-side, no account required.

🌐 **Live demo:** [https://free-qr-builder.netlify.app](https://free-qr-builder.netlify.app)

## ✨ Features

- **19 content templates**, grouped by category:
  - **Links & utilities** — URL, WiFi credentials, calendar event, geo location
  - **Contact & messaging** — vCard, email, SMS, phone call, WhatsApp, Telegram
  - **Social** — Instagram, Twitter/X, LinkedIn, TikTok, YouTube, Facebook, Snapchat
  - **Payment** — PayPal, Bitcoin
  - Each template renders a dedicated form and builds a spec-compliant payload (e.g. `WIFI:`, `BEGIN:VCARD`, `BEGIN:VEVENT`, `geo:`, `bitcoin:`), with proper escaping/encoding.

- **International phone input** — dialing-code selector with country flags (powered by `libphonenumber-js`) for phone, SMS, and WhatsApp templates.

- **Multi-language UI** — English, Italiano, and Română, switchable from the header.

- **Fully customizable styling**
  - Adjustable size (100–500px) and margin
  - 6 dot styles (square, rounded, dots, classy, classy-rounded, extra-rounded)
  - Independent corner-square and corner-dot styles
  - Solid color or linear/radial gradient for dots
  - Transparent or colored background
  - **Color presets** (Classic, Ocean, Forest, Sunset, Purple, Monochrome) plus your own saved presets

- **Center logo support** — upload a custom image, tune its size and the margin around it.

- **Error correction levels** — L, M, Q, H with inline guidance (higher levels recommended when embedding a logo).

- **Multiple export formats** — PNG for general use, SVG for scalable graphics, PDF for print-ready output.

- **Modern UX** — dark/light theme toggle (dark by default), settings and presets persisted in `localStorage`, reset-to-default, visual style pickers with SVG previews, responsive layout for mobile and desktop.

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/davide-pi/qr-code-builder.git
cd qr-code-builder

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Build for production

```bash
npm run build
npm run preview  # Preview the production build locally
```

## 🛠️ Tech Stack

- **React 19** — UI framework
- **TypeScript** — type safety
- **Vite 8** — build tool and dev server
- **qr-code-styling** — QR code generation and styling
- **jsPDF** — PDF export
- **libphonenumber-js** + **flag-icons** — international dialing codes and flags
- **lucide-react** — icons
- **react-select** — accessible dropdowns

## 📁 Project Structure

```
src/
├── components/
│   ├── Header/              # App header (logo, theme toggle, language switch)
│   ├── Footer/              # Footer with credits
│   ├── QRCodeGenerator/     # Main orchestrator component
│   ├── QRDataInput/         # Content-type templates and their forms
│   ├── QROptions/           # Styling controls (size, colors, dots, gradient, logo…)
│   ├── QRPreview/           # Live preview and PNG/SVG/PDF export
│   ├── StylePicker/         # Reusable style picker with SVG previews
│   ├── CountryCodeSelect/   # International dialing-code selector
│   └── Flags/               # Flag icons for the country selector
├── i18n/                    # Localization (en, it, ro) and LanguageProvider
├── types/
│   └── qr.ts                # Shared types, template definitions, presets, constants
├── App.tsx / App.css        # Root app and theme logic
└── main.tsx                 # Entry point
```

## 🌐 Deployment

The app deploys to **Netlify** through a two-stage GitHub Actions pipeline:

1. **CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) — **Lint** → **Build**
   (versioned with [GitVersion](https://gitversion.net/)). It uploads the built `dist/` and
   the deploy metadata as artifacts; no rebuild happens downstream.
2. **CD** ([`.github/workflows/cd.yml`](.github/workflows/cd.yml)) — triggered by a
   successful CI (`workflow_run`) and reuses its artifacts:
   - **Preview deploy** — every push to `main` publishes a Netlify **draft** deploy.
   - **Production deploy** — pushing a `vX.Y.Z` tag publishes to production.
   - **Cleanup** — after each deploy an automated step prunes old Netlify deploys, always
     keeping the **latest 3 production** and **2 preview** deploys, plus every deploy
     younger than **7 days**.

The pipeline expects two repository secrets: `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`.

> An MCP server for Netlify is configured in [`.mcp.json`](.mcp.json) for use with
> MCP-compatible AI tooling.

## 📝 Scripts

- `npm run dev` — start the development server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint

## 📄 License

MIT License © 2025 Davide Piccinini — free to use for personal or commercial purposes. See [LICENSE](LICENSE).

## 🙏 Credits

- [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) — QR code generation
- [jsPDF](https://github.com/parallax/jsPDF) — PDF export
- [libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js) — phone number handling
- [lucide](https://lucide.dev/) — icons
