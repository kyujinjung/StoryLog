"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CoverFieldsProps = {
  idPrefix?: string;
  defaultUrl?: string | null;
  showPreview?: boolean;
};

export function CoverFields({
  idPrefix = "cover",
  defaultUrl = "",
  showPreview = true
}: CoverFieldsProps) {
  const [previewUrl, setPreviewUrl] = useState(defaultUrl ?? "");
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const display = filePreview || previewUrl;

  return (
    <div className="grid gap-4 sm:grid-cols-[140px_1fr] sm:items-start">
      {showPreview ? (
        <div className="relative aspect-[2/3] w-full max-w-[140px] overflow-hidden rounded-xl border border-white/10 bg-muted">
          {display ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={display}
              alt="대표 이미지 미리보기"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-xs text-muted-foreground">
              <ImagePlus className="h-6 w-6 text-primary" aria-hidden="true" />
              포스터 미리보기
            </div>
          )}
        </div>
      ) : null}

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-file`}>대표 이미지 파일</Label>
          <Input
            id={`${idPrefix}-file`}
            name="cover_file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                setFilePreview(null);
                return;
              }
              setFilePreview(URL.createObjectURL(file));
            }}
          />
          <p className="text-xs text-muted-foreground">
            JPG/PNG/WEBP/GIF · 최대 5MB · CGV 포스터처럼 세로 이미지가 잘 맞습니다.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-url`}>또는 이미지 URL</Label>
          <Input
            id={`${idPrefix}-url`}
            name="cover_image_url"
            type="url"
            placeholder="https://..."
            defaultValue={defaultUrl ?? ""}
            onChange={(event) => {
              setPreviewUrl(event.target.value.trim());
              if (event.target.value.trim()) {
                setFilePreview(null);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
