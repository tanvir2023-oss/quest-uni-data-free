import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runDiscovery, scrapeNextPage, scrapePendingBatch, extractSection } from "./research.server";
import { EXTRACTABLE_SECTIONS, type SectionKey } from "./research-constants";

export const discoverSources = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ researchId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    return runDiscovery(context.supabase as never, context.userId, data.researchId);
  });

export const scrapeNext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ researchId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    return scrapeNextPage(context.supabase as never, data.researchId);
  });

export const scrapeBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ researchId: z.string().uuid(), size: z.number().int().min(1).max(10).optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    return scrapePendingBatch(context.supabase as never, data.researchId, data.size ?? 6);
  });

export const runSectionExtraction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        researchId: z.string().uuid(),
        section: z.enum(EXTRACTABLE_SECTIONS as [SectionKey, ...SectionKey[]]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    return extractSection(context.supabase as never, context.userId, data.researchId, data.section);
  });
