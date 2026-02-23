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

  useEffect(() => {
    if (uid && typeof uid === "string") {
      getPhotoByUid(uid).then(setPhoto);
    }
  }, [uid]);

  return (
    <div className="w-screen h-screen py-2">
      {photo && (
        <img
          src={genSrc(photo.src)}
          alt="Gallery Preview"
          loading="eager"
          className="object-contain w-full h-full"
        />
      )}
    </div>
  );
}
