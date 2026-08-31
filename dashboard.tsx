import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Research library | Eduvanta University Intelligence" },
      {
        name: "description",
        content: "All saved university research files with their status, country and last update date.",
      },
      { property: "og:title", content: "Research library | Eduvanta University Intelligence" },
      { property: "og:description", content: "Saved and reusable university research for consultancy staff." },
    ],
  }),
  component: Dashboard,
});

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  discovered: "Sources found",
  scraped: "Pages captured",
  researched: "Researched",
};

function Dashboard() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["research-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research_projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = (data ?? []).filter((r) =>
    `${r.university_name} ${r.country} ${r.subject ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Research library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved university research files. Re-open a file to review, edit or export it.
          </p>
        </div>
        <Link to="/research/new">
          <Button>
            <Plus className="size-4" />
            New university research
          </Button>
        </Link>
      </div>

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by university, country or subject"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel mt-6 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No research files yet. Start with a university name or its official website URL.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {filtered.map((r) => (
            <Link key={r.id} to="/research/$id" params={{ id: r.id }} className="panel block p-5 transition-colors hover:border-primary/50">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-base font-semibold">{r.university_name}</h2>
                <Badge variant="outline">{STATUS_LABEL[r.status] ?? r.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {r.country} · {r.study_level} · {r.student_nationality} applicant
                {r.intake ? ` · ${r.intake}` : ""}
                {r.subject ? ` · ${r.subject}` : ""}
              </p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Updated {new Date(r.updated_at).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
