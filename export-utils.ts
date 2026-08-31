function escapeCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return `"${s.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return "";
  const cols = columns ?? Object.keys(rows[0] ?? {});
  const head = cols.map(escapeCell).join(",");
  const body = rows.map((r) => cols.map((c) => escapeCell(r[c])).join(",")).join("\n");
  return `${head}\n${body}`;
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/* ------------------------------------------------------------------ *
 * Print / PDF report generation
 * ------------------------------------------------------------------ */

export type PrintTopic =
  | "overview"
  | "admission"
  | "tuition"
  | "deadlines"
  | "documents"
  | "scholarships"
  | "intakes"
  | "payment"
  | "sources";

export const PRINT_TOPICS: { id: PrintTopic; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "admission", label: "Admission" },
  { id: "tuition", label: "Tuition" },
  { id: "deadlines", label: "Deadlines" },
  { id: "documents", label: "Documents" },
  { id: "scholarships", label: "Scholarships" },
  { id: "intakes", label: "Intakes" },
  { id: "payment", label: "Payment" },
  { id: "sources", label: "Sources" },
];

export type PrintRow = {
  label: string;
  value?: string | null | undefined;
  detail?: string | null | undefined;
  status?: string | null | undefined;
  source_url?: string | null | undefined;
  source_title?: string | null | undefined;
  section?: string | undefined;
  subsection?: string | null | undefined;
};

export type PrintResearch = {
  universityName: string;
  country?: string | null | undefined;
  studyLevel?: string | null | undefined;
  nationality?: string | null | undefined;
  intake?: string | null | undefined;
  subject?: string | null | undefined;
  officialDomain?: string | null | undefined;
  points: PrintRow[];
  faculties?:
    | { name: string; kind?: string | null | undefined; departments?: string[] | null | undefined; source_url?: string | null | undefined }[]
    | undefined;
};

const TOPIC_SECTIONS: Record<Exclude<PrintTopic, "sources">, string[]> = {
  overview: ["profile", "faculties"],
  admission: ["academic_requirements", "country_requirements", "english_requirements"],
  tuition: ["fees_payment"],
  deadlines: ["intakes"],
  documents: ["documents"],
  scholarships: ["scholarships"],
  intakes: ["intakes"],
  payment: ["fees_payment"],
};

const PAYMENT_WORDS = /payment|installment|instalment|deposit|refund|bank|transfer|invoice|pay /i;
const DEADLINE_WORDS = /deadline|closing|close|apply by|cut-?off|due/i;

function rowsForTopic(topic: PrintTopic, research: PrintResearch): PrintRow[] {
  if (topic === "sources") return [];
  const sections = TOPIC_SECTIONS[topic];
  let rows = research.points.filter((p) => sections.includes(p.section ?? ""));
  if (topic === "payment") {
    rows = rows.filter((r) => PAYMENT_WORDS.test(`${r.label} ${r.value ?? ""} ${r.detail ?? ""}`));
  } else if (topic === "tuition") {
    rows = rows.filter((r) => !PAYMENT_WORDS.test(`${r.label}`) || /fee|tuition|cost/i.test(r.label));
  } else if (topic === "deadlines") {
    rows = rows.filter((r) => DEADLINE_WORDS.test(`${r.label} ${r.value ?? ""}`));
  }
  return rows;
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tableHtml(rows: PrintRow[]): string {
  const body = rows
    .map(
      (r) => `<tr>
        <th scope="row">${esc(r.label)}</th>
        <td>${esc(r.value || "Not found on the official source.")}${
          r.detail ? `<div class="detail">${esc(r.detail)}</div>` : ""
        }${r.source_url ? `<div class="src">${esc(r.source_url)}</div>` : ""}</td>
        <td class="status">${esc((r.status ?? "").replace(/_/g, " "))}</td>
      </tr>`,
    )
    .join("");
  return `<table><colgroup><col style="width:30%"><col><col style="width:16%"></colgroup><tbody>${body}</tbody></table>`;
}

function facultiesHtml(research: PrintResearch): string {
  const list = research.faculties ?? [];
  if (list.length === 0) return "";
  const body = list
    .map(
      (f) =>
        `<tr><th scope="row">${esc(f.name)}${f.kind ? ` <span class="muted">(${esc(f.kind)})</span>` : ""}</th><td>${esc(
          (f.departments ?? []).join(" · "),
        )}</td></tr>`,
    )
    .join("");
  return `<h3>Faculties &amp; schools</h3><table><tbody>${body}</tbody></table>`;
}

function sourcesHtml(research: PrintResearch, topics: PrintTopic[]): string {
  const used = topics.filter((t) => t !== "sources").flatMap((t) => rowsForTopic(t, research));
  const urls = new Map<string, string>();
  for (const r of used) if (r.source_url) urls.set(r.source_url, r.source_title || r.source_url);
  for (const f of research.faculties ?? []) if (f.source_url) urls.set(f.source_url, f.source_url);
  if (research.officialDomain) urls.set(research.officialDomain, "Official website");
  if (urls.size === 0) return "<p>No source URLs recorded.</p>";
  return `<ol class="sources">${[...urls.entries()]
    .map(([url, title]) => `<li><span>${esc(title)}</span><br><span class="src">${esc(url)}</span></li>`)
    .join("")}</ol>`;
}

function reportHtml(research: PrintResearch, topics: PrintTopic[]): string {
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const meta = [research.country, research.studyLevel, research.nationality ? `${research.nationality} applicant` : null, research.intake, research.subject]
    .filter(Boolean)
    .join(" · ");

  const sections = topics
    .map((topic) => {
      const label = PRINT_TOPICS.find((t) => t.id === topic)?.label ?? topic;
      if (topic === "sources") {
        return `<section><h2>Sources</h2>${sourcesHtml(research, topics)}</section>`;
      }
      const rows = rowsForTopic(topic, research);
      const extra = topic === "overview" ? facultiesHtml(research) : "";
      if (rows.length === 0 && !extra) {
        return `<section><h2>${esc(label)}</h2><p class="muted">No information recorded for this topic.</p></section>`;
      }
      return `<section><h2>${esc(label)}</h2>${rows.length ? tableHtml(rows) : ""}${extra}</section>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(research.universityName)} — Research report</title>
<style>
  @page { margin: 16mm; @bottom-right { content: counter(page) " / " counter(pages); font-size: 9pt; color: #666; } }
  * { box-sizing: border-box; }
  body { font-family: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif; color: #14181f; margin: 0; font-size: 10.5pt; line-height: 1.45; }
  header { border-bottom: 2px solid #14181f; padding-bottom: 10px; margin-bottom: 18px; }
  h1 { font-size: 20pt; margin: 0 0 4px; letter-spacing: -0.01em; }
  header p { margin: 2px 0; color: #4a5361; font-size: 9.5pt; }
  section { break-inside: auto; margin-bottom: 22px; }
  section + section { break-before: page; }
  h2 { font-size: 13pt; margin: 0 0 8px; padding-bottom: 4px; border-bottom: 1px solid #c9d0da; break-after: avoid; }
  h3 { font-size: 11pt; margin: 16px 0 6px; break-after: avoid; }
  table { width: 100%; border-collapse: collapse; }
  tr { break-inside: avoid; }
  th, td { text-align: left; vertical-align: top; padding: 6px 8px; border-bottom: 1px solid #dde2e9; font-weight: 400; }
  th[scope="row"] { font-weight: 600; width: 30%; }
  td.status { color: #4a5361; font-size: 8.5pt; text-transform: capitalize; white-space: nowrap; }
  .detail { color: #4a5361; font-size: 9pt; margin-top: 3px; white-space: pre-line; }
  .src { color: #5a6472; font-size: 8pt; word-break: break-all; margin-top: 3px; }
  .muted { color: #6b7280; }
  ol.sources { padding-left: 18px; }
  ol.sources li { margin-bottom: 6px; break-inside: avoid; }
  footer { margin-top: 20px; border-top: 1px solid #c9d0da; padding-top: 8px; color: #6b7280; font-size: 8.5pt; }
</style></head><body>
<header>
  <h1>${esc(research.universityName)}</h1>
  ${meta ? `<p>${esc(meta)}</p>` : ""}
  <p>Research date: ${esc(date)}</p>
  ${research.officialDomain ? `<p class="src">${esc(research.officialDomain)}</p>` : ""}
</header>
${sections}
<footer>Prepared by Eduvanta University Intelligence · Information sourced from official university pages · ${esc(date)}</footer>
</body></html>`;
}

/**
 * Renders the selected research topics into an isolated print document and
 * opens the browser print preview. No application UI is included.
 */
export function printResearch(research: PrintResearch, selectedSections: PrintTopic[]) {
  const topics = PRINT_TOPICS.map((t) => t.id).filter((id) => selectedSections.includes(id));
  if (topics.length === 0) return;

  const html = reportHtml(research, topics);
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  const run = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 1000);
  };
  if (doc.readyState === "complete") setTimeout(run, 60);
  else iframe.onload = () => setTimeout(run, 60);
}
