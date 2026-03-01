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
        <ButtonGroup>
          <Button onPress={() => router.push("/hinter/photo/add")} size="sm">
            <Plus />
            <span>上传图片</span>
          </Button>
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
            size="sm"
          >
            <ArrowsRotateLeft />
            <span>刷新列表</span>
          </Button>
        </ButtonGroup>
      </header>
      <main className="pt-2">
        <BrowserView>{data?.lists && <PhotoLists lists={data.lists} onRefresh={refetch} />}</BrowserView>
        <MobileView className="px-8">{data?.lists && <MobilePhotoLists photos={data.lists} onRefresh={refetch} />}</MobileView>
      </main>
    </div>
  );
}
