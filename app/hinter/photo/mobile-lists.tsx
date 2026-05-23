import { deletePhotoByUid, genSrc, updatePhoto } from "@/app/api";
import { Confirm } from "@/app/components";
import { Photo } from "@/app/typings";
import dayjs from "dayjs";
import {
  Pencil,
  LockOpen,
  LockFill,
  Star,
  StarFill,
  TrashBin,
} from "@gravity-ui/icons";
import { Button, toast } from "@heroui/react";
import { useRouter } from "next/navigation";

export function MobilePhotoLists({
  photos,
  onRefresh,
}: {
  photos: Photo[];
  onRefresh?: () => void;
}) {
  return (
    <div className="space-y-4">
      {photos.map((photo) => (
        <PhotoItem key={photo.uid} photo={photo} onRefresh={onRefresh} />
      ))}
    </div>
  );
}

function PhotoItem({
  photo,
  onRefresh,
}: {
  photo: Photo;
  onRefresh?: () => void;
}) {
  const router = useRouter();

  const buildUpdateBody = (item: Photo, updates: Partial<Photo>) => ({
    title: item.title,
    description: item.description,
    location: item.location,
    author: item.author,
    shootTime: item.shootTime || new Date().toISOString(),
    isPublic: updates.isPublic ?? item.isPublic,
    isSelected: updates.isSelected ?? item.isSelected,
    src: item.src,
    exif: item.exif || "",
  });

  const handleUpdate = (updates: Partial<Photo>, successText: string) => {
    const promise = updatePhoto(photo.uid, buildUpdateBody(photo, updates));

    toast.promise(promise, {
      loading: "正在更新照片...",
      success: successText,
      error: "更新失败，请重试",
    });

    promise.then(() => onRefresh?.());
  };

  const handleDelete = () => {
    const promise = deletePhotoByUid(photo.uid);
    toast.promise(promise, {
      loading: "正在删除照片...",
      success: "删除成功",
      error: "删除失败，请重试",
    });

    promise.then(() => onRefresh?.());
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
      <div className="relative overflow-hidden bg-muted/5">
        <img
          src={genSrc(photo.src, true)}
          alt={photo.title}
          className="h-48 w-full object-cover"
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-black/20 p-3 text-xs text-white">
          <span className="rounded-full bg-black/60 px-3 py-1">{photo.isPublic ? "公开" : "私有"}</span>
          <span className="rounded-full bg-black/60 px-3 py-1">{photo.isSelected ? "精选" : "普通"}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-foreground">{photo.title || "未命名照片"}</h3>
          <p className="mt-2 text-sm text-muted line-clamp-2">
            {photo.description || "暂无描述"}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl bg-background p-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted">摄影师</p>
            <p className="mt-1 text-sm text-foreground">{photo.author || "未知"}</p>
          </div>
          <div className="rounded-3xl bg-background p-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted">拍摄时间</p>
            <p className="mt-1 text-sm text-foreground">
              {dayjs(photo.shootTime).format("YYYY-MM-DD")}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onPress={() => router.push(`/hinter/photo/${photo.uid}`)}
            >
              编辑
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() =>
                handleUpdate(
                  { isPublic: !photo.isPublic },
                  photo.isPublic ? "已切换为私有" : "已公开",
                )
              }
            >
              {photo.isPublic ? <LockOpen /> : <LockFill />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() =>
                handleUpdate(
                  { isSelected: !photo.isSelected },
                  photo.isSelected ? "已取消精选" : "已设为精选",
                )
              }
            >
              {photo.isSelected ? <StarFill /> : <Star />}
            </Button>
          </div>
          <Confirm
            title="确认删除该照片？"
            variant="danger"
            content={<p className="text-danger">删除后无法恢复</p>}
            onConfirmAction={handleDelete}
          >
            <Button size="sm" variant="danger">
              <TrashBin />
            </Button>
          </Confirm>
        </div>
      </div>
    </article>
  );
}
