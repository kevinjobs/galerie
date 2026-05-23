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

export default function PhotoLists({
  lists,
  onRefresh,
}: {
  lists: Photo[];
  onRefresh: () => void;
}) {
  const router = useRouter();

  const buildUpdateBody = (item: Photo, overrides: Partial<Photo>) => {
    return {
      title: item.title,
      description: item.description,
      location: item.location,
      author: item.author,
      shootTime: item.shootTime || new Date().toISOString(),
      isPublic: overrides.isPublic ?? item.isPublic,
      isSelected: overrides.isSelected ?? item.isSelected,
      src: item.src,
      exif: item.exif || "",
    };
  };

  const handleToggle = (
    item: Photo,
    updates: Partial<Photo>,
    successText: string,
  ) => {
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

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {lists.map((item) => (
        <article
          key={item.uid}
          className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="relative overflow-hidden bg-muted/5">
            <img
              src={genSrc(item.src, true)}
              alt={item.title}
              className="h-56 w-full object-cover"
            />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-black/25 p-3 text-xs text-white">
              <span className="rounded-full bg-black/50 px-3 py-1">{item.isPublic ? "公开" : "私有"}</span>
              <span className="rounded-full bg-black/50 px-3 py-1">{item.isSelected ? "精选" : "普通"}</span>
            </div>
          </div>

          <div className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-xl font-semibold text-foreground">
                  {item.title || "未命名照片"}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted">
                  {item.description || "暂无描述"}
                </p>
              </div>
              <p className="text-sm text-muted whitespace-nowrap">
                {dayjs(item.shootTime).format("YYYY-MM-DD HH:mm")}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-background p-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted">摄影师</p>
                <p className="mt-1 text-sm text-foreground">{item.author || "未知"}</p>
              </div>
              <div className="rounded-3xl bg-background p-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted">位置</p>
                <p className="mt-1 text-sm text-foreground">{item.location || "未知"}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    item.isPublic ? "bg-primary/10 text-primary" : "bg-muted/10 text-muted"
                  }`}
                >
                  {item.isPublic ? "公开" : "私有"}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    item.isSelected ? "bg-warning/10 text-warning" : "bg-muted/10 text-muted"
                  }`}
                >
                  {item.isSelected ? "精选" : "普通"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() => router.push(`/hinter/photo/${item.uid}`)}
                >
                  编辑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() =>
                    handleToggle(
                      item,
                      { isPublic: !item.isPublic },
                      item.isPublic ? "已切换为私有" : "已公开",
                    )
                  }
                >
                  {item.isPublic ? <LockOpen /> : <LockFill />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() =>
                    handleToggle(
                      item,
                      { isSelected: !item.isSelected },
                      item.isSelected ? "已取消精选" : "已设为精选",
                    )
                  }
                >
                  {item.isSelected ? <StarFill /> : <Star />}
                </Button>
                <Confirm
                  title="确认删除该照片？"
                  variant="danger"
                  content={<p className="text-danger">删除后无法恢复</p>}
                  onConfirmAction={() => handleDelete(item)}
                >
                  <Button size="sm" variant="danger">
                    <TrashBin />
                  </Button>
                </Confirm>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

