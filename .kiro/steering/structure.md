# Project Structure

## Root Level
- `App.tsx` - Main application component with layout structure
- `index.tsx` - React application entry point
- `types.ts` - TypeScript type definitions for the entire application
- `constants.ts` - Application constants including Knowledge Modules
- `utils.ts` - Utility functions (file conversion, etc.)

## Components Directory (`/components`)
Organized by functionality with clear separation of concerns:

- `SynopticLens.tsx` - Main analysis interface component
- `AnalysisTable.tsx` - Complex data table with expandable rows and interactive features
- `ImageUpload.tsx` - Drag-and-drop file upload component
- `ChatInput.tsx` - Chat interface input component
- `ChatPanel.tsx` - Chat interface panel
- `Message.tsx` - Individual message component
- `Sidebar.tsx` - Application sidebar navigation
- `SystemStatusPanel.tsx` - System status and updates display
- `icons/` - Custom SVG icon components

## Services Directory (`/services`)
- `geminiService.ts` - Google Gemini AI integration with structured schemas

## Architecture Patterns

### Component Organization
- Functional components with React hooks
- TypeScript interfaces for all props
- Consistent naming: PascalCase for components, camelCase for functions

### State Management
- Local component state with `useState`
- No global state management library (Redux/Zustand)
- Props drilling for data flow

### Styling Approach
- Tailwind CSS utility classes
- Consistent color scheme: gray-based with cyan accents
- Responsive design with mobile-first approach
- Dark theme throughout

### Data Flow
1. Image upload → Base64 conversion
2. Gemini API extraction → Structured bet data
3. Individual leg analysis → Quantitative metrics
4. Results display with interactive reasoning breakdown

## File Naming Conventions
- Components: PascalCase (e.g., `AnalysisTable.tsx`)
- Services: camelCase (e.g., `geminiService.ts`)
- Types: Descriptive interfaces (e.g., `AnalyzedBetLeg`, `SystemUpdate`)
- Constants: UPPER_SNAKE_CASE for arrays/objects