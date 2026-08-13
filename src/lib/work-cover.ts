import type { AuthDataState } from "@/lib/data/storylog";

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
      return {
        url: null,
        error:
          uploadError.message.includes("Bucket not found") ||
          uploadError.message.includes("not found")
            ? "이미지 저장소(work-covers)가 없습니다. Phase 커버 마이그레이션을 적용해 주세요."
            : `이미지 업로드 실패: ${uploadError.message}`
      };
    }

    const { data } = state.supabase.storage
      .from("work-covers")
      .getPublicUrl(objectPath);

    return { url: data.publicUrl };
  }

  if (coverUrl) {
    if (!isValidHttpUrl(coverUrl)) {
      return { url: null, error: "대표 이미지 URL이 올바르지 않습니다." };
    }

    return { url: coverUrl };
  }

  return { url: null };
}
