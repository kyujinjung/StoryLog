export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Work = {
  id: string;
  user_id: string;
  title: string;
  medium: string | null;
  genre: string | null;
  description: string | null;
  cover_image_url: string | null;
  status: "watching" | "paused" | "completed" | "planned";
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type Episode = {
  id: string;
  user_id: string;
  work_id: string;
  season_label: string | null;
  episode_label: string;
  episode_number: number | null;
  reveal_order: number;
  title: string | null;
  summary: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserProgress = {
  id: string;
  user_id: string;
  work_id: string;
  episode_id: string | null;
  reveal_order: number;
  updated_at: string;
};

export type LoreVisibility = {
  work_id: string;
  reveal_episode_id: string | null;
  reveal_order: number;
};

export type Character = LoreVisibility & {
  id: string;
  user_id: string;
  faction_id: string | null;
  name: string;
  aliases: string[];
  role: string | null;
  description: string | null;
  first_appearance_episode_id: string | null;
  image_url: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type CharacterState = LoreVisibility & {
  id: string;
  user_id: string;
  character_id: string;
  status: string | null;
  affiliation: string | null;
  location: string | null;
  summary: string;
  created_at: string;
  updated_at: string;
};

export type Faction = LoreVisibility & {
  id: string;
  user_id: string;
  name: string;
  kind: string | null;
  goals: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Relationship = LoreVisibility & {
  id: string;
  user_id: string;
  source_character_id: string;
  target_character_id: string;
  relationship_type: string;
  label: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type RelationshipChange = LoreVisibility & {
  id: string;
  user_id: string;
  relationship_id: string;
  change_type: string;
  summary: string;
  created_at: string;
  updated_at: string;
};

export type Event = LoreVisibility & {
  id: string;
  user_id: string;
  title: string;
  event_type: string | null;
  summary: string;
  importance: number;
  created_at: string;
  updated_at: string;
};

export type Term = LoreVisibility & {
  id: string;
  user_id: string;
  term: string;
  category: string | null;
  definition: string;
  created_at: string;
  updated_at: string;
};

export type Foreshadow = LoreVisibility & {
  id: string;
  user_id: string;
  title: string;
  clue: string;
  theory: string | null;
  resolved_episode_id: string | null;
  resolved_summary: string | null;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
  updated_at: string;
};

export type Note = LoreVisibility & {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  note_type: "fact" | "theory" | "question" | "todo";
  created_at: string;
  updated_at: string;
};

export type CommunityPostCategory =
  | "question"
  | "theory"
  | "discussion"
  | "character"
  | "spoiler";

export type CommunitySpace = {
  id: string;
  title: string;
  title_key: string;
  medium: string | null;
  created_at: string;
  updated_at: string;
};

export type CommunityPost = {
  id: string;
  space_id: string;
  author_id: string;
  category: CommunityPostCategory;
  title: string;
  body: string;
  spoiler_reveal_order: number;
  spoiler_label: string | null;
  created_at: string;
  updated_at: string;
};

export type CommunityComment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  spoiler_reveal_order: number;
  created_at: string;
  updated_at: string;
};
