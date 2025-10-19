# Project Synoptic Edge: AI Co-Pilot Protocols

This document outlines the standard operating procedures, system prompts, and debugging protocols for AI-assisted development on Project Synoptic Edge. Its purpose is to ensure consistency, quality, and efficiency.

## 1. Phase-by-Phase System Prompts for Gemini

These prompts establish the persona and core instructions for the AI co-pilot at different stages of the development lifecycle.

### Phase 1: Scaffolding & Initial Setup

```
System: Act as a world-class senior frontend architect specializing in modern React ecosystems (TypeScript, esbuild, TailwindCSS, Framer Motion) and institutional-grade application design. Your primary task is to establish a robust, scalable, and maintainable project structure.

**Core Directives:**
- **Structure First:** Prioritize a logical directory structure (`src/components`, `src/services`, `src/hooks`, `src/pages`, `src/types`, `src/contexts`, `src/assets`).
- **Type Safety:** Define core data structures in a central `src/types/index.ts` file. All components and functions must be strongly typed.
- **Styling Foundation:** Establish a theming system using CSS variables in `index.html` for base, light/dark modes, and dynamic team colors.
- **State Management:** For global state, use React Context. Keep component state local where possible.
- **API Abstraction:** All external data fetching (live APIs or mocks) must be placed in `src/services`. No `fetch` calls within components.
```

### Phase 2: Feature Implementation

```
System: Act as a world-class senior frontend engineer with deep expertise in UI/UX design, data visualization, and the Google Gemini API. You are building interactive, high-performance components for an institutional-grade financial analytics tool.

**Core Directives:**
- **Componentization:** Break down features into small, reusable, single-responsibility components.
- **Asynchronous UI:** All data-dependent components must gracefully handle loading, error, and empty states. Use skeletons, loaders, and informative messages.
- **Accessibility (A11y):** All interactive elements must be fully accessible. Use semantic HTML, ARIA attributes (`aria-label`, `aria-current`, etc.), and ensure keyboard navigability.
- **Performance:** Prioritize performance. Use `useMemo`, `useCallback`, and `React.memo` where appropriate to prevent unnecessary re-renders. Lazy load components that are not critical for the initial view.
- **Gemini API Best Practices:** Adhere strictly to the provided `@google/genai` coding guidelines. Ensure all API calls use appropriate schemas for JSON mode and have robust error handling.
- **Aesthetics:** All UI must be visually polished, responsive, and adhere to the established design system (TailwindCSS with theme variables). Animations should be purposeful and smooth, using Framer Motion.
```

### Phase 3: Debugging & Refactoring

```
System: Act as a meticulous and systematic debugging expert. Your goal is to identify the root cause of an issue, implement a robust fix, and ensure the fix does not introduce regressions. You must log every step of your process.

**Core Directives:**
- **Analyze First:** Before changing code, thoroughly analyze the error message, stack trace, and component behavior. Form a hypothesis about the root cause.
- **Isolate the Problem:** Reproduce the issue with a minimal test case if possible.
- **Minimal, Targeted Fixes:** Implement the smallest possible change to fix the issue. Avoid large-scale refactors unless they are the only solution.
- **Verify the Fix:** Confirm that the original issue is resolved and that no new issues have been introduced.
- **Document Everything:** Use the session logging template to document your analysis, the fix, and the verification process.
- **Module Resolution:** When encountering import/export errors, first analyze the project configuration (`tsconfig.json`, import maps). The primary fix is to use correct relative or project-absolute paths.
```

## 2. Module Resolution Error Fixes

Module resolution errors (`Cannot find module...` or `The requested module... does not provide an export named...`) are common. The protocol for fixing them is as follows:

1.  **Identify the Path Type:**
    *   **Relative Path (`./` or `../`):** The path is calculated from the current file's location.
    *   **Absolute/Project-Relative Path (`src/` or `components/`):** The path is calculated from the project root. This project is configured to resolve from the root, so paths should be relative to the project root (e.g., `src/types`).
    *   **Bare Specifier (`react`, `@google/genai`):** The path refers to a package defined in the `index.html` import map.

2.  **Common Errors & Fixes in this Project:**
    *   **Error:** `Cannot find module '../types' from 'src/components/layout/Layout.tsx'`.
        *   **Analysis:** The path `../types` attempts to go up from `src/components/layout` to `src/components` and then look for a `types` file/directory, which does not exist. The correct types file is at `src/types/index.ts`.
        *   **Fix:** Change the import to be a project-relative path: `import { Page } from 'src/types';`. Or, use a correct relative path like `import { Page } from '../../types';`. The former is preferred for consistency.

    *   **Error:** `The requested module '...' does not provide an export named 'LionHead'`.
        *   **Analysis:** The file `src/assets/svg/LionHead.tsx` uses `export const LionHead = ...`, which is a named export. The importing file, however, uses `import LionHead from '...'`, which is for default exports.
        *   **Fix:** Change the import to use curly braces for a named import: `import { LionHead } from 'src/assets/svg/LionHead';`.

## 3. Syntax Error Debugging Protocols

1.  **Read the Error Carefully:** The error message from the browser console or build tool will specify the exact file, line number, and character.
2.  **Inspect the Code:** Go to the specified location. Look for common issues:
    *   Unmatched parentheses `()`, brackets `[]`, or curly braces `{}`.
    *   Missing commas in objects or arrays.
    *   Invalid or missing keywords (`const`, `let`, `function`).
    *   TypeScript-specific errors: type mismatches, missing type definitions, incorrect generic syntax (`<T>`).
3.  **Use the Linter:** The code editor's integrated linter (ESLint) will often highlight syntax errors in real-time. Pay attention to red squiggly lines.
4.  **Isolate the Change:** If the error appeared after a recent change, comment out the new code block by block until the error disappears. This will pinpoint the exact line causing the issue.

## 4. Testing and Optimization Procedures

### Testing

*   **Component Isolation:** Use Storybook or a similar tool to develop and test components in isolation.
*   **Unit Tests:** For complex business logic (e.g., functions in `utils.ts`, calculations in services), write unit tests using a framework like Jest or Vitest.
*   **Interaction Testing:** Use React Testing Library to write tests that simulate user interactions (clicking, typing) and verify that the UI updates as expected. Test for accessibility by querying for ARIA roles.

### Optimization

1.  **Profiling:** Use the React DevTools Profiler to identify components that are re-rendering unnecessarily or taking a long time to render.
2.  **Memoization:**
    *   Wrap components that re-render with the same props in `React.memo`.
    *   Memoize expensive calculations within components using `useMemo`.
    *   Memoize callback functions passed to child components using `useCallback`.
3.  **Bundle Size Analysis:** Use a tool like `vite-bundle-visualizer` to inspect the final bundle size.
4.  **Code Splitting / Lazy Loading:** Use `React.lazy()` and `<Suspense>` to code-split components that are not needed on the initial page load (e.g., modals, components in non-visible tabs). This is already implemented in `MainPanel.tsx`.

## 5. Error Prevention Blueprint

*   **Strict TypeScript:** Enable `strict` mode in `tsconfig.json`. Avoid using `any` unless absolutely necessary. Define clear, precise types for all data structures.
*   **Aggressive Linting:** Configure ESLint with strict rules (e.g., `eslint-plugin-react-hooks`) to catch common errors like missing dependencies in `useEffect`.
*   **Defensive Programming:**
    *   Always check for the existence of data before accessing its properties (e.g., `data?.events?.map(...)`).
    *   Include comprehensive error handling (`try...catch`) in all API service functions.
    *   Provide clear error messages to the user in the UI.
*   **Immutable State:** Treat state as immutable. When updating state objects or arrays, always create a new object/array instead of mutating the existing one.
*   **Centralized Services:** Never perform direct API calls or manipulate raw data within a UI component. Delegate all data fetching and business logic to the `services` layer.

## 6. Session Logging Template

Use this Markdown template to document debugging sessions or significant feature implementations.

```markdown
### Session Log: [YYYY-MM-DD] - [Brief Task Description]

**Objective:** [State the goal of the session, e.g., "Fix bug where Prop Ranker crashes on empty results."]

**1. Initial Analysis & Hypothesis:**
*   **Observed Behavior:** [Describe the bug or feature requirement in detail.]
*   **Error Messages:** [Paste relevant console errors or stack traces.]
*   **Hypothesis:** [Formulate a theory about the root cause. e.g., "The `filterOptions` useMemo hook is likely crashing when `results` is an empty array because it tries to access properties on `undefined`."]

**2. Investigation Steps:**
1.  [Step 1: e.g., "Added a `console.log(results)` inside the `PropTypeRankingTool` component to verify state on initial render."]
2.  [Step 2: e.g., "Confirmed `results` is `[]` before `handleRank` is called."]
3.  [Step 3: e.g., "Inspected `PROP_TYPES` generation. Found that it would crash if a player object from the mock data was missing a `props` array."]

**3. Implemented Solution:**
*   **File(s) Modified:** [`src/components/PropTypeRankingTool.tsx`]
*   **Code Diff:**
    ```diff
    - MOCK_GAMES_SOURCE.flatMap(g => g.players.flatMap(p => p.props.map(prop => prop.propType)))
    + MOCK_GAMES_SOURCE.flatMap(g => g.players.flatMap(p => p.props?.map(prop => prop.propType) || []))
    ```
*   **Rationale:** [Explain why this fix works. e.g., "Added optional chaining (`?.`) to the `flatMap` for `p.props`. If a player object from a mock or live source has no `props` array, this prevents a crash and returns an empty array instead, making the `Set` creation robust."]

**4. Verification:**
*   [x] The original bug is resolved.
*   [x] The component renders correctly with an empty data set.
*   [x] The component still functions correctly with a populated data set.
*   [x] No new console errors are present.

**Session Outcome:** Success
```