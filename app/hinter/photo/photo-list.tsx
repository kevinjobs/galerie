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
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {lists.map((item) => (
        <article
          key={item.uid}
          className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-2 shadow-sm transition hover:border-primary/40"
        >
          {/* 缩略图 */}
          <div
            className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted/5 cursor-pointer"
            onClick={() => router.push(`/gallery/${item.uid}`)}
          >
            <img
              src={genSrc(item.src, true)}
              alt={item.title}
              className="size-full object-cover transition duration-300 group-hover:scale-105"
            />
          </div>

          {/* 信息 */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-medium text-foreground">
                {item.title || "未命名"}
              </h3>
              {item.isPublic ? (
                <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] leading-none text-primary">公开</span>
              ) : (
                <span className="shrink-0 rounded-full bg-muted/15 px-1.5 py-0.5 text-[10px] leading-none text-muted">私有</span>
              )}
              {item.isSelected && (
                <StarFill width={11} height={11} className="shrink-0 text-warning" />
              )}
            </div>
            <p className="mt-0.5 truncate text-[11px] text-muted">
              {item.author || "未知"} · {dayjs(item.shootTime).format("MM-DD")}
            </p>
          </div>

          {/* 操作 */}
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              className="size-7 min-w-0"
              onPress={() => router.push(`/hinter/photo/${item.uid}`)}
            >
              <Pencil width={12} height={12} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              className="size-7 min-w-0"
              onPress={() =>
                handleToggle(item, { isPublic: !item.isPublic }, item.isPublic ? "已切换为私有" : "已公开")
              }
            >
              {item.isPublic ? <LockOpen width={12} height={12} /> : <LockFill width={12} height={12} />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              className="size-7 min-w-0"
              onPress={() =>
                handleToggle(item, { isSelected: !item.isSelected }, item.isSelected ? "已取消精选" : "已设为精选")
              }
            >
              {item.isSelected ? <StarFill width={12} height={12} /> : <Star width={12} height={12} />}
            </Button>
            <Confirm
              title="确认删除该照片？"
              variant="danger"
              content={<p className="text-danger">删除后无法恢复</p>}
              onConfirmAction={() => handleDelete(item)}
            >
              <Button size="sm" variant="danger" isIconOnly className="size-7 min-w-0">
                <TrashBin width={12} height={12} />
              </Button>
            </Confirm>
          </div>
        </article>
      ))}
    </div>
  );
}
