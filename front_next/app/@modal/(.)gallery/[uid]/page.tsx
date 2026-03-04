"use client";
import { genSrc, getPhotoByUid } from "@/app/api";
import { Photo } from "@/app/typings";
import { Xmark, CircleInfo } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { BrowserView, isMobile, MobileView } from "react-device-detect";
import PhotoInfo from "./info";

export default function GalleryModal({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = use(params);

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

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
        <section
          className="photo-preview-left relative"
          style={{ width: isMobile ? "100%" : "75%" }}
        >
          <header className="w-full absolute top-2 left-0 text-right">
            {isMobile && (
              <Button
                isIconOnly
                onClick={() => setIsPanelOpen((prev) => !prev)}
                variant="ghost"
              >
                <CircleInfo />
              </Button>
            )}
            <Button isIconOnly onClick={() => router.back()} variant="ghost">
              <Xmark />
            </Button>
          </header>
          <MobileView>
            <div className="h-[calc(100vh-80px)]">
              <img
                className="h-full object-contain m-auto"
                src={genSrc(photo?.src)}
                alt={photo?.title}
              />
            </div>
          </MobileView>
          <BrowserView>
            <div className="h-screen">
              <img
                className="h-full object-contain m-auto"
                src={genSrc(photo?.src)}
                alt={photo?.title}
              />
            </div>
          </BrowserView>
        </section>
        <BrowserView className="w-[25%]">
          <section className="photo-preview-right h-full p-1">
            <div className="border boder-border h-full rounded-2xl overflow-hidden">
              {photo && <PhotoInfo photo={photo} />}
            </div>
          </section>
        </BrowserView>
        {isPanelOpen && (
          <MobileView>
            <section className="opacity-70 fixed bottom-8 left-1/2 -translate-x-1/2 w-full px-4">
              <div className="border border-border rounded-2xl overflow-auto bg-background">
                {photo && <PhotoInfo photo={photo} />}
              </div>
            </section>
          </MobileView>
        )}
      </main>
      <footer></footer>
    </div>
  );
}
