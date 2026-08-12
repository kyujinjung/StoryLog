import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import {
  filterRevealed,
  getProgressRevealOrder
} from "@/lib/spoiler-filter";
import type {
  Character,
  CharacterState,
  Episode,
  Event,
  Note,
  Relationship,
  RelationshipChange,
  Term,
  UserProgress,
  Work
} from "@/types/database";

export type AuthDataState =
  | { status: "ready"; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { status: "missing-env" }
  | { status: "signed-out" };

export type WorkSummary = Work & {
  progress: UserProgress | null;
  currentEpisode: Episode | null;
  episodeCount: number;
};

export type WorkDetail = Work & {
  episodes: Episode[];
  progress: UserProgress | null;
  currentEpisode: Episode | null;
  currentRevealOrder: number;
  lore: VisibleLore;
};

export type ReviewData = WorkDetail & {
  currentRevealOrder: number;
  safeEpisodes: Episode[];
  recentEpisodes: Episode[];
  matches: VisibleLore;
  query: string;
};

export type VisibleLore = {
  characters: Character[];
  characterStates: CharacterState[];
  events: Event[];
  terms: Term[];
  notes: Note[];
  relationships: Relationship[];
  relationshipChanges: RelationshipChange[];
};

export type GraphData = WorkDetail & {
  currentRevealOrder: number;
  graphCharacters: Character[];
  graphRelationships: Relationship[];
};

export async function getAuthDataState(): Promise<AuthDataState> {
  if (!hasSupabaseEnv()) {
    return { status: "missing-env" };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "signed-out" };
  }

  return { status: "ready", supabase, userId: user.id };
}

export async function listWorks(): Promise<WorkSummary[]> {
  const state = await getAuthDataState();

  if (state.status !== "ready") {
    return [];
  }

  const { supabase, userId } = state;
  const { data: works, error } = await supabase
    .from("works")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const workRows = (works ?? []) as Work[];

  if (workRows.length === 0) {
    return [];
  }

  const workIds = workRows.map((work) => work.id);
  const [{ data: progressRows }, { data: episodeRows }] = await Promise.all([
    supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .in("work_id", workIds),
    supabase
      .from("episodes")
      .select("*")
      .eq("user_id", userId)
      .in("work_id", workIds)
      .order("reveal_order", { ascending: true })
  ]);

  const progressByWork = new Map(
    ((progressRows ?? []) as UserProgress[]).map((progress) => [
      progress.work_id,
      progress
    ])
  );
  const episodesByWork = new Map<string, Episode[]>();

  for (const episode of (episodeRows ?? []) as Episode[]) {
    const episodes = episodesByWork.get(episode.work_id) ?? [];
    episodes.push(episode);
    episodesByWork.set(episode.work_id, episodes);
  }

  return workRows.map((work) => {
    const progress = progressByWork.get(work.id) ?? null;
    const episodes = episodesByWork.get(work.id) ?? [];
    const currentEpisode =
      episodes.find((episode) => episode.id === progress?.episode_id) ?? null;

    return {
      ...work,
      progress,
      currentEpisode,
      episodeCount: episodes.length
    };
  });
}

export async function getWorkDetail(workId: string): Promise<WorkDetail | null> {
  const state = await getAuthDataState();

  if (state.status !== "ready") {
    return null;
  }

  const { supabase, userId } = state;
  const { data: work, error } = await supabase
    .from("works")
    .select("*")
    .eq("id", workId)
    .eq("user_id", userId)
    .single();

  if (error) {
    return null;
  }

  const [{ data: episodes }, { data: progress }] = await Promise.all([
    supabase
      .from("episodes")
      .select("*")
      .eq("work_id", workId)
      .eq("user_id", userId)
      .order("reveal_order", { ascending: true }),
    supabase
      .from("user_progress")
      .select("*")
      .eq("work_id", workId)
      .eq("user_id", userId)
      .maybeSingle()
  ]);

  const episodeRows = (episodes ?? []) as Episode[];
  const progressRow = (progress as UserProgress | null) ?? null;
  const lore = await getVisibleLoreForWork(workId, progressRow, episodeRows);

  return {
    ...(work as Work),
    episodes: episodeRows,
    progress: progressRow,
    currentEpisode:
      episodeRows.find((episode) => episode.id === progressRow?.episode_id) ??
      null,
    currentRevealOrder: getProgressRevealOrder(progressRow, episodeRows),
    lore
  };
}

export async function getVisibleLoreForWork(
  workId: string,
  progress: UserProgress | null,
  episodes: Episode[] = []
): Promise<VisibleLore> {
  const state = await getAuthDataState();

  if (state.status !== "ready") {
    return {
      characters: [],
      characterStates: [],
      events: [],
      terms: [],
      notes: [],
      relationships: [],
      relationshipChanges: []
    };
  }

  const { supabase, userId } = state;

  // Load full personal lore, then filter by the linked episode's reveal_order.
  // This avoids stale denormalized character.reveal_order leaking future spoiler.
  const [
    { data: characters },
    { data: characterStates },
    { data: events },
    { data: terms },
    { data: notes },
    { data: relationships },
    { data: relationshipChanges }
  ] = await Promise.all([
    supabase
      .from("characters")
      .select("*")
      .eq("work_id", workId)
      .eq("user_id", userId)
      .order("name", { ascending: true }),
    supabase
      .from("character_states")
      .select("*")
      .eq("work_id", workId)
      .eq("user_id", userId)
      .order("reveal_order", { ascending: true }),
    supabase
      .from("events")
      .select("*")
      .eq("work_id", workId)
      .eq("user_id", userId)
      .order("reveal_order", { ascending: true }),
    supabase
      .from("terms")
      .select("*")
      .eq("work_id", workId)
      .eq("user_id", userId)
      .order("term", { ascending: true }),
    supabase
      .from("notes")
      .select("*")
      .eq("work_id", workId)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("relationships")
      .select("*")
      .eq("work_id", workId)
      .eq("user_id", userId)
      .order("reveal_order", { ascending: true }),
    supabase
      .from("relationship_changes")
      .select("*")
      .eq("work_id", workId)
      .eq("user_id", userId)
      .order("reveal_order", { ascending: true })
  ]);

  return {
    characters: filterRevealed((characters ?? []) as Character[], progress, episodes),
    characterStates: filterRevealed(
      (characterStates ?? []) as CharacterState[],
      progress,
      episodes
    ),
    events: filterRevealed((events ?? []) as Event[], progress, episodes),
    terms: filterRevealed((terms ?? []) as Term[], progress, episodes),
    notes: filterRevealed((notes ?? []) as Note[], progress, episodes),
    relationships: filterRevealed(
      (relationships ?? []) as Relationship[],
      progress,
      episodes
    ),
    relationshipChanges: filterRevealed(
      (relationshipChanges ?? []) as RelationshipChange[],
      progress,
      episodes
    )
  };
}

export function getNextRevealOrder(episodes: Episode[]) {
  const highestOrder = episodes.reduce(
    (highest, episode) => Math.max(highest, episode.reveal_order),
    0
  );

  return highestOrder + 1;
}

export async function getReviewData(
  workId: string,
  query = ""
): Promise<ReviewData | null> {
  const work = await getWorkDetail(workId);

  if (!work) {
    return null;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const currentRevealOrder = work.currentRevealOrder;
  const safeEpisodes = work.episodes.filter(
    (episode) => episode.reveal_order <= currentRevealOrder
  );
  const recentEpisodes = safeEpisodes.slice(-5).reverse();

  if (!normalizedQuery) {
    return {
      ...work,
      currentRevealOrder,
      safeEpisodes,
      recentEpisodes,
      matches: work.lore,
      query: ""
    };
  }

  const includesQuery = (values: Array<string | null | undefined>) =>
    values.some((value) => value?.toLowerCase().includes(normalizedQuery));

  return {
    ...work,
    currentRevealOrder,
    safeEpisodes: safeEpisodes.filter((episode) =>
      includesQuery([
        episode.season_label,
        episode.episode_label,
        episode.title,
        episode.summary
      ])
    ),
    recentEpisodes: recentEpisodes.filter((episode) =>
      includesQuery([
        episode.season_label,
        episode.episode_label,
        episode.title,
        episode.summary
      ])
    ),
    matches: {
      characters: work.lore.characters.filter((character) =>
        includesQuery([
          character.name,
          character.role,
          character.description,
          ...character.aliases
        ])
      ),
      characterStates: work.lore.characterStates.filter((characterState) =>
        includesQuery([
          characterState.status,
          characterState.affiliation,
          characterState.location,
          characterState.summary
        ])
      ),
      events: work.lore.events.filter((event) =>
        includesQuery([event.title, event.event_type, event.summary])
      ),
      terms: work.lore.terms.filter((term) =>
        includesQuery([term.term, term.category, term.definition])
      ),
      notes: work.lore.notes.filter((note) =>
        includesQuery([note.title, note.body, note.note_type])
      ),
      relationships: work.lore.relationships.filter((relationship) =>
        includesQuery([
          relationship.relationship_type,
          relationship.label,
          relationship.description
        ])
      ),
      relationshipChanges: work.lore.relationshipChanges.filter((change) =>
        includesQuery([change.change_type, change.summary])
      )
    },
    query: normalizedQuery
  };
}

export async function getRelationshipGraphData(
  workId: string
): Promise<GraphData | null> {
  const work = await getWorkDetail(workId);

  if (!work) {
    return null;
  }

  const visibleCharacterIds = new Set(
    work.lore.characters.map((character) => character.id)
  );
  const graphRelationships = work.lore.relationships.filter(
    (relationship) =>
      visibleCharacterIds.has(relationship.source_character_id) &&
      visibleCharacterIds.has(relationship.target_character_id)
  );

  return {
    ...work,
    currentRevealOrder: work.currentRevealOrder,
    graphCharacters: work.lore.characters,
    graphRelationships
  };
}
