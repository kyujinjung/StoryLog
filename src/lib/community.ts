export function normalizeWorkTitleKey(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[“”"']/g, "");
}

export const COMMUNITY_CATEGORIES = [
  { value: "question", label: "질문" },
  { value: "theory", label: "이론/추측" },
  { value: "discussion", label: "토론" },
  { value: "character", label: "인물" },
  { value: "spoiler", label: "스포 주의" }
] as const;

export function communityCategoryLabel(value: string) {
  return (
    COMMUNITY_CATEGORIES.find((item) => item.value === value)?.label ?? value
  );
}
