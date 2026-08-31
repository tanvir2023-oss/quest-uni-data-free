import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { DataPointList, type DataPoint } from "@/components/research/DataPointList";
import { ProgrammeTable, type Programme } from "@/components/research/ProgrammeTable";
import { StatusBadge } from "@/components/research/StatusBadge";
import { SourceLink } from "@/components/research/SourceLink";
import { SECTIONS, type SectionKey } from "@/lib/research-constants";
import { discoverSources, scrapeBatch, runSectionExtraction } from "@/lib/research.functions";
import { PrintDialog } from "@/components/research/PrintDialog";
import { downloadFile, slugify, toCsv } from "@/lib/export-utils";
import { Download, Loader2, Play } from "lucide-react";

export const Route = createFileRoute("/_authenticated/research/$id")({
  head: () => ({
    meta: [
      { title: "Research file | Eduvanta University Intelligence" },
      {
        name: "description",
        content: "Sourced university research: requirements, English scores, fees, documents, scholarships and intakes.",
      },
      { property: "og:title", content: "Research file | Eduvanta University Intelligence" },
      { property: "og:description", content: "Official-source university research with verifiable links." },
    ],
  }),
  component: ResearchDetail,
});

function ResearchDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState("");
  const [progress, setProgress] = useState(0);
  const startedRef = useRef(false);

  const discover = useServerFn(discoverSources);
  const scrape = useServerFn(scrapeBatch);
  const extract = useServerFn(runSectionExtraction);

  const project = useQuery({
    queryKey: ["research", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("research_projects").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const points = useQuery({
    queryKey: ["data-points", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_points")
        .select("*")
        .eq("research_id", id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as DataPoint[];
    },
  });

  const programmes = useQuery({
    queryKey: ["programmes", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("programmes").select("*").eq("research_id", id).order("name");
      if (error) throw error;
      return data as Programme[];
    },
  });

  const faculties = useQuery({
    queryKey: ["faculties", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("faculties").select("*").eq("research_id", id).order("name");
      if (error) throw error;
      return data;
    },
  });

  async function runAll() {
    if (running) return;
    setRunning(true);
    try {
      setStep("Finding the official website and pages…");
      setProgress(4);
      await discover({ data: { researchId: id } });

      for (let i = 0; i < 8; i++) {
        const res = await scrape({ data: { researchId: id, size: 6 } });
        setStep(`Capturing official pages (${res.remaining} left)…`);
        setProgress(6 + Math.min(34, (i + 1) * 6));
        if (res.remaining === 0 || res.scraped === 0) break;
      }

      const total = SECTIONS.length;
      let done = 0;
      const batchSize = 3;
      for (let i = 0; i < total; i += batchSize) {
        const batch = SECTIONS.slice(i, i + batchSize);
        setStep(`Researching: ${batch.map((s) => s.title).join(", ")}…`);
        const results = await Promise.allSettled(
          batch.map((section) => extract({ data: { researchId: id, section: section.key } })),
        );
        for (const r of results) if (r.status === "rejected") console.error("section failed", r.reason);
        done += batch.length;
        setProgress(40 + Math.round((done / total) * 60));
        queryClient.invalidateQueries({ queryKey: ["data-points", id] });
        queryClient.invalidateQueries({ queryKey: ["programmes", id] });
        queryClient.invalidateQueries({ queryKey: ["faculties", id] });
      }

      await supabase.from("research_projects").update({ status: "researched" }).eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["research", id] });
      queryClient.invalidateQueries({ queryKey: ["programmes", id] });
      queryClient.invalidateQueries({ queryKey: ["faculties", id] });
      setStep("Research complete");
      setProgress(100);
      toast.success("Research complete");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Research failed");
      setStep("Research stopped");
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    if (project.data?.status === "draft" && !startedRef.current) {
      startedRef.current = true;
      void runAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.data?.status]);

  function exportCsv() {
    const rows = (points.data ?? []).map((p) => ({
      section: p.section,
      subsection: p.subsection ?? "",
      label: p.label,
      value: p.value ?? "",
      detail: p.detail ?? "",
      status: p.status,
      source_url: p.source_url ?? "",
      source_title: p.source_title ?? "",
      checked_at: p.checked_at,
    }));
    if (rows.length === 0) {
      toast.error("Nothing to export yet.");
      return;
    }
    downloadFile(
      `${slugify(project.data?.university_name ?? "research")}-findings.csv`,
      toCsv(rows),
      "text/csv;charset=utf-8",
    );
  }

  if (project.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    );
  }

  const p = project.data;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{p?.university_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {p?.country} · {p?.study_level} · {p?.student_nationality} applicant
            {p?.intake ? ` · ${p.intake}` : ""}
            {p?.subject ? ` · ${p.subject}` : ""}
          </p>
          {p?.official_domain && (
            <p className="mt-2">
              <SourceLink url={p.official_domain} title="Official website" />
            </p>
          )}
        </div>
        <div className="no-print flex flex-wrap items-center gap-2">
          <Badge variant="outline">{p?.status}</Badge>
          <PrintDialog
            research={{
              universityName: p?.university_name ?? "University research",
              country: p?.country,
              studyLevel: p?.study_level,
              nationality: p?.student_nationality,
              intake: p?.intake,
              subject: p?.subject,
              officialDomain: p?.official_domain,
              points: (points.data ?? []).map((d) => ({
                section: d.section,
                subsection: d.subsection,
                label: d.label,
                value: d.value,
                detail: d.detail,
                status: d.status,
                source_url: d.source_url,
                source_title: d.source_title,
              })),
              faculties: (faculties.data ?? []).map((f: any) => ({
                name: f.name,
                kind: f.kind,
                departments: Array.isArray(f.departments) ? f.departments : [],
                source_url: f.source_url,
              })),
            }}
          />
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="size-4" />
            CSV
          </Button>
          <Button size="sm" onClick={() => void runAll()} disabled={running}>
            {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            {running ? "Researching…" : "Run research"}
          </Button>
        </div>
      </div>

      {(running || progress > 0) && (
        <div className="panel no-print mt-6 p-5">
          <p className="text-sm font-medium">{step}</p>
          <Progress value={progress} className="mt-3" />
        </div>
      )}

      <Tabs defaultValue={SECTIONS[0]!.key} className="mt-8">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          {SECTIONS.map((s) => (
            <TabsTrigger key={s.key} value={s.key}>
              {s.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {SECTIONS.map((s) => (
          <TabsContent key={s.key} value={s.key} className="mt-6">
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <p className="mb-4 text-sm text-muted-foreground">{s.blurb}</p>

            {s.key === "programmes" ? (
              <ProgrammeTable programmes={programmes.data ?? []} />
            ) : s.key === "faculties" ? (
              <FacultyList rows={faculties.data ?? []} />
            ) : (
              <DataPointList
                researchId={id}
                points={(points.data ?? []).filter((d) => d.section === (s.key as SectionKey))}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}

function FacultyList({ rows }: { rows: any[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
        Not researched yet. Run the research panel to populate this section.
      </p>
    );
  }
  return (
    <div className="divide-y divide-border rounded-md border border-border">
      {rows.map((f) => (
        <div key={f.id} className="print-break p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {f.name}
              {f.kind ? <span className="ml-2 text-xs text-muted-foreground">{f.kind}</span> : null}
            </p>
            <StatusBadge status={f.status} />
          </div>
          {Array.isArray(f.departments) && f.departments.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">{f.departments.join(" · ")}</p>
          )}
          <div className="mt-2">
            <SourceLink url={f.source_url} title={f.source_title} />
          </div>
        </div>
      ))}
    </div>
  );
}
