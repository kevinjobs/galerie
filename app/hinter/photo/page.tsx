"use client";

import { getPhotoLists } from "@/app/api";
import { ArrowsRotateLeft, Plus } from "@gravity-ui/icons";
import { Button, Input, toast } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserView, MobileView } from "react-device-detect";
import PhotoLists from "./lists";
import { MobilePhotoLists } from "./mobile-lists";
import { Photo } from "@/app/typings";

const filterTabs = [
  { key: "all", label: "全部" },
  { key: "public", label: "公开" },
  { key: "selected", label: "精选" },
] as const;

type FilterKey = (typeof filterTabs)[number]["key"];

export default function PhotoPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [keyword, setKeyword] = useState("");

  const { data, refetch, isFetching, error } = useQuery({
    queryKey: ["photoLists"],
    queryFn: () =>
      getPhotoLists({
        orderBy: "shootTime",
        order: "desc",
      }),
  });

  const photos: Photo[] = data?.lists || [];

  const filteredPhotos = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return photos.filter((photo) => {
      if (filter === "public" && !photo.isPublic) {
        return false;
      }
      if (filter === "selected" && !photo.isSelected) {
        return false;
      }
      if (!query) {
        return true;
      }

      const searchable = [photo.title, photo.description, photo.location, photo.author]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [filter, keyword, photos]);

  const summary = {
    total: photos.length,
    publicCount: photos.filter((photo) => photo.isPublic).length,
    selectedCount: photos.filter((photo) => photo.isSelected).length,
    recent: photos[0]?.shootTime || photos[0]?.createTime || "--",
  };

  const handleRefresh = () => {
    toast.promise(refetch(), {
      loading: "正在刷新照片列表...",
      success: "刷新成功",
      error: "刷新失败，请重试",
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.24em] text-muted">照片管理</p>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">图库总览</h1>
            <p className="mt-2 text-sm leading-7 text-muted">
              在这里查看所有照片状态、快速查找作品，或直接进入操作菜单。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onPress={handleRefresh}>
              刷新列表
            </Button>
            <Button
              onPress={() => {
                toast.info("上传入口暂未配置，请前往编辑页面或后续补全");
              }}
            >
              上传照片
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-border bg-surface p-4">
            <p className="text-sm text-muted">照片总数</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">
              {summary.total}
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-4">
            <p className="text-sm text-muted">公开照片</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">
              {summary.publicCount}
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-4">
            <p className="text-sm text-muted">精选照片</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">
              {summary.selectedCount}
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-4">
            <p className="text-sm text-muted">最近拍摄</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">
              {summary.recent}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <Button
                key={tab.key}
                size="sm"
                variant={filter === tab.key ? "primary" : "secondary"}
                onPress={() => setFilter(tab.key)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.currentTarget.value)}
            placeholder="搜索标题、描述、位置或作者"
            className="min-w-[260px] max-w-full"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <span>
            当前筛选：{filteredPhotos.length} / {photos.length} 张
          </span>
          {isFetching && <span>正在同步...</span>}
          {error && <span className="text-danger">加载失败，请重试</span>}
        </div>
      </section>

      <section className="space-y-4">
        {filteredPhotos.length > 0 ? (
          <>
            <BrowserView>
              <PhotoLists lists={filteredPhotos} onRefresh={refetch} />
            </BrowserView>
            <MobileView className="px-0">
              <MobilePhotoLists photos={filteredPhotos} onRefresh={refetch} />
            </MobileView>
          </>
        ) : (
          <div className="rounded-3xl border border-border bg-surface p-10 text-center text-muted">
            {photos.length === 0
              ? "当前图库为空，稍后上传第一张照片。"
              : "未找到符合条件的照片，请调整搜索或筛选。"}
          </div>
        )}
      </section>
    </div>
  );
}
