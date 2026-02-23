"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { genSrc, getPhotoLists } from "../api";
import { Photo } from "../typings";
import { Album } from "./album";
import Toolbar from "./toolbar";

type FilterType = "selected" | "latest" | "random";

export default function GalleryPage() {
  const defaultFilter: FilterType = "latest";

  const [filter, setFilter] = useState<FilterType>(defaultFilter);

  const { data } = useQuery({
    queryKey: ["data", filter],
    queryFn: () =>
      getPhotoLists({
        isSelected: filter === "selected" ? true : undefined,
        order: filter === "random" ? "random" : "desc",
        isPublic: true,
      }),
  });

  const albumData = useMemo(() => {
    return data?.lists?.map((item: Photo) => ({
      createTime: item.createTime,
      element: (
        <Link href={`/gallery/${item.uid}`}>
          <img
            src={genSrc(item.src)}
            alt={item.title}
            loading="eager"
            className="object-cover w-full h-full"
          />
        </Link>
      ),
    }));
  }, [data]);

  return (
    <div className="">
      <div className="mt-4">
        {albumData?.length ? <Album data={albumData} gap={4} /> : <div className="text-center">暂无照片 换个栏目看看</div>}
      </div>
      <footer className="fixed bottom-8 left-1/2 -translate-x-1/2">
        <Toolbar
          items={[
            {
              name: "selected",
              label: "精选",
              default: defaultFilter === "selected" as FilterType,
              onPress: (f) => setFilter(f as FilterType),
            },
            {
              name: "latest",
              label: "最新",
              default: defaultFilter === "latest" as FilterType,
              onPress: (f) => setFilter(f as FilterType),
            },
            {
              name: "random",
              label: "随览",
              default: defaultFilter === "random" as FilterType,
              onPress: (f) => setFilter(f as FilterType),
            },
          ]}
        />
      </footer>
    </div>
  );
}
