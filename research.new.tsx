import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES, NATIONALITIES, STUDY_LEVELS } from "@/lib/research-constants";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/research/new")({
  head: () => ({
    meta: [
      { title: "New university research | Eduvanta University Intelligence" },
      {
        name: "description",
        content: "Start a new official-source research file for a university, nationality, study level and intake.",
      },
      { property: "og:title", content: "New university research | Eduvanta" },
      { property: "og:description", content: "Start a new official-source university research file." },
    ],
  }),
  component: NewResearch,
});

function NewResearch() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    university_name: "",
    university_url: "",
    country: "United Kingdom",
    student_nationality: "Bangladesh",
    study_level: "Master",
    intake: "",
    subject: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.university_name.trim() && !form.university_url.trim()) {
      toast.error("Enter a university name or its official website URL.");
      return;
    }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Session expired.");

      const { data, error } = await supabase
        .from("research_projects")
        .insert({
          user_id: userId,
          university_name: form.university_name.trim() || form.university_url.trim(),
          university_url: form.university_url.trim() || null,
          country: form.country,
          student_nationality: form.student_nationality,
          study_level: form.study_level,
          intake: form.intake.trim() || null,
          subject: form.subject.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;
      navigate({ to: "/research/$id", params: { id: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the research file");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">New university research</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        The engine researches the university's own website. Providing the official URL gives the most reliable result.
      </p>

      <form onSubmit={submit} className="panel mt-6 space-y-5 p-6">
        <div className="space-y-2">
          <Label htmlFor="name">University name</Label>
          <Input
            id="name"
            placeholder="e.g. University of Portsmouth"
            value={form.university_name}
            onChange={(e) => set("university_name", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">Official website URL</Label>
          <Input
            id="url"
            placeholder="https://www.port.ac.uk"
            value={form.university_url}
            onChange={(e) => set("university_url", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Name, URL, or both. Only official domains are researched.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Study destination country</Label>
            <Select value={form.country} onValueChange={(v) => set("country", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Student nationality</Label>
            <Select value={form.student_nationality} onValueChange={(v) => set("student_nationality", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NATIONALITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Study level</Label>
            <Select value={form.study_level} onValueChange={(v) => set("study_level", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STUDY_LEVELS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="intake">Intended intake / year</Label>
            <Input
              id="intake"
              placeholder="e.g. January 2027"
              value={form.intake}
              onChange={(e) => set("intake", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject / programme (optional)</Label>
          <Input
            id="subject"
            placeholder="e.g. Computer Science"
            value={form.subject}
            onChange={(e) => set("subject", e.target.value)}
          />
        </div>

        <Button type="submit" size="lg" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          Start research
        </Button>
      </form>
    </main>
  );
}
