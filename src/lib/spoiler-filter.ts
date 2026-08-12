import type {
  Character,
  CharacterState,
  Episode,
  Event,
  Foreshadow,
  Note,
  Relationship,
  RelationshipChange,
  Term,
  UserProgress
} from "@/types/database";

export type RevealedLore =
  | Character
  | CharacterState
  | Event
  | Foreshadow
  | Note
  | Relationship
  | RelationshipChange
  | Term;

export type RevealTimed = {
  reveal_order: number;
  reveal_episode_id?: string | null;
};

/**
 * Effective progress ceiling for spoiler filtering.
 * - Not started / no progress: -1 (hide all normal lore with reveal_order >= 0)
 * - Prefer the linked episode's current reveal_order over a denormalized field
 */
export function getProgressRevealOrder(
  progress: UserProgress | null | undefined,
  episodes: Episode[] = []
) {
  if (!progress) {
    return -1;
  }

  if (progress.episode_id) {
    const currentEpisode = episodes.find(
      (episode) => episode.id === progress.episode_id
    );

    if (currentEpisode) {
      return currentEpisode.reveal_order;
    }
  }

  // "아직 시작 전" stores null episode_id and reveal_order 0 — treat as not started.
  if (!progress.episode_id) {
    return -1;
  }

  return progress.reveal_order ?? -1;
}

/** Resolve an entity's reveal order from its linked episode when possible. */
export function getEntityRevealOrder(
  entity: RevealTimed,
  episodes: Episode[] = []
) {
  if (entity.reveal_episode_id) {
    const episode = episodes.find(
      (item) => item.id === entity.reveal_episode_id
    );

    if (episode) {
      return episode.reveal_order;
    }
  }

  return entity.reveal_order;
}

export function isRevealed<T extends RevealTimed>(
  entity: T,
  progress: UserProgress | null | undefined,
  episodes: Episode[] = []
) {
  return (
    getEntityRevealOrder(entity, episodes) <=
    getProgressRevealOrder(progress, episodes)
  );
}

export function filterRevealed<T extends RevealTimed>(
  entities: T[],
  progress: UserProgress | null | undefined,
  episodes: Episode[] = []
) {
  const ceiling = getProgressRevealOrder(progress, episodes);

  return entities.filter(
    (entity) => getEntityRevealOrder(entity, episodes) <= ceiling
  );
}

export function countHidden<T extends RevealTimed>(
  entities: T[],
  progress: UserProgress | null | undefined,
  episodes: Episode[] = []
) {
  const ceiling = getProgressRevealOrder(progress, episodes);

  return entities.filter(
    (entity) => getEntityRevealOrder(entity, episodes) > ceiling
  ).length;
}
