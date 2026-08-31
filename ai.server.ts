const MODEL = process.env["GEMINI_MODEL"] || "gemini-2.5-flash-lite";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function geminiKey() {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) throw new Error("AI extraction is not configured. Add GEMINI_API_KEY to the server environment.");
  return key;
}

async function generate(body: Record<string, unknown>, timeoutMs = 60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey() },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(`Gemini failed [${res.status}]: ${text}`);
      if (res.status === 429) throw new Error("Gemini free-tier rate limit reached. Please retry in a moment.");
      throw new Error(`Gemini request failed [${res.status}]`);
    }
    return JSON.parse(text) as any;
  } finally {
    clearTimeout(timer);
  }
}

function responseText(json: any): string {
  return (json.candidates?.[0]?.content?.parts ?? [])
    .map((p: any) => typeof p.text === "string" ? p.text : "")
    .join("")
    .trim();
}

export async function extractJson<T>(system: string, user: string, schema: object): Promise<T> {
  const json = await generate({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: schema,
      temperature: 0.1,
    },
  });

  const text = responseText(json);
  if (!text) throw new Error("Gemini returned no structured result.");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Gemini returned invalid JSON.");
  }
}

/** Uses Google's free Search grounding to identify an official website when the user supplies only a university name. */
export async function findOfficialUniversityUrl(query: string): Promise<string | null> {
  const json = await generate({
    contents: [{ role: "user", parts: [{ text: `Find the official university website for: ${query}. Return ONLY the canonical homepage URL of the university, with no explanation. Prefer the university's own domain, not Wikipedia, rankings, agents, social media, or study portals.` }] }],
    tools: [{ googleSearch: {} }],
    generationConfig: { temperature: 0 },
  });
  const text = responseText(json);
  const urls = [
    ...text.matchAll(/https?:\/\/[^\s<>"'`\]\)]+/g),
    ...((json.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []).flatMap((c: any) => c.web?.uri ? [c.web.uri] : [])),
  ].map((m: any) => typeof m === "string" ? m : m[0])
    .map((u: string) => u.replace(/[.,;]+$/, ""));

  const blocked = /wikipedia|facebook|linkedin|reddit|youtube|topuniversities|studyportals|timeshighereducation|shiksha|hotcourses|idp|edarabia/i;
  for (const raw of urls) {
    try {
      const u = new URL(raw);
      if (u.protocol.startsWith("http") && !blocked.test(u.hostname)) return `${u.protocol}//${u.hostname}`;
    } catch { /* ignore */ }
  }
  return null;
}
