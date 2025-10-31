import { MarginaliaManager } from "./MarginaliaManager";

interface MarginaliaEntry {
  id: number;
  content: string;
  html: string;
}

interface Props {
  marginalia: MarginaliaEntry[];
}

export function MarginaliaColumn({ marginalia }: Props) {
  return (
    <div className="marginalia-column">
      <MarginaliaManager marginalia={marginalia} />
    </div>
  );
}
