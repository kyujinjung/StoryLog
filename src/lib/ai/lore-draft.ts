import { createXaiClient, getXaiModel } from "@/lib/ai/xai";

export type CharacterDraft = {
  name: string;
  role?: string | null;
  aliases?: string[];
  description?: string | null;
};

export type EventDraft = {
  title: string;
  summary: string;
  event_type?: string | null;
  importance?: number | null;
};

export type TermDraft = {
  term: string;
  definition: string;
  category?: string | null;
};

export type NoteDraft = {
  title?: string | null;
  body: string;
  note_type?: "fact" | "theory" | "question" | "todo";
};

export type RelationshipDraft = {
  source_name: string;
  target_name: string;
  relationship_type: string;
  label?: string | null;
  description?: string | null;
};

export type LoreDraft = {
  characters: CharacterDraft[];
  events: EventDraft[];
  terms: TermDraft[];
  notes: NoteDraft[];
  relationships: RelationshipDraft[];
};

export type LoreDraftContext = {
  workTitle: string;
  workMedium?: string | null;
  episodeLabel: string;
  episodeTitle?: string | null;
  existingCharacterNames?: string[];
  memo: string;
};

const EMPTY_DRAFT: LoreDraft = {
  characters: [],
  events: [],
  terms: [],
  notes: [],
  relationships: []
};

function stripCodeFence(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  return fenced ? fenced[1].trim() : trimmed;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asString(item))
    .filter(Boolean);
}

function asImportance(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(number)) {
    return 3;
  }

  return Math.min(5, Math.max(1, Math.round(number)));
}

function asNoteType(value: unknown): NoteDraft["note_type"] {
  const text = asString(value);

  if (text === "theory" || text === "question" || text === "todo" || text === "fact") {
    return text;
  }

  return "fact";
}

export function normalizeLoreDraft(raw: unknown): LoreDraft {
  if (!raw || typeof raw !== "object") {
    return EMPTY_DRAFT;
  }

  const data = raw as Record<string, unknown>;

  const characters = Array.isArray(data.characters)
    ? data.characters
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const row = item as Record<string, unknown>;
          const name = asString(row.name);

          if (!name) {
            return null;
          }

          return {
            name,
            role: asString(row.role) || null,
            aliases: asStringArray(row.aliases),
            description: asString(row.description) || null
          } satisfies CharacterDraft;
        })
        .filter(Boolean) as CharacterDraft[]
    : [];

  const events = Array.isArray(data.events)
    ? data.events
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const row = item as Record<string, unknown>;
          const title = asString(row.title);
          const summary = asString(row.summary);

          if (!title || !summary) {
            return null;
          }

          return {
            title,
            summary,
            event_type: asString(row.event_type) || null,
            importance: asImportance(row.importance)
          } satisfies EventDraft;
        })
        .filter(Boolean) as EventDraft[]
    : [];

  const terms = Array.isArray(data.terms)
    ? data.terms
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const row = item as Record<string, unknown>;
          const term = asString(row.term);
          const definition = asString(row.definition);

          if (!term || !definition) {
            return null;
          }

          return {
            term,
            definition,
            category: asString(row.category) || null
          } satisfies TermDraft;
        })
        .filter(Boolean) as TermDraft[]
    : [];

  const notes = Array.isArray(data.notes)
    ? data.notes
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const row = item as Record<string, unknown>;
          const body = asString(row.body);

          if (!body) {
            return null;
          }

          return {
            title: asString(row.title) || null,
            body,
            note_type: asNoteType(row.note_type)
          } satisfies NoteDraft;
        })
        .filter(Boolean) as NoteDraft[]
    : [];

  const relationships = Array.isArray(data.relationships)
    ? data.relationships
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const row = item as Record<string, unknown>;
          const source_name = asString(row.source_name);
          const target_name = asString(row.target_name);
          const relationship_type = asString(row.relationship_type);

          if (!source_name || !target_name || !relationship_type) {
            return null;
          }

          if (source_name === target_name) {
            return null;
          }

          return {
            source_name,
            target_name,
            relationship_type,
            label: asString(row.label) || null,
            description: asString(row.description) || null
          } satisfies RelationshipDraft;
        })
        .filter(Boolean) as RelationshipDraft[]
    : [];

  return { characters, events, terms, notes, relationships };
}

export async function extractLoreDraft(
  context: LoreDraftContext
): Promise<LoreDraft> {
  const memo = context.memo.trim();

  if (memo.length < 8) {
    throw new Error("메모가 너무 짧습니다. 회차 줄거리나 감상을 조금 더 적어 주세요.");
  }

  if (memo.length > 12_000) {
    throw new Error("메모가 너무 깁니다. 12,000자 이하로 나눠 주세요.");
  }

  const client = createXaiClient();
  const existing =
    context.existingCharacterNames && context.existingCharacterNames.length > 0
      ? context.existingCharacterNames.join(", ")
      : "(없음)";

  const system = `You are StoryLog's lore extraction assistant for long-form stories (books, dramas, webtoons, movies).
Extract structured draft candidates from the user's episode notes.

Rules:
- Output ONLY valid JSON. No markdown, no commentary.
- Language of extracted text must match the user's memo language (usually Korean).
- Do NOT invent major plot facts that are not supported by the memo. Prefer fewer high-confidence items.
- This is a DRAFT for human approval, not auto-save.
- Avoid copying long copyrighted dialogue; paraphrase short facts only.
- If nothing is found for a category, use an empty array.
- importance for events is 1-5 integer.
- note_type must be one of: fact, theory, question, todo.
- relationships should only be included when both characters are named in the memo or existing list.

JSON schema:
{
  "characters": [{"name":"","role":"","aliases":[],"description":""}],
  "events": [{"title":"","summary":"","event_type":"","importance":3}],
  "terms": [{"term":"","definition":"","category":""}],
  "notes": [{"title":"","body":"","note_type":"fact"}],
  "relationships": [{"source_name":"","target_name":"","relationship_type":"","label":"","description":""}]
}`;

  const user = `Work: ${context.workTitle}
Medium: ${context.workMedium || "unknown"}
Episode: ${context.episodeLabel}${context.episodeTitle ? ` — ${context.episodeTitle}` : ""}
Known characters already in the work: ${existing}

Episode memo:
"""
${memo}
"""

Return JSON only.`;

  const completion = await client.chat.completions.create({
    model: getXaiModel(),
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    response_format: { type: "json_object" }
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("AI 응답이 비어 있습니다.");
  }

  try {
    const parsed = JSON.parse(stripCodeFence(content)) as unknown;
    return normalizeLoreDraft(parsed);
  } catch {
    throw new Error("AI 응답 JSON을 해석하지 못했습니다. 다시 시도해 주세요.");
  }
}

export function countDraftItems(draft: LoreDraft) {
  return (
    draft.characters.length +
    draft.events.length +
    draft.terms.length +
    draft.notes.length +
    draft.relationships.length
  );
}
