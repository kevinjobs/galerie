"use client";
import { useState, useEffect, use } from "react";
import { getPhotoByUid } from "../../api";
import { Photo } from "../../typings";
import { genSrc } from "../../api";

export default function GalleryPriview({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = use(params);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uid && typeof uid === "string") {
      setLoading(true);
      getPhotoByUid(uid)
        .then(setPhoto)
        .catch((err) => setError(err.message || "加载照片失败"))
        .finally(() => setLoading(false));
    }
  }, [uid]);

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
