import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { GraduationCap, ShieldCheck, FileSearch, FileDown, Globe2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eduvanta University Intelligence | Study Abroad Research" },
      {
        name: "description",
        content:
          "Internal research platform for verified university, admission, English test, fee and document intelligence sourced from official study-abroad websites.",
      },
      { property: "og:title", content: "Eduvanta University Intelligence" },
      {
        property: "og:description",
        content:
          "Research universities, programmes and admission requirements from official sources, with a verified source URL behind every data point.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: FileSearch,
    title: "Official-source research",
    body: "The engine discovers the university's own admissions, international, fees and programme pages, then extracts structured findings from that text only.",
  },
  {
    icon: ShieldCheck,
    title: "Nothing invented",
    body: "Every data point carries its source URL, page title, research date and a confirmed / needs-verification / not-found status.",
  },
  {
    icon: Globe2,
    title: "Nationality aware",
    body: "Country-specific entry requirements are separated from general international requirements, for Bangladesh, India, Nepal, Nigeria and more.",
  },
  {
    icon: FileDown,
    title: "Consultation-ready exports",
    body: "Produce a student-friendly report, an internal detailed report with sources, or a CSV of the programme database.",
  },
];

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard" });
  }, [loading, session, navigate]);

  return (
    <main className="grid-backdrop min-h-screen">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-5 text-primary" />
          <span className="font-display text-sm font-semibold tracking-tight">Eduvanta Intelligence</span>
        </div>
        <Link to="/auth">
          <Button size="sm">Staff sign in</Button>
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:pt-24">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          University &amp; study abroad research intelligence
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] sm:text-6xl">
          Verified university research your counsellors can defend.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Eduvanta researches universities directly from their official websites — admissions, English requirements,
          tuition and payment procedures, intakes, faculties, scholarships and document checklists — and attaches a
          source URL and confidence status to every single finding.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/auth">
            <Button size="lg">Open the research console</Button>
          </Link>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <article key={f.title} className="panel p-6">
              <f.icon className="size-5 text-primary" />
              <h2 className="mt-4 text-base font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>

        <div className="panel mt-6 p-6">
          <h2 className="text-base font-semibold">The accuracy rule</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            The platform never generates a requirement because it is common elsewhere. If an official source cannot be
            found for a data point, it is recorded as{" "}
            <span className="text-foreground">&ldquo;Not found on the official source.&rdquo;</span> Third-party
            material is never allowed to override an official university page.
          </p>
        </div>
      </section>
    </main>
  );
}
