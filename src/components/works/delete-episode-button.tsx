import { Trash2 } from "lucide-react";

import { deleteEpisode } from "@/app/works/actions";
import { Button } from "@/components/ui/button";

type DeleteEpisodeButtonProps = {
  workId: string;
  episodeId: string;
};

export function DeleteEpisodeButton({
  workId,
  episodeId
}: DeleteEpisodeButtonProps) {
  return (
    <form action={deleteEpisode}>
      <input type="hidden" name="work_id" value={workId} />
      <input type="hidden" name="episode_id" value={episodeId} />
      <Button type="submit" variant="ghost" size="icon" aria-label="회차 삭제">
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
