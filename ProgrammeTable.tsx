import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROGRAMME_LEVELS } from "@/lib/research-constants";
import { StatusBadge } from "./StatusBadge";
import { SourceLink } from "./SourceLink";
import { ChevronDown, Search } from "lucide-react";

export type Programme = {
  id: string;
  name: string;
  level: string | null;
  faculty: string | null;
  department: string | null;
  campus: string | null;
  study_mode: string | null;
  duration: string | null;
  credits: string | null;
  language: string | null;
  intakes: string | null;
  application_deadline: string | null;
  next_intake: string | null;
  start_date: string | null;
  tuition_fee: string | null;
  application_fee: string | null;
  deposit: string | null;
  other_fees: string | null;
  scholarships: string | null;
  admission_requirements: string | null;
  english_requirements: string | null;
  required_documents: string | null;
  programme_specific_requirements: string | null;
  source_url: string | null;
  source_title: string | null;
  status: string;
};

const DETAIL_FIELDS: [keyof Programme, string][] = [
  ["department", "Department"],
  ["campus", "Campus"],
  ["study_mode", "Study mode"],
  ["credits", "Credits"],
  ["language", "Language of instruction"],
  ["intakes", "Intakes"],
  ["next_intake", "Next available intake"],
  ["start_date", "Start date"],
  ["application_deadline", "Application deadline"],
  ["tuition_fee", "Tuition fee"],
  ["application_fee", "Application fee"],
  ["deposit", "Deposit"],
  ["other_fees", "Other mandatory fees"],
  ["scholarships", "Scholarships"],
  ["admission_requirements", "Admission requirements"],
  ["english_requirements", "English requirements"],
  ["required_documents", "Required documents"],
  ["programme_specific_requirements", "Programme-specific requirements"],
];

export function ProgrammeTable({ programmes }: { programmes: Programme[] }) {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("all");
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      programmes.filter((p) => {
        const matchesLevel = level === "all" || (p.level ?? "").toLowerCase().includes(level.toLowerCase());
        const haystack = `${p.name} ${p.faculty ?? ""} ${p.department ?? ""}`.toLowerCase();
        return matchesLevel && haystack.includes(q.toLowerCase());
      }),
    [programmes, q, level],
  );

  if (programmes.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
        No programmes extracted yet. Run the programmes section from the research panel.
      </p>
    );
  }

  return (
    <div>
      <div className="no-print flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search programmes, e.g. Computer Science"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {PROGRAMME_LEVELS.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mt-3 font-mono text-xs text-muted-foreground">
        {filtered.length} of {programmes.length} programmes
      </p>

      <div className="mt-3 divide-y divide-border rounded-md border border-border">
        {filtered.map((p) => (
          <div key={p.id} className="print-break">
            <button
              type="button"
              className="flex w-full items-start justify-between gap-3 p-4 text-left"
              onClick={() => setOpen(open === p.id ? null : p.id)}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[p.level, p.faculty, p.duration, p.tuition_fee].filter(Boolean).join(" · ") || "Details below"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={p.status} />
                <ChevronDown
                  className={`no-print size-4 text-muted-foreground transition-transform ${open === p.id ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            <div className={open === p.id ? "block" : "hidden print:block"}>
              <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-2">
                {DETAIL_FIELDS.filter(([key]) => p[key]).map(([key, label]) => (
                  <div key={String(key)}>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="mt-0.5 whitespace-pre-line text-sm">{String(p[key])}</p>
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <SourceLink url={p.source_url} title={p.source_title} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
