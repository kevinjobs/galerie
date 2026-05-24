"use client";
import { use } from "react";
import { genSrc } from "../../api";
import { usePhoto } from "../../hooks/usePhoto";

export default function GalleryPreview({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = use(params);
  const { photo, loading, error } = usePhoto(uid);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-background">
        <div className="text-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen py-2">
      {photo && (
        <img
          src={genSrc(photo.src)}
          alt={photo.title || "Gallery Preview"}
          loading="eager"
          className="object-contain w-full h-full"
        />
      )}
    </div>
  );
}
