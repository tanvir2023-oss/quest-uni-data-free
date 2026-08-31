import type { SupabaseClient } from "@supabase/supabase-js";
import { freecrawlMap, freecrawlScrape } from "./freecrawl.server";
import { findOfficialUniversityUrl } from "./ai.server";
import { extractJson } from "./ai.server";
import type { SectionKey } from "./research-constants";

type DB = SupabaseClient<any, "public", any>;

const CATEGORY_HINTS: { category: string; words: string[] }[] = [
  { category: "english", words: ["english", "ielts", "toefl", "language-requirement", "language_requirements"] },
  { category: "documents", words: ["document", "checklist", "how-to-apply", "how_to_apply", "application-process"] },
  { category: "fees", words: ["fee", "tuition", "cost", "payment", "finance", "installment", "instalment"] },
  { category: "scholarships", words: ["scholarship", "bursar", "funding", "award"] },
  { category: "intakes", words: ["intake", "deadline", "key-dates", "term-dates", "calendar", "start-dates"] },
  { category: "international", words: ["international", "overseas", "country", "entry-requirements-by-country"] },
  { category: "admissions", words: ["admission", "apply", "entry-requirement", "requirements", "eligibility"] },
  { category: "programmes", words: ["programme", "program", "course", "study", "degree", "subject", "postgraduate", "undergraduate"] },
  { category: "faculties", words: ["faculty", "faculties", "school", "college", "department", "academic-structure"] },
];

const CATEGORY_PRIORITY: Record<string, number> = {
  international: 10,
  admissions: 9,
  english: 9,
  fees: 8,
  documents: 7,
  intakes: 6,
  programmes: 6,
  scholarships: 5,
  faculties: 5,
  general: 1,
};

function categorize(url: string): string {
  const lower = url.toLowerCase();
  for (const hint of CATEGORY_HINTS) {
    if (hint.words.some((w) => lower.includes(w))) return hint.category;
  }
  return "general";
}

function normalizeDomain(input: string): string {
  const withProtocol = input.startsWith("http") ? input : `https://${input}`;
  const u = new URL(withProtocol);
  return `${u.protocol}//${u.hostname}`;
}

export async function runDiscovery(
  supabase: DB,
  userId: string,
  researchId: string,
): Promise<{ domain: string; pages: number }> {
  const { data: project, error } = await supabase
    .from("research_projects")
    .select("*")
    .eq("id", researchId)
    .single();
  if (error || !project) throw new Error("Research project not found.");

  let domain: string | null = null;
  if (project.university_url) {
    try {
      domain = normalizeDomain(project.university_url);
    } catch {
      domain = null;
    }
  }

  if (!domain) {
    const candidate = await findOfficialUniversityUrl(
      `${project.university_name} ${project.country} official university website admissions`,
    );
    if (!candidate) throw new Error("Could not identify an official website. Please enter the university URL.");
    domain = normalizeDomain(candidate);
  }

  const queries = [
    `international students ${project.study_level} admission requirements`,
    "english language requirements ielts toefl",
    "tuition fees payment deposit installment",
    `${project.subject || "programmes"} ${project.study_level} courses`,
    "faculties schools departments",
    "scholarships for international students",
    "application documents required deadlines intake",
    `entry requirements ${project.student_nationality}`,
  ];

  const mapped = await Promise.allSettled(queries.map((q) => freecrawlMap(domain!, q, 30)));
  const urls = new Set<string>([domain]);
  for (const result of mapped) {
    if (result.status === "fulfilled") {
      for (const u of result.value) {
        try {
          const parsed = new URL(u);
          if (!parsed.hostname.includes(new URL(domain!).hostname.replace(/^www\./, ""))) continue;
          if (/\.(jpg|jpeg|png|gif|svg|zip|mp4|css|js)$/i.test(parsed.pathname)) continue;
          urls.add(parsed.toString().split("#")[0] ?? parsed.toString());
        } catch {
          /* ignore */
        }
      }
    }
  }

  const ranked = [...urls]
    .map((url) => ({ url, category: categorize(url) }))
    .sort((a, b) => {
      const diff = (CATEGORY_PRIORITY[b.category] ?? 1) - (CATEGORY_PRIORITY[a.category] ?? 1);
      if (diff !== 0) return diff;
      return a.url.length - b.url.length;
    });

  const perCategory: Record<string, number> = {};
  const selected: { url: string; category: string }[] = [];
  for (const item of ranked) {
    const count = perCategory[item.category] ?? 0;
    if (count >= 4) continue;
    perCategory[item.category] = count + 1;
    selected.push(item);
    if (selected.length >= 18) break;
  }

  await supabase.from("source_pages").delete().eq("research_id", researchId);
  const { error: insertError } = await supabase.from("source_pages").insert(
    selected.map((s) => ({
      research_id: researchId,
      user_id: userId,
      url: s.url,
      category: s.category,
      is_official: true,
    })),
  );
  if (insertError) throw new Error(insertError.message);

  await supabase
    .from("research_projects")
    .update({ official_domain: domain, status: "discovered", progress_note: `${selected.length} official pages queued` })
    .eq("id", researchId);

  return { domain, pages: selected.length };
}

/**
 * Scrapes up to `size` pending pages concurrently. Failures are isolated so a
 * single bad URL never stops the job; the page is marked as attempted instead.
 */
export async function scrapePendingBatch(
  supabase: DB,
  researchId: string,
  size = 6,
): Promise<{ scraped: number; remaining: number }> {
  const { data: pending } = await supabase
    .from("source_pages")
    .select("id,url")
    .eq("research_id", researchId)
    .is("content", null)
    .limit(size);

  const pages = pending ?? [];
  if (pages.length === 0) {
    await supabase.from("research_projects").update({ status: "scraped" }).eq("id", researchId);
    return { scraped: 0, remaining: 0 };
  }

  const seen = new Set<string>();
  const unique = pages.filter((p) => (seen.has(p.url) ? false : (seen.add(p.url), true)));

  await Promise.allSettled(
    unique.map(async (page) => {
      try {
        const result = await freecrawlScrape(page.url);
        await supabase
          .from("source_pages")
          .update({
            content: (result.markdown || "No readable content").slice(0, 16000),
            title: result.title.slice(0, 300),
            fetched_at: new Date().toISOString(),
          })
          .eq("id", page.id);
      } catch (e) {
        console.error("scrape failed", page.url, e);
        await supabase.from("source_pages").update({ content: "", title: page.url }).eq("id", page.id);
      }
    }),
  );

  // duplicate URLs in the same batch reuse the first fetch instead of refetching
  for (const dup of pages.filter((p) => !unique.includes(p))) {
    await supabase.from("source_pages").update({ content: "", title: dup.url }).eq("id", dup.id);
  }

  const { count } = await supabase
    .from("source_pages")
    .select("id", { count: "exact", head: true })
    .eq("research_id", researchId)
    .is("content", null);

  const remaining = count ?? 0;
  if (remaining === 0) {
    await supabase.from("research_projects").update({ status: "scraped" }).eq("id", researchId);
  }
  return { scraped: pages.length, remaining };
}

export async function scrapeNextPage(
  supabase: DB,
  researchId: string,
): Promise<{ scraped: string | null; remaining: number }> {
  const { data: pending } = await supabase
    .from("source_pages")
    .select("id,url")
    .eq("research_id", researchId)
    .is("content", null)
    .limit(1);

  const page = pending?.[0];
  if (!page) {
    await supabase.from("research_projects").update({ status: "scraped" }).eq("id", researchId);
    return { scraped: null, remaining: 0 };
  }

  try {
    const result = await freecrawlScrape(page.url);
    await supabase
      .from("source_pages")
      .update({
        content: (result.markdown || "No readable content").slice(0, 16000),
        title: result.title.slice(0, 300),
        fetched_at: new Date().toISOString(),
      })
      .eq("id", page.id);
  } catch (e) {
    console.error("scrape failed", page.url, e);
    await supabase.from("source_pages").update({ content: "", title: page.url }).eq("id", page.id);
  }

  const { count } = await supabase
    .from("source_pages")
    .select("id", { count: "exact", head: true })
    .eq("research_id", researchId)
    .is("content", null);

  return { scraped: page.url, remaining: count ?? 0 };
}

const SECTION_CATEGORIES: Record<SectionKey, string[]> = {
  profile: ["general", "international", "admissions"],
  faculties: ["faculties", "programmes", "general"],
  programmes: ["programmes", "faculties", "admissions"],
  academic_requirements: ["admissions", "international", "programmes"],
  country_requirements: ["international", "admissions"],
  english_requirements: ["english", "international", "admissions"],
  fees_payment: ["fees", "international", "admissions"],
  documents: ["documents", "admissions", "international"],
  scholarships: ["scholarships", "international", "fees"],
  intakes: ["intakes", "admissions", "programmes"],
};

const DATA_POINT_SCHEMA = {
  type: "object",
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          subsection: { type: "string" },
          label: { type: "string" },
          value: { type: "string" },
          detail: { type: "string" },
          source_url: { type: "string" },
          source_title: { type: "string" },
          status: { type: "string", enum: ["confirmed", "needs_verification", "not_found", "may_have_changed"] },
        },
        required: ["label", "value", "status"],
      },
    },
  },
  required: ["findings"],
};

const PROFILE_SCHEMA = {
  type: "object",
  properties: {
    fields: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          value: { type: "string" },
          source_url: { type: "string" },
          source_title: { type: "string" },
          status: { type: "string", enum: ["confirmed", "needs_verification", "not_found", "may_have_changed"] },
        },
        required: ["label", "value", "status"],
      },
    },
  },
  required: ["fields"],
};

const FACULTY_SCHEMA = {
  type: "object",
  properties: {
    faculties: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          kind: { type: "string" },
          departments: { type: "array", items: { type: "string" } },
          source_url: { type: "string" },
          source_title: { type: "string" },
          status: { type: "string", enum: ["confirmed", "needs_verification", "not_found", "may_have_changed"] },
        },
        required: ["name", "status"],
      },
    },
  },
  required: ["faculties"],
};

const PROGRAMME_FIELDS = [
  "name",
  "level",
  "faculty",
  "department",
  "campus",
  "study_mode",
  "duration",
  "credits",
  "language",
  "intakes",
  "application_deadline",
  "next_intake",
  "start_date",
  "tuition_fee",
  "application_fee",
  "deposit",
  "other_fees",
  "scholarships",
  "admission_requirements",
  "english_requirements",
  "required_documents",
  "programme_specific_requirements",
  "source_url",
  "source_title",
];

const PROGRAMME_SCHEMA = {
  type: "object",
  properties: {
    programmes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ...Object.fromEntries(PROGRAMME_FIELDS.map((f) => [f, { type: "string" }])),
          status: { type: "string", enum: ["confirmed", "needs_verification", "not_found", "may_have_changed"] },
        },
        required: ["name", "status"],
      },
    },
  },
  required: ["programmes"],
};

const SECTION_INSTRUCTIONS: Record<SectionKey, string> = {
  profile:
    "Extract the university profile: University name, Official name, Country, City, Campus/location, Official website, International student website, Admissions website, International admissions email, Phone, Address, University type, Public or private, Established year, Accreditation, Rankings, Total students, International students. One entry per label, using the labels exactly as listed.",
  faculties:
    "Extract the academic structure: faculties, schools, colleges and academic divisions, each with the departments listed under it on the official pages.",
  programmes:
    "Extract programmes open to international students. Include every programme explicitly listed. Leave a field out entirely if the pages do not state it.",
  academic_requirements:
    "Extract academic entry requirements for INTERNATIONAL students only (never domestic/home requirements). Cover minimum GPA/CGPA, percentage, grade, required qualification, previous degree, required subjects, mathematics, science, relevant background, work experience, age. Preserve the exact wording and grading scale; never convert grades. Use subsection to group.",
  country_requirements:
    "Extract requirements published specifically for applicants from the given student nationality (qualification equivalencies such as HSC/SSC/Diploma/Bachelor, minimum GPA or percentage, accepted education boards, credential evaluation, country-specific documents). If the official pages contain nothing specific to that nationality, return a single finding with status not_found.",
  english_requirements:
    "Extract English language requirements. One finding per accepted test (IELTS Academic, IELTS General, TOEFL iBT, PTE Academic, Duolingo, Cambridge English, LanguageCert, Oxford Test, others). Put the overall score in value and the component minimums, validity period and test type in detail. Add separate findings for waiver/exemption conditions. Never list a test the pages do not mention.",
  fees_payment:
    "Extract tuition fees for international students, application fee, deposit, other mandatory fees, payment methods, installment/payment plan procedures, refund rules and payment deadlines.",
  documents:
    "Extract the documents the university requires from applicants, grouped by subsection (Academic documents, Identity documents, English language, Financial documents, Additional documents). One finding per document.",
  scholarships:
    "Extract officially published scholarships, awards and funding for international students, with eligibility, amount and deadline in detail.",
  intakes:
    "Extract intake terms, semester start dates, application opening and closing deadlines, and any late-application rules.",
};

function buildCorpus(
  pages: { url: string; title: string | null; content: string | null; category: string | null }[],
  categories: string[],
): string {
  const relevant = pages
    .filter((p) => p.content && p.content.length > 200)
    .sort((a, b) => {
      const ai = categories.indexOf(a.category ?? "general");
      const bi = categories.indexOf(b.category ?? "general");
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  let total = 0;
  const parts: string[] = [];
  for (const page of relevant) {
    const chunk = `\n\n===== SOURCE PAGE =====\nURL: ${page.url}\nTITLE: ${page.title ?? ""}\n\n${(page.content ?? "").slice(0, 12000)}`;
    if (total + chunk.length > 110000) break;
    total += chunk.length;
    parts.push(chunk);
  }
  return parts.join("");
}

const BASE_SYSTEM = `You are a research extraction engine for an international education consultancy.
Absolute rules:
1. Only record information that is explicitly present in the supplied official page text.
2. NEVER invent, infer, generalise from other universities, or fill gaps with typical values.
3. Every finding must carry the exact source_url of the page it came from (copy it from the SOURCE PAGE header).
4. Use status "confirmed" only when the page states the fact unambiguously. Use "needs_verification" when the wording is partial, conditional or ambiguous. Use "may_have_changed" when the page indicates the information is provisional, indicative or subject to change. Use "not_found" when nothing relevant exists.
5. Never mix domestic/home-student requirements with international-student requirements.
6. Preserve original wording, grading scales, currencies and units. Do not convert anything.
7. If the pages contain nothing for this section, return a single finding with status "not_found" and value "Not found on the official source."`;

export async function extractSection(
  supabase: DB,
  userId: string,
  researchId: string,
  section: SectionKey,
): Promise<{ count: number }> {
  const { data: project } = await supabase.from("research_projects").select("*").eq("id", researchId).single();
  if (!project) throw new Error("Research project not found.");

  const { data: pages } = await supabase
    .from("source_pages")
    .select("url,title,content,category")
    .eq("research_id", researchId);

  const corpus = buildCorpus(pages ?? [], SECTION_CATEGORIES[section]);
  if (!corpus) throw new Error("No official page content available yet.");

  const context = `University: ${project.university_name}
Country: ${project.country}
Student nationality: ${project.student_nationality}
Study level: ${project.study_level}
Intended intake: ${project.intake ?? "not specified"}
Subject of interest: ${project.subject ?? "not specified"}

TASK: ${SECTION_INSTRUCTIONS[section]}

OFFICIAL PAGE TEXT:${corpus}`;

  const now = new Date().toISOString();

  if (section === "faculties") {
    const result = await extractJson<{ faculties: any[] }>(BASE_SYSTEM, context, FACULTY_SCHEMA);
    await supabase.from("faculties").delete().eq("research_id", researchId);
    const rows = (result.faculties ?? []).slice(0, 80).map((f) => ({
      research_id: researchId,
      user_id: userId,
      name: String(f.name).slice(0, 300),
      kind: f.kind ?? null,
      departments: Array.isArray(f.departments) ? f.departments.map(String).slice(0, 60) : [],
      source_url: f.source_url ?? null,
      source_title: f.source_title ?? null,
      status: f.status ?? "needs_verification",
    }));
    if (rows.length) {
      const { error } = await supabase.from("faculties").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { count: rows.length };
  }

  if (section === "programmes") {
    const result = await extractJson<{ programmes: any[] }>(BASE_SYSTEM, context, PROGRAMME_SCHEMA);
    await supabase.from("programmes").delete().eq("research_id", researchId);
    const rows = (result.programmes ?? []).slice(0, 150).map((p) => {
      const row: Record<string, unknown> = { research_id: researchId, user_id: userId };
      for (const field of PROGRAMME_FIELDS) {
        row[field] = p[field] ? String(p[field]).slice(0, 4000) : null;
      }
      row["name"] = String(p.name ?? "Untitled programme").slice(0, 300);
      row["status"] = p.status ?? "needs_verification";
      return row;
    });
    if (rows.length) {
      const { error } = await supabase.from("programmes").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { count: rows.length };
  }

  const schema = section === "profile" ? PROFILE_SCHEMA : DATA_POINT_SCHEMA;
  const result = await extractJson<{ findings?: any[]; fields?: any[] }>(BASE_SYSTEM, context, schema);
  const items = (section === "profile" ? result.fields : result.findings) ?? [];

  await supabase.from("data_points").delete().eq("research_id", researchId).eq("section", section);
  const rows = items.slice(0, 200).map((item, index) => ({
    research_id: researchId,
    user_id: userId,
    section,
    subsection: item.subsection ?? null,
    label: String(item.label ?? "Item").slice(0, 300),
    value: item.value ? String(item.value).slice(0, 4000) : "Not found on the official source.",
    detail: item.detail ? String(item.detail).slice(0, 4000) : null,
    source_url: item.source_url ?? null,
    source_title: item.source_title ?? null,
    status: item.status ?? "needs_verification",
    is_official: true,
    sort_order: index,
    checked_at: now,
  }));

  if (rows.length) {
    const { error } = await supabase.from("data_points").insert(rows);
    if (error) throw new Error(error.message);
  }

  if (section === "profile") {
    await supabase.from("university_profiles").upsert(
      {
        research_id: researchId,
        user_id: userId,
        data: { fields: rows.map((r) => ({ label: r.label, value: r.value, status: r.status })) },
      },
      { onConflict: "research_id" },
    );
  }

  return { count: rows.length };
}
