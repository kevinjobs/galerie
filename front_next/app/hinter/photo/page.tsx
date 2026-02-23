"use client";

import { getPhotoLists } from "@/app/api";
import { Plus, ArrowsRotateLeft } from "@gravity-ui/icons";
import { Button, ButtonGroup, toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import PhotoLists from "./lists";

export default function PhotoPage() {
  const router = useRouter();

  const { data, refetch, isFetched, isRefetchError } = useQuery({
    queryKey: ["data"],
    queryFn: () => getPhotoLists(),
  });

  return (
    <div className="">
      <header className="flex justify-center py-4">
        <ButtonGroup>
          <Button onPress={() => router.push("/hinter/photo/add")}>
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
          >
            <ArrowsRotateLeft />
            <span>刷新列表</span>
          </Button>
        </ButtonGroup>
      </header>
      <main>
        {data?.lists && <PhotoLists lists={data.lists} onRefresh={refetch} />}
      </main>
    </div>
  );
}
