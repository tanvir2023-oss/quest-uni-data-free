import { ExternalLink } from "lucide-react";

export function SourceLink({
  url,
  title,
  checkedAt,
}: {
  url?: string | null;
  title?: string | null;
  checkedAt?: string | null;
}) {
  if (!url) {
    return (
      <p className="font-mono text-[11px] text-muted-foreground">No official source URL recorded for this item.</p>
    );
  }
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-muted-foreground">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
      >
        <ExternalLink className="size-3" />
        {title || url}
      </a>
      <span className="hidden sm:inline">·</span>
      <span className="break-all">{url}</span>
      {checkedAt && <span>· Checked {new Date(checkedAt).toLocaleDateString()}</span>}
    </p>
  );
}
