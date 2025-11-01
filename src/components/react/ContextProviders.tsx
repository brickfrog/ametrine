import { ContentIndexProvider } from "../../contexts/ContentIndexContext";
import type { ReactNode } from "react";

export function ContextProviders({ children }: { children: ReactNode }) {
  return <ContentIndexProvider>{children}</ContentIndexProvider>;
}
