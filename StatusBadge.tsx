import { CONFIDENCE_CLASS, CONFIDENCE_LABEL, type Confidence } from "@/lib/research-constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = (status in CONFIDENCE_LABEL ? status : "needs_verification") as Confidence;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        CONFIDENCE_CLASS[key],
        className,
      )}
    >
      {CONFIDENCE_LABEL[key]}
    </span>
  );
}
