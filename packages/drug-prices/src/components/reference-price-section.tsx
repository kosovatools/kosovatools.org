import { formatCurrency } from "@workspace/utils";
import type { ReferenceSection } from "../utils/records";

type ReferencePriceSectionProps = {
  section: ReferenceSection;
};

export function ReferencePriceSection({ section }: ReferencePriceSectionProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {section.title}
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {section.entries.map((entry) => (
          <div
            key={`${section.title}-${entry.label}`}
            className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
          >
            <span className="text-muted-foreground">{entry.label}</span>
            <span className="font-medium">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
