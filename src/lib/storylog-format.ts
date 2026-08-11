import type { Episode } from "@/types/database";

export function formatEpisodeLabel(episode: Episode) {
  const parts = [
    episode.season_label,
    episode.episode_label || episode.episode_number?.toString(),
    episode.title
  ].filter(Boolean);

  return parts.join(" · ");
}
