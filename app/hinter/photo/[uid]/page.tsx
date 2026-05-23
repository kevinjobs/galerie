"use client";
import { use, useEffect, useState } from "react";
import EditPanel from "@/app/hinter/photo/edit";
import { getPhotoByUid } from "@/app/api";
import { Photo } from "@/app/typings";

export default function PhotoEditPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = use(params);
  const [photo, setPhoto] = useState<Photo | null>(null);

  const isNew = uid === "new";

  useEffect(() => {
    if (isNew) return;
    getPhotoByUid(uid)
      .then(setPhoto)
      .catch((error) => {
        console.error("Error fetching photo:", error);
      });
  }, [uid, isNew]);

  return <EditPanel photo={photo} />;
}