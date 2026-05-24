"use client";
import { use } from "react";
import EditPanel from "@/app/hinter/photo/edit";
import { usePhoto } from "@/app/hooks/usePhoto";

export default function PhotoEditPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = use(params);
  const { photo } = usePhoto(uid);

  return <EditPanel photo={photo} />;
}
