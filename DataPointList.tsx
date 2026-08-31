import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONFIDENCE_LABEL } from "@/lib/research-constants";
import { StatusBadge } from "./StatusBadge";
import { SourceLink } from "./SourceLink";
import { Pencil } from "lucide-react";

export type DataPoint = {
  id: string;
  section: string;
  subsection: string | null;
  label: string;
  value: string | null;
  detail: string | null;
  source_url: string | null;
  source_title: string | null;
  status: string;
  checked_at: string;
};

export function DataPointList({ points, researchId }: { points: DataPoint[]; researchId: string }) {
  const [editing, setEditing] = useState<DataPoint | null>(null);
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: async (point: DataPoint) => {
      const { error } = await supabase
        .from("data_points")
        .update({
          label: point.label,
          value: point.value,
          detail: point.detail,
          source_url: point.source_url,
          source_title: point.source_title,
          status: point.status,
        })
        .eq("id", point.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-points", researchId] });
      setEditing(null);
      toast.success("Saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  if (points.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
        Not researched yet. Run this section from the research panel.
      </p>
    );
  }

  const groups = points.reduce<Record<string, DataPoint[]>>((acc, p) => {
    const key = p.subsection?.trim() || "General";
    (acc[key] ||= []).push(p);
    return acc;
  }, {});

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            {Object.keys(groups).length > 1 && (
              <h4 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{group}</h4>
            )}
            <div className="divide-y divide-border rounded-md border border-border">
              {items.map((p) => (
                <div key={p.id} className="print-break p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                        {p.value || "Not found on the official source."}
                      </p>
                      {p.detail && <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{p.detail}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.status} />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="no-print size-7"
                        onClick={() => setEditing({ ...p })}
                        aria-label={`Edit ${p.label}`}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <SourceLink url={p.source_url} title={p.source_title} checkedAt={p.checked_at} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit finding</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Textarea
                  rows={3}
                  value={editing.value ?? ""}
                  onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Detail</Label>
                <Textarea
                  rows={3}
                  value={editing.detail ?? ""}
                  onChange={(e) => setEditing({ ...editing, detail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Source URL</Label>
                <Input
                  value={editing.source_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, source_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONFIDENCE_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => editing && save.mutate(editing)} disabled={save.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
