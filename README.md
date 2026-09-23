# Kiro Chat to Markdown Converter

A small, privacy-friendly web tool for converting exported **Kiro IDE chat ZIP files** into a single, readable Markdown document.

The converter runs entirely in the browser. Your Kiro export is parsed locally and is **not uploaded to a backend**.

## Features

- Convert Kiro chat export ZIP files to Markdown
- Convert multiple sessions/archives in one batch
- Preserve chronological message order
- Include session metadata, timestamps, tool calls, tool results, and sub-agent executions
- Optional table of contents for longer conversations
- Preview the generated Markdown before downloading
- Download individual `.md` files or a ZIP containing multiple conversions
- Configurable conversion options
- No account or API key required

## Privacy

This project is designed as a client-side application.

The uploaded ZIP files are processed in your browser using JavaScript. There is no application server, database, analytics backend, or AI API required for conversion.

If you deploy your own copy, the same client-side architecture applies unless you add additional services yourself.

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS
- JSZip
- Marked
- Lucide React
- Motion

## Run locally

### Prerequisites

- Node.js 20+
- npm (or Bun, if you prefer)

### Install

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

The app will be available at the local URL printed by Vite.

### Type-check

```bash
npm run lint
```

### Build for production

```bash
npm run build
```

The production files are generated in `dist/`.

## Deploy to Vercel

This is a standard Vite SPA, so it can be deployed directly to Vercel without a backend or environment variables.

### Option 1: Vercel dashboard

1. Push this repository to GitHub.
2. Sign in to Vercel.
3. Import the GitHub repository.
4. Vercel should detect **Vite** automatically.
5. Use the default build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
6. Deploy.

No `.env` configuration is required for the converter.

### Option 2: Vercel CLI

```bash
npm install -g vercel
vercel
```

For a production deployment:

```bash
vercel --prod
```

## GitHub setup

After extracting this project, initialize the repository and push it to GitHub:

```bash
git init
git add .
git commit -m "Initial open source release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kiro-chat-to-markdown.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username and update the repository URL if you choose a different repository name.

## Project structure

```text
.
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
│   ├── components/
│   ├── types/
│   └── utils/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Important source modules

- `src/utils/kiroParser.ts` — reads and normalizes Kiro export data
- `src/utils/markdownGenerator.ts` — generates the final Markdown document
- `src/utils/zipExport.ts` — handles Markdown and batch ZIP downloads
- `src/types/kiro.ts` — shared TypeScript types
- `src/App.tsx` — application workflow and UI state

## Contributing

Pull requests and issue reports are welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the basic contribution workflow.

## Security

Please see [`SECURITY.md`](SECURITY.md) for reporting security issues.

## License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE).

## Disclaimer

Kiro is a product name/trademark of its respective owner. This project is an independent open-source utility and is not affiliated with or endorsed by Kiro or its owner.
