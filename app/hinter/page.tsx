"use client";
import Link from "next/link";
import { getPhotoLists, getUserLists } from "@/app/api";
import { useQuery } from "@tanstack/react-query";
import { genSrc } from "@/app/api";
import { Photo } from "@/app/typings";
import { Picture, Person, Gear, PersonPencil } from "@gravity-ui/icons";
import dayjs from "dayjs";

const cards = [
  { href: "/hinter/photo", title: "照片管理", description: "浏览、上传与编辑图库照片。", icon: Picture },
  { href: "/hinter/user", title: "用户管理", description: "管理用户列表和权限。", icon: Person },
  { href: "/hinter/setting", title: "杂项", description: "调整主题、语言和存储选项。", icon: Gear },
  { href: "/hinter/profile", title: "个人资料", description: "查看账户信息并执行安全操作。", icon: PersonPencil },
];

export default function HinterPage() {
  const { data: photoData } = useQuery({
    queryKey: ["photoLists", "dashboard"],
    queryFn: () => getPhotoLists({ orderBy: "shootTime", order: "desc", limit: 5 }),
  });

  // 单独获取公开和精选的总数（仅取 total，limit=1 避免拉取多余数据）
  const { data: publicData } = useQuery({
    queryKey: ["photoLists", "dashboard", "public"],
    queryFn: () => getPhotoLists({ isPublic: true, limit: 1 }),
  });
  const { data: selectedData } = useQuery({
    queryKey: ["photoLists", "dashboard", "selected"],
    queryFn: () => getPhotoLists({ isSelected: true, limit: 1 }),
  });

  const { data: userData } = useQuery({
    queryKey: ["userLists", "dashboard"],
    queryFn: getUserLists,
  });

  const photos: Photo[] = photoData?.lists || [];
  const users: unknown[] = userData || [];
  const totalPhotos = photoData?.total ?? 0;
  const publicCount = publicData?.total ?? 0;
  const selectedCount = selectedData?.total ?? 0;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-muted">欢迎</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Hinter 控制台</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
          从左侧菜单选择模块，或通过下方卡片快速进入对应功能。
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Picture width={20} height={20} />
            </span>
            <p className="text-sm text-muted">照片总数</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-foreground">{totalPhotos}</p>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
              <Picture width={20} height={20} />
            </span>
            <p className="text-sm text-muted">公开照片</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-foreground">{publicCount}</p>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <Picture width={20} height={20} />
            </span>
            <p className="text-sm text-muted">精选照片</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-foreground">{selectedCount}</p>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-danger/10 text-danger">
              <Person width={20} height={20} />
            </span>
            <p className="text-sm text-muted">用户总数</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-foreground">{users.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm overflow-x-hidden">
          <h2 className="text-base font-semibold text-foreground">最近拍摄</h2>
          <p className="mt-1 text-sm text-muted">最新上传照片</p>
          <div className="mt-4 space-y-3">
            {photos.length > 0 ? photos.slice(0, 2).map((photo) => (
              <Link
                key={photo.uid}
                href={`/hinter/photo/${photo.uid}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 transition hover:border-primary/50"
              >
                <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-muted/10">
                  <img
                    src={genSrc(photo.src, true)}
                    alt={photo.title}
                    className="size-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{photo.title || "未命名照片"}</p>
                  <p className="truncate text-xs text-muted">{photo.author || "未知摄影师"}</p>
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {dayjs(photo.shootTime || photo.createTime).format("MM-DD")}
                </span>
              </Link>
            )) : (
              <p className="py-8 text-center text-sm text-muted">图库为空</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm overflow-x-hidden">
          <h2 className="text-base font-semibold text-foreground">快捷入口</h2>
          <p className="mt-1 text-sm text-muted">快速跳转到各管理模块</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 transition hover:border-primary/50 hover:bg-primary/5"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/10 text-muted">
                    <Icon width={20} height={20} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{card.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{card.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
