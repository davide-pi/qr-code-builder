# QR Code Builder

A modern, customizable QR code builder built with React, TypeScript, and Vite. Features a beautiful dark/light theme, persistent settings, and multiple export formats.

🌐 **Live Demo:** [https://free-qr-builder.netlify.app](https://free-qr-builder.netlify.app)

![QR Code Builder](https://via.placeholder.com/800x400?text=QR+Code+Builder)

## ✨ Features

- **Fully Customizable QR Codes**
  - Adjust size (100-500px) and margin
  - Choose from 6 dot styles (square, dots, rounded, extra-rounded, classy, classy-rounded)
  - Select corner square and corner dot styles
  - Solid colors or gradients for dots
  - Transparent or colored background

- **Center Logo Support**
  - Upload custom logo images
  - Adjustable size (20-30% of QR code)
  - Configurable margin around logo

- **Error Correction Levels**
  - L, M, Q, H levels with helpful tooltips
  - Higher levels recommended when using logos

- **Multiple Export Formats**
  - PNG for general use
  - SVG for scalable graphics
  - PDF for print-ready output

- **Modern UI/UX**
  - Dark/Light theme toggle
  - Settings persistence via localStorage
  - Reset to default functionality
  - Visual style pickers with previews
  - Responsive design for mobile and desktop

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/qr-code-builder.git
cd qr-code-builder

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview  # Preview the production build
```

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite 7** - Build tool and dev server
- **qr-code-styling** - QR code generation library
- **jsPDF** - PDF export functionality

## 📁 Project Structure

```
src/
├── components/
│   ├── Header/
│   │   ├── Header.tsx      # Fixed header with logo and theme toggle
│   │   └── Header.css
│   ├── Footer/
│   │   ├── Footer.tsx      # Fixed footer with credits
│   │   └── Footer.css
│   ├── QRCodeGenerator/
│   │   ├── QRCodeGenerator.tsx  # Main orchestrator component
│   │   └── QRCodeGenerator.css
│   ├── QROptions/
│   │   ├── QROptions.tsx   # All customization controls
│   │   └── QROptions.css
│   ├── QRPreview/
│   │   ├── QRPreview.tsx   # QR preview and download buttons
│   │   └── QRPreview.css
│   └── StylePicker/
│       └── StylePicker.tsx # Reusable style picker with SVG previews
├── types/
│   └── qr.ts               # Shared types and constants
├── App.tsx/css             # Main app with theme logic
└── main.tsx                # Entry point
```

## 🌐 Deployment

This project is configured for easy deployment to Netlify:

1. Connect your GitHub repository to Netlify
2. Netlify will automatically detect Vite configuration
3. Build command: `npm run build`
4. Publish directory: `dist`

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Credits

- [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) - QR code generation
- [jsPDF](https://github.com/parallax/jsPDF) - PDF export
