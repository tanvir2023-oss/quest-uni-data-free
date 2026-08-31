export const COUNTRIES = [
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Germany",
  "Ireland",
  "Netherlands",
  "Sweden",
  "Finland",
  "Denmark",
  "Italy",
  "France",
  "Spain",
  "Poland",
  "Hungary",
  "Malaysia",
  "Japan",
  "South Korea",
  "China",
  "New Zealand",
  "United Arab Emirates",
  "Other",
] as const;

export const NATIONALITIES = [
  "Bangladesh",
  "India",
  "Nepal",
  "Pakistan",
  "Sri Lanka",
  "Nigeria",
  "Ghana",
  "Kenya",
  "China",
  "Vietnam",
  "Other",
] as const;

export const STUDY_LEVELS = [
  "Bachelor",
  "Master",
  "PhD",
  "Diploma",
  "Certificate",
  "Foundation",
  "Pathway",
  "Other",
] as const;

export const PROGRAMME_LEVELS = STUDY_LEVELS;

export type Confidence = "confirmed" | "needs_verification" | "not_found" | "may_have_changed";

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  confirmed: "Confirmed",
  needs_verification: "Needs verification",
  not_found: "Not found on official source",
  may_have_changed: "May have changed",
};

export const CONFIDENCE_CLASS: Record<Confidence, string> = {
  confirmed: "bg-success/15 text-success border-success/30",
  needs_verification: "bg-warning/15 text-warning border-warning/30",
  not_found: "bg-muted text-muted-foreground border-border",
  may_have_changed: "bg-info/15 text-info border-info/30",
};

export type SectionKey =
  | "profile"
  | "faculties"
  | "programmes"
  | "academic_requirements"
  | "country_requirements"
  | "english_requirements"
  | "fees_payment"
  | "documents"
  | "scholarships"
  | "intakes";

export const SECTIONS: { key: SectionKey; title: string; blurb: string }[] = [
  { key: "profile", title: "University profile", blurb: "Official identity, contacts and institutional facts" },
  { key: "faculties", title: "Faculties & schools", blurb: "Academic structure, departments and divisions" },
  { key: "programmes", title: "Programmes", blurb: "Programme database for international applicants" },
  {
    key: "academic_requirements",
    title: "Academic requirements",
    blurb: "International entry requirements, exactly as published",
  },
  {
    key: "country_requirements",
    title: "Country-specific requirements",
    blurb: "Requirements published for the student's nationality",
  },
  { key: "english_requirements", title: "English language requirements", blurb: "Accepted tests and minimum scores" },
  { key: "fees_payment", title: "Fees, payment & installments", blurb: "Tuition, deposits and payment procedures" },
  { key: "documents", title: "Document checklist", blurb: "Documents the university requires from applicants" },
  { key: "scholarships", title: "Scholarships & funding", blurb: "Officially published scholarships" },
  { key: "intakes", title: "Intakes & deadlines", blurb: "Intake terms, start dates and application deadlines" },
];

export const EXTRACTABLE_SECTIONS: SectionKey[] = SECTIONS.map((s) => s.key);

export const PAGE_CATEGORIES = [
  "admissions",
  "international",
  "english",
  "fees",
  "programmes",
  "faculties",
  "scholarships",
  "documents",
  "intakes",
  "general",
] as const;
