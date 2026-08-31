import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PRINT_TOPICS, printResearch, type PrintResearch, type PrintTopic } from "@/lib/export-utils";
import { Printer } from "lucide-react";

const ALL: PrintTopic[] = PRINT_TOPICS.map((t) => t.id);

export function PrintDialog({ research }: { research: PrintResearch }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PrintTopic[]>(ALL);
  const [scope, setScope] = useState<"all" | "selected">("selected");

  const topics = scope === "all" ? ALL : selected;

  function toggle(id: PrintTopic, checked: boolean) {
    setSelected((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((t) => t !== id)));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Printer className="size-4" />
          Print / PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select what to print</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setSelected(ALL)}>
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
            Clear All
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {PRINT_TOPICS.map((t) => (
            <label
              key={t.id}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <Checkbox
                checked={selected.includes(t.id)}
                onCheckedChange={(c) => toggle(t.id, c === true)}
                disabled={scope === "all"}
              />
              {t.label}
            </label>
          ))}
        </div>

        <div className="space-y-2">
          <Label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Pages</Label>
          <RadioGroup value={scope} onValueChange={(v) => setScope(v as "all" | "selected")} className="gap-2">
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="all" /> All sections
            </label>
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="selected" /> Selected sections only
            </label>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={topics.length === 0}
            onClick={() => {
              setOpen(false);
              setTimeout(() => printResearch(research, topics), 120);
            }}
          >
            <Printer className="size-4" />
            Print preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
