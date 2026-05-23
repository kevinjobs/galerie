import { deletePhotoByUid, genSrc, updatePhoto } from "@/app/api";
import { Confirm } from "@/app/components";
import { Photo } from "@/app/typings";
import {
  LockFill,
  LockOpen,
  Pencil,
  Star,
  StarFill,
  TrashBin,
} from "@gravity-ui/icons";
import { Button, toast } from "@heroui/react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

export default function PhotoList({
  lists,
  onRefresh,
}: {
  lists: Photo[];
  onRefresh: () => void;
}) {
  const router = useRouter();

  const buildUpdateBody = (item: Photo, overrides: Partial<Photo>) => ({
    title: item.title,
    description: item.description,
    location: item.location,
    author: item.author,
    shootTime: item.shootTime || new Date().toISOString(),
    isPublic: overrides.isPublic ?? item.isPublic,
    isSelected: overrides.isSelected ?? item.isSelected,
    src: item.src,
    exif: item.exif || "",
  });

  const handleToggle = (item: Photo, updates: Partial<Photo>, successText: string) => {
    const promise = updatePhoto(item.uid, buildUpdateBody(item, updates));
    toast.promise(promise, {
      loading: "正在更新照片状态...",
      success: successText,
      error: "更新失败，请重试",
    });
    promise.then(() => onRefresh());
  };

  const handleDelete = (item: Photo) => {
    const promise = deletePhotoByUid(item.uid);
    toast.promise(promise, {
      loading: "正在删除照片...",
      success: "删除成功",
      error: "删除失败，请重试",
    });
    promise.then(() => onRefresh());
  };

  if (lists.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-10 text-center text-muted">
        暂无照片数据
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {lists.map((item) => (
        <article
          key={item.uid}
          className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="relative overflow-hidden bg-muted/5">
            <img
              src={genSrc(item.src, true)}
              alt={item.title}
              className="h-48 w-full object-cover lg:h-56"
            />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/40 to-transparent p-3 text-xs text-white">
              <span
                className={`rounded-full px-3 py-1 ${
                  item.isPublic ? "bg-primary/60" : "bg-black/50"
                }`}
              >
                {item.isPublic ? "公开" : "私有"}
              </span>
              <span
                className={`rounded-full px-3 py-1 ${
                  item.isSelected ? "bg-warning/60" : "bg-black/50"
                }`}
              >
                {item.isSelected ? "精选" : "普通"}
              </span>
            </div>
          </div>

          <div className="p-4 lg:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-foreground lg:text-xl">
                  {item.title || "未命名照片"}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted">
                  {item.description || "暂无描述"}
                </p>
              </div>
              <p className="shrink-0 text-xs text-muted sm:text-sm">
                {dayjs(item.shootTime).format("YYYY-MM-DD HH:mm")}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-background p-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted">摄影师</p>
                <p className="mt-0.5 text-sm text-foreground">{item.author || "未知"}</p>
              </div>
              <div className="rounded-2xl bg-background p-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted">位置</p>
                <p className="mt-0.5 truncate text-sm text-foreground">{item.location || "未知"}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() => router.push(`/hinter/photo/${item.uid}`)}
                >
                  <Pencil width={14} height={14} />
                  <span className="ml-1 hidden sm:inline">编辑</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  isIconOnly
                  onPress={() =>
                    handleToggle(
                      item,
                      { isPublic: !item.isPublic },
                      item.isPublic ? "已切换为私有" : "已公开",
                    )
                  }
                >
                  {item.isPublic ? <LockOpen width={16} height={16} /> : <LockFill width={16} height={16} />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  isIconOnly
                  onPress={() =>
                    handleToggle(
                      item,
                      { isSelected: !item.isSelected },
                      item.isSelected ? "已取消精选" : "已设为精选",
                    )
                  }
                >
                  {item.isSelected ? <StarFill width={16} height={16} /> : <Star width={16} height={16} />}
                </Button>
              </div>
              <Confirm
                title="确认删除该照片？"
                variant="danger"
                content={<p className="text-danger">删除后无法恢复</p>}
                onConfirmAction={() => handleDelete(item)}
              >
                <Button size="sm" variant="danger" isIconOnly>
                  <TrashBin width={16} height={16} />
                </Button>
              </Confirm>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
