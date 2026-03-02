# new-component

Scaffold a new React or Astro component for ametrine.

## Description

Creates a new UI component following project conventions. Use when asked to add a new component, widget, or UI element.

## Instructions

### Choose component type

- **React (.tsx)**: for interactive components with state, effects, or client-side behavior. Place in `src/components/react/`.
- **Astro (.astro)**: for layout wrappers, static markup, or server-rendered composition. Place in `src/components/`.

### React component pattern

```tsx
import { type FC } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface YourComponentProps {
  // props here
  className?: string;
}

const YourComponent: FC<YourComponentProps> = ({ className }) => {
  return (
    <div className={twMerge(clsx("base-classes", className))}>
      {/* content */}
    </div>
  );
};

export default YourComponent;
```

Rules:
- Functional components only, no class components
- Use `clsx` + `twMerge` for conditional/merged Tailwind classes
- Use `cva` (class-variance-authority) for components with multiple variants
- State with `useState`, `useReducer`; side effects with `useEffect`
- Global state via nanostores — import from `src/stores/`
- Type props explicitly with an interface; never use `any`

### Astro component pattern

```astro
---
interface Props {
  title: string;
  class?: string;
}

const { title, class: className } = Astro.props;
---

<div class:list={["base-classes", className]}>
  <slot />
</div>
```

### Styling

- Tailwind utility classes only — no inline styles, no CSS modules
- Typography content: use `prose` class (from `@tailwindcss/typography`)
- Dark mode: use `dark:` variant
- Do not hard-code colors — use Tailwind's semantic palette or the site's configured theme colors from `src/config.ts`

### Using the component

- In Astro files: import directly — `import YourComponent from "../components/YourComponent.astro"`
- React inside Astro: add `client:load` (or appropriate directive) for interactivity — `<YourComponent client:load />`
- React context providers are in `ContextProviders.tsx` — add new providers there if needed

### Verify

```bash
bun run check    # astro type check
bun run lint     # oxlint (skips .astro files)
```
