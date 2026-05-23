"use client";
import { getUserLists } from "@/app/api";
import { Modal } from "@/app/components";
import { UserPlain } from "@/app/typings";
import { ArrowRotateLeft, Pencil, Plus, TrashBin } from "@gravity-ui/icons";
import {
  Avatar,
  Button,
  Input,
  Spinner,
  toast,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { UserEdit } from "./edit";

export default function UserPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<Partial<UserPlain> | null>(null);
  const [search, setSearch] = useState("");

  const { data, refetch, error, isPending } = useQuery({
    queryKey: ["userLists"],
    queryFn: getUserLists,
  });

  const users: UserPlain[] = useMemo(() => data instanceof Array ? data : [], [data]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.nickname?.toLowerCase().includes(query),
    );
  }, [search, users]);

  const handleAddUser = () => {
    setUser({ name: "", email: "", nickname: "" });
    setIsOpen(true);
  };

  const handleEditUser = (item: UserPlain) => {
    setUser(item);
    setIsOpen(true);
  };

  const handleRefresh = () => {
    toast.promise(refetch(), {
      loading: "正在刷新",
      success: "刷新成功",
      error: "刷新失败",
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted">用户管理</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">用户列表</h1>
          </div>
          <div className="flex items-center gap-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              placeholder="搜索用户名、邮箱..."
              className="min-w-[200px]"
            />
            <Button variant="secondary" isIconOnly onPress={handleRefresh}>
              <ArrowRotateLeft width={16} height={16} />
            </Button>
            <Button onPress={handleAddUser}>
              <Plus width={16} height={16} />
              <span className="ml-1 hidden sm:inline">添加用户</span>
            </Button>
          </div>
        </div>
      </section>

      {isPending ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-border bg-surface p-10 text-center text-danger">
          加载失败：{error.message}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-3xl border border-border bg-surface p-10 text-center text-muted">
          {users.length === 0 ? "暂无用户" : "未找到匹配的用户"}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredUsers.map((item) => (
            <div
              key={item.uid}
              className="rounded-3xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <Avatar size="md">
                  <Avatar.Fallback className="text-lg font-semibold">
                    {(item.nickname || item.name).charAt(0).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-foreground">
                    {item.nickname || item.name}
                  </p>
                  <p className="truncate text-sm text-muted">{item.email}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="rounded-full bg-muted/10 px-3 py-1 text-xs text-muted">
                  @{item.name}
                </span>
                <div className="flex gap-1.5">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="secondary"
                    onPress={() => handleEditUser(item)}
                  >
                    <Pencil width={14} height={14} />
                  </Button>
                  <Button isIconOnly size="sm" variant="danger">
                    <TrashBin width={14} height={14} />
                  </Button>
                </div>
              </div>

              {item.permissions && item.permissions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.permissions.slice(0, 3).map((perm) => (
                    <span
                      key={perm}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
                    >
                      {perm}
                    </span>
                  ))}
                  {item.permissions.length > 3 && (
                    <span className="rounded-full bg-muted/10 px-2 py-0.5 text-[11px] text-muted">
                      +{item.permissions.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onChangeAction={setIsOpen} size="md">
        <UserEdit
          defaultUser={user as UserPlain}
          onSubmitAction={() => {
            setIsOpen(false);
            setUser(null);
            refetch();
          }}
          onCancelAction={() => {
            setIsOpen(false);
            setUser(null);
          }}
        />
      </Modal>
    </div>
  );
}
