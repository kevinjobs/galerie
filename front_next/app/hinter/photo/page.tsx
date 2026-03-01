"use client";

import { getPhotoLists } from "@/app/api";
import { ArrowsRotateLeft, Plus } from "@gravity-ui/icons";
import { Button, ButtonGroup, toast } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { BrowserView, MobileView } from "react-device-detect";
import PhotoLists from "./lists";
import { MobilePhotoLists } from "./mobile-lists";

export default function PhotoPage() {
  const router = useRouter();

  const { data, refetch, isFetched, isRefetchError } = useQuery({
    queryKey: ["data"],
    queryFn: () => getPhotoLists(),
  });

  return (
    <div className="">
      <header className="flex justify-center">
      </header>
      <main className="pt-2">
        <BrowserView>{data?.lists && <PhotoLists lists={data.lists} onRefresh={refetch} />}</BrowserView>
        <MobileView className="px-8">{data?.lists && <MobilePhotoLists photos={data.lists} onRefresh={refetch} />}</MobileView>
      </main>
      <div className="fixed bottom-16 right-8">
        <div>
          <Button
            onPress={() => {
              refetch();
              if (isFetched) {
                toast.success("刷新成功");
              }

              if (isRefetchError) {
                toast.danger("刷新失败");
              }
            }}
            size="md"
            variant="tertiary"
            isIconOnly
          >
            <ArrowsRotateLeft />
          </Button>
        </div>
        <div className="mt-2">
          <Button onPress={() => router.push("/hinter/photo/add")} size="md" isIconOnly>
            <Plus />
          </Button>
        </div>
      </div>
    </div>
  );
}
