# Technology Stack

## Frontend Framework
- **React 19.1.1** with TypeScript
- **Vite** as build tool and dev server
- **Tailwind CSS** for styling (utility-first approach)

## Key Dependencies
- **@google/genai**: Google Gemini AI integration for analysis and OCR
- **react-dropzone**: File upload handling for bet slip images
- **@types/node**: Node.js type definitions

## Build System & Commands

### Development
```bash
npm run dev          # Start development server on port 3000
```

### Production
```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

### Setup
```bash
npm install          # Install dependencies
```

## Environment Configuration
- Requires `GEMINI_API_KEY` in `.env.local`
- Vite exposes environment variables as `process.env.API_KEY` and `process.env.GEMINI_API_KEY`

## TypeScript Configuration
- Target: ES2022
- Module: ESNext
- JSX: react-jsx
- Path aliases: `@/*` maps to project root
- Experimental decorators enabled

## Development Server
- Host: 0.0.0.0 (accessible externally)
- Port: 3000
- Hot module replacement enabled