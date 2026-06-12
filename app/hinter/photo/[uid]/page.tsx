"use client";
import { use } from "react";
import EditPanel from "@/app/hinter/photo/edit";
import { usePhoto } from "@/app/hooks/usePhoto";
import { useQueryClient } from "@tanstack/react-query";

export default function PhotoEditPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const queryClient = useQueryClient();
  const { uid } = use(params);
  const { photo } = usePhoto(uid);

  return (
    <EditPanel
      photo={photo}
      onFinish={() => queryClient.invalidateQueries({ queryKey: ["photoLists"] })}
    />
  );
}
