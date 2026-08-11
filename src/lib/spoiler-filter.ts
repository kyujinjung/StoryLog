import type {
  Character,
  CharacterState,
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

export function getProgressRevealOrder(progress: UserProgress | null) {
  return progress?.reveal_order ?? 0;
}

export function isRevealed<T extends { reveal_order: number }>(
  entity: T,
  progress: UserProgress | null
) {
  return entity.reveal_order <= getProgressRevealOrder(progress);
}

export function filterRevealed<T extends { reveal_order: number }>(
  entities: T[],
  progress: UserProgress | null
) {
  const revealOrder = getProgressRevealOrder(progress);

  return entities.filter((entity) => entity.reveal_order <= revealOrder);
}
