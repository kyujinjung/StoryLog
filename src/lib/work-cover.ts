import type { AuthDataState } from "@/lib/data/storylog";
import type { Json, Work } from "@/types/database";

const MAX_COVER_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function extensionForMime(mime: string) {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

/** Read cover from column and/or metadata (migration-safe). */
export function getWorkCoverUrl(
  work: Pick<Work, "cover_image_url" | "metadata"> | {
    cover_image_url?: string | null;
    metadata?: Json;
  }
): string | null {
  if (typeof work.cover_image_url === "string" && work.cover_image_url.trim()) {
    return work.cover_image_url.trim();
  }

  const metadata = work.metadata;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const value = (metadata as Record<string, unknown>).cover_image_url;
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

export function withCoverMetadata(
  metadata: Json | null | undefined,
  coverUrl: string | null
): Record<string, unknown> {
  const base =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {};

  if (coverUrl) {
    base.cover_image_url = coverUrl;
  } else {
    delete base.cover_image_url;
  }

  return base;
}

export async function resolveCoverImageUrl(
  state: Extract<AuthDataState, { status: "ready" }>,
  formData: FormData,
  workIdHint?: string
): Promise<{ url: string | null; error?: string }> {
  const coverUrl = (() => {
    const value = formData.get("cover_image_url");
    return typeof value === "string" ? value.trim() : "";
  })();

  const fileValue = formData.get("cover_file");
  const file =
    fileValue instanceof File && fileValue.size > 0 ? fileValue : null;

  if (file) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return {
        url: null,
        error: "대표 이미지는 JPG, PNG, WEBP, GIF만 업로드할 수 있습니다."
      };
    }

    if (file.size > MAX_COVER_BYTES) {
      return { url: null, error: "대표 이미지는 5MB 이하여야 합니다." };
    }

    const ext = extensionForMime(file.type);
    const objectPath = `${state.userId}/${workIdHint ?? "new"}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await state.supabase.storage
      .from("work-covers")
      .upload(objectPath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      // Fall back: store as data URL in metadata when storage bucket is missing.
      // Cap at ~1.5MB raw so JSON stays reasonable.
      if (file.size <= 1.5 * 1024 * 1024) {
        const base64 = buffer.toString("base64");
        const dataUrl = `data:${file.type};base64,${base64}`;
        return { url: dataUrl };
      }

      return {
        url: null,
        error:
          uploadError.message.includes("Bucket not found") ||
          uploadError.message.toLowerCase().includes("not found")
            ? "이미지 저장소(work-covers)가 없습니다. 마이그레이션을 적용하거나 1.5MB 이하 이미지/URL을 사용해 주세요."
            : `이미지 업로드 실패: ${uploadError.message}`
      };
    }

    const { data } = state.supabase.storage
      .from("work-covers")
      .getPublicUrl(objectPath);

    return { url: data.publicUrl };
  }

  if (coverUrl) {
    if (!isValidHttpUrl(coverUrl) && !coverUrl.startsWith("data:image/")) {
      return { url: null, error: "대표 이미지 URL이 올바르지 않습니다." };
    }

    return { url: coverUrl };
  }

  return { url: null };
}
