"use client";
import { use, useEffect, useState } from "react";
import EditPanel from "@/app/hinter/photo/edit";
import { getPhotoByUid } from "@/app/api";
import { Photo } from "@/app/typings";

export default function PhotoEditModal({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = use(params);
  const [photo, setPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    getPhotoByUid(uid)
      .then(setPhoto)
      .catch((error) => {
        console.error("Error fetching photo:", error);
      });
  }, [uid]);

  return <EditPanel photo={photo} />;
}
