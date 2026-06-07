"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSetAtom } from "jotai";
import { photoListAtom } from "../store";
import { genSrc, getPhotoLists } from "../api";
import { Photo } from "../typings";
import { Album } from "./album";
import Toolbar from "./toolbar";

type FilterType = "selected" | "latest" | "random";
const PAGE_SIZE = 12;

function getAspectRatio(photo: Photo): number | undefined {
  if (!photo.exif) return;
  try {
    const exif = typeof photo.exif === "string" ? JSON.parse(photo.exif) : photo.exif;
    const w = Number(exif.width);
    const h = Number(exif.height);
    if (w && h) return w / h;
  } catch {}
}

export default function GalleryPage() {
  const defaultFilter: FilterType = "latest";
  const [filter, setFilter] = useState<FilterType>(defaultFilter);
  const setPhotoList = useSetAtom(photoListAtom);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, isPending, isFetching, fetchNextPage, hasNextPage, isFetchNextPageError } =
    useInfiniteQuery({
      queryKey: ["gallery", filter],
      queryFn: ({ pageParam }) =>
        getPhotoLists({
          offset: pageParam.offset,
          limit: PAGE_SIZE,
          isPublic: true,
          isSelected: filter === "selected" ? true : undefined,
          order: filter === "random" ? "random" : "desc",
        }),
      initialPageParam: { offset: 0 },
      getNextPageParam: (lastPage) => {
        const next = lastPage.offset + lastPage.limit;
        return next < lastPage.total ? { offset: next } : undefined;
      },
    });

  useEffect(() => {
    if (!data) return;
    const allUids = data.pages.flatMap((p) => p.lists.map((item: Photo) => item.uid));
    setPhotoList(allUids);
  }, [data, setPhotoList]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetching) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, fetchNextPage]);

  const allPhotos = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((p) =>
      p.lists.map((item: Photo) => ({
        uid: item.uid,
        src: item.src,
        title: item.title,
        aspectRatio: getAspectRatio(item),
      })),
    );
  }, [data]);

  if (!data && isPending) {
    return (
      <div className="mx-2">
        <div className="text-center py-20">正在加载照片...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-2 pb-24">
        {allPhotos.length > 0 ? (
          <Album photos={allPhotos} />
        ) : (
          <div className="text-center py-20">暂无照片 换个栏目看看</div>
        )}

        {hasNextPage && (
          <div ref={sentinelRef} className="flex justify-center py-8">
            {isFetching && <span className="text-sm opacity-50">加载中...</span>}
          </div>
        )}

        {!hasNextPage && allPhotos.length > 0 && (
          <div className="text-center py-8 text-sm opacity-40">已显示全部照片</div>
        )}
      </div>

      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10">
        <Toolbar
          items={[
            {
              name: "selected",
              label: "精选",
              default: defaultFilter === ("selected" as FilterType),
              onPress: (f) => setFilter(f as FilterType),
            },
            {
              name: "latest",
              label: "最新",
              default: defaultFilter === ("latest" as FilterType),
              onPress: (f) => setFilter(f as FilterType),
            },
            {
              name: "random",
              label: "随览",
              default: defaultFilter === ("random" as FilterType),
              onPress: (f) => setFilter(f as FilterType),
            },
          ]}
        />
      </footer>
    </div>
  );
}