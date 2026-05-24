"use client";
import { use } from "react";
import EditPanel from "@/app/hinter/photo/edit";
import { usePhoto } from "@/app/hooks/usePhoto";
import { Modal } from "@/app/components";
import { useRouter } from "next/navigation";

export default function PhotoEditModal({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const router = useRouter();

  const { uid } = use(params);
  const { photo } = usePhoto(uid);

  return (
    <Modal isOpen onChangeAction={() => router.back()} size="full">
      <EditPanel
        photo={photo}
        onFinish={() => router.back()}
      />
    </Modal>
  );
}
