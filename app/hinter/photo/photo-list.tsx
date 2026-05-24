import { deletePhotoByUid, genSrc, updatePhoto } from "@/app/api";
import { Confirm } from "@/app/components";
import { Photo } from "@/app/typings";
import {
  LocationArrowFill,
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {lists.map((item) => (
        <article
          key={item.uid}
          className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div
            className="relative overflow-hidden bg-muted/5 cursor-pointer"
            onClick={() => router.push(`/gallery/${item.uid}`)}
          >
            <img
              src={genSrc(item.src, true)}
              alt={item.title}
              className="h-36 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-40 lg:h-44"
            />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-1 bg-gradient-to-b from-black/40 to-transparent px-2.5 py-1.5 text-[11px] text-white">
              <span
                className={`rounded-full px-2 py-0.5 ${
                  item.isPublic ? "bg-primary/60" : "bg-black/50"
                }`}
              >
                {item.isPublic ? "公开" : "私有"}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 ${
                  item.isSelected ? "bg-warning/60" : "bg-black/50"
                }`}
              >
                {item.isSelected ? "精选" : "普通"}
              </span>
            </div>
          </div>

          <div className="p-3 lg:p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 truncate text-sm font-semibold text-foreground">
                {item.title || "未命名照片"}
              </h3>
              <p className="shrink-0 truncate text-right text-[11px] text-muted"
                 title={item.author || "未知"}>
                {item.author || "未知"}
              </p>
            </div>

            <p className="mt-1 line-clamp-1 text-xs text-muted">
              {item.description || "暂无描述"}
            </p>

            {item.location && (
              <p className="mt-1.5 truncate text-xs text-muted">
                <LocationArrowFill width={11} height={11} className="relative -top-[1px] mr-0.5 inline-block" />
                {item.location}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between gap-1 border-t border-border pt-2">
              <p className="truncate text-[11px] text-muted">
                {dayjs(item.shootTime).format("YYYY-MM-DD HH:mm")}
              </p>
              <div className="flex gap-0.5">
                <Button
                  size="sm"
                  variant="ghost"
                  isIconOnly
                  className="h-7 w-7 min-w-0"
                  onPress={() => router.push(`/hinter/photo/${item.uid}`)}
                >
                  <Pencil width={13} height={13} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  isIconOnly
                  className="h-7 w-7 min-w-0"
                  onPress={() =>
                    handleToggle(
                      item,
                      { isPublic: !item.isPublic },
                      item.isPublic ? "已切换为私有" : "已公开",
                    )
                  }
                >
                  {item.isPublic ? <LockOpen width={13} height={13} /> : <LockFill width={13} height={13} />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  isIconOnly
                  className="h-7 w-7 min-w-0"
                  onPress={() =>
                    handleToggle(
                      item,
                      { isSelected: !item.isSelected },
                      item.isSelected ? "已取消精选" : "已设为精选",
                    )
                  }
                >
                  {item.isSelected ? <StarFill width={13} height={13} /> : <Star width={13} height={13} />}
                </Button>
              </div>
              <Confirm
                title="确认删除该照片？"
                variant="danger"
                content={<p className="text-danger">删除后无法恢复</p>}
                onConfirmAction={() => handleDelete(item)}
              >
                <Button size="sm" variant="danger" isIconOnly className="h-7 w-7 min-w-0">
                  <TrashBin width={13} height={13} />
                </Button>
              </Confirm>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
