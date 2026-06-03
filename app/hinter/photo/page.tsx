"use client";
import { getPhotoLists } from "@/app/api";
import { ArrowsRotateLeft, Plus } from "@gravity-ui/icons";
import { Button, Input, toast } from "@heroui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Photo } from "@/app/typings";
import { useRouter } from "next/navigation";
import PhotoList from "./photo-list";

const filterTabs = [
  { key: "all", label: "全部" },
  { key: "public", label: "公开" },
  { key: "selected", label: "精选" },
] as const;

type FilterKey = (typeof filterTabs)[number]["key"];

export default function PhotoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
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

  const photos: Photo[] = useMemo(() => data?.lists || [], [data]);

  const filteredPhotos = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return photos.filter((photo) => {
      if (filter === "public" && !photo.isPublic) return false;
      if (filter === "selected" && !photo.isSelected) return false;
      if (!query) return true;
      const searchable = [photo.title, photo.description, photo.location, photo.author]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [filter, keyword, photos]);

  const summary = {
    total: photos.length,
    publicCount: photos.filter((p) => p.isPublic).length,
    selectedCount: photos.filter((p) => p.isSelected).length,
    recent: photos[0]?.shootTime || photos[0]?.createTime || "--",
  };

  const handleRefresh = () => {
    toast.promise(
      queryClient.invalidateQueries({ queryKey: ["photoLists"] }),
      {
        loading: "正在刷新照片列表...",
        success: "刷新成功",
        error: "刷新失败，请重试",
      },
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.24em] text-muted">照片管理</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">图库总览</h1>
            <p className="mt-2 text-sm leading-7 text-muted">
              查看所有照片状态、快速查找作品，或直接进入操作菜单。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onPress={handleRefresh} isIconOnly={isFetching}>
              <ArrowsRotateLeft width={16} height={16} />
            </Button>
            <Button onPress={() => router.push("/hinter/photo/new")}>
              <Plus width={16} height={16} />
              <span className="ml-1">上传照片</span>
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="text-muted">
            共 <span className="font-semibold text-foreground">{summary.total}</span> 张
          </span>
          <span className="text-border">|</span>
          <span className="text-muted">
            公开 <span className="font-semibold text-primary">{summary.publicCount}</span>
          </span>
          <span className="text-border">|</span>
          <span className="text-muted">
            精选 <span className="font-semibold text-warning">{summary.selectedCount}</span>
          </span>
          <span className="text-border">|</span>
          <span className="text-muted">
            最近 {summary.recent === "--" ? "--" : new Date(summary.recent).toLocaleDateString()}
          </span>
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
            className="min-w-[220px] max-w-full"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <span>
            当前筛选：{filteredPhotos.length} / {photos.length} 张
          </span>
          {isFetching && <span className="text-primary">正在同步...</span>}
          {error && <span className="text-danger">加载失败，请重试</span>}
        </div>
      </section>

      {filteredPhotos.length > 0 ? (
        <PhotoList lists={filteredPhotos} onRefresh={refetch} />
      ) : (
        <div className="rounded-3xl border border-border bg-surface p-10 text-center text-muted">
          {photos.length === 0
            ? "当前图库为空，稍后上传第一张照片。"
            : "未找到符合条件的照片，请调整搜索或筛选。"}
        </div>
      )}
    </div>
  );
}
