"use client";
import { genSrc, getPhotoByUid } from "@/app/api";
import { Photo } from "@/app/typings";
import { Xmark } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import PhotoInfo from "./info";

export default function GalleryModal({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = use(params);

  const [photo, setPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    const fetchPhoto = async () => {
      const photo = await getPhotoByUid(uid);
      setPhoto(photo);
    };
    fetchPhoto();
  }, [uid]);

  const router = useRouter();
  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-background overflow-hidden">
      <main className="h-full w-full flex">
        <section className="photo-preview-left w-19/24 relative py-4">
          <header className="w-full absolute top-2 left-0 text-right">
            <Button isIconOnly onClick={() => router.back()} variant="ghost">
              <Xmark />
            </Button>
          </header>
          <img
            className="h-full object-contain m-auto"
            src={genSrc(photo?.src)}
            alt={photo?.title}
          />
        </section>
        <section className="photo-preview-right w-5/24 h-full p-1">
          <div className="border boder-border h-full rounded-2xl p-4 overflow-auto">
            {photo && <PhotoInfo photo={photo} />}
          </div>
        </section>
      </main>
      <footer></footer>
    </div>
  );
}
