"use client";
import { deleteUserByUid, getUserLists } from "@/app/api";
import { Confirm, Modal } from "@/app/components";
import { PermissionGuard } from "@/app/components/PermissionGuard";
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
import { ROLE_LABELS } from "@/prisma/lib/roles";

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
    setUser({ name: "", email: "", nickname: "", role: "contributor", isSuperuser: false });
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
      <section className="rounded-3xl bg-background p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted">用户管理</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">用户列表</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              placeholder="搜索用户名、邮箱..."
              className="w-full sm:min-w-[200px] sm:w-auto"
            />
            <Button variant="secondary" isIconOnly onPress={handleRefresh}>
              <ArrowRotateLeft width={16} height={16} />
            </Button>
            <PermissionGuard permission="user.create">
              <Button onPress={handleAddUser}>
                <Plus width={16} height={16} />
                <span className="ml-1 hidden sm:inline">添加用户</span>
              </Button>
            </PermissionGuard>
          </div>
        </div>
      </section>

      {isPending ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : error ? (
        <div className="rounded-3xl bg-background p-10 text-center text-danger">
          加载失败：{error.message}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-3xl bg-background p-10 text-center text-muted">
          {users.length === 0 ? "暂无用户" : "未找到匹配的用户"}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredUsers.map((item) => (
            <div
              key={item.uid}
              className="rounded-3xl bg-background p-5 transition hover:-translate-y-0.5"
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
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted/10 px-3 py-1 text-xs text-muted">
                    @{item.name}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {ROLE_LABELS[item.role as keyof typeof ROLE_LABELS] || item.role}
                  </span>
                  {item.isSuperuser && (
                    <span className="rounded-full bg-warning/10 px-2 py-1 text-[10px] font-medium text-warning">
                      Super
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <PermissionGuard permission="user.update">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="secondary"
                      onPress={() => handleEditUser(item)}
                    >
                      <Pencil width={14} height={14} />
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard permission="user.delete">
                    <Confirm
                      title="确认删除该用户？"
                      variant="danger"
                      content={<p className="text-danger">删除后无法恢复</p>}
                      onConfirmAction={async () => {
                        try {
                          await deleteUserByUid(item.uid);
                          toast.success("用户已删除");
                          refetch();
                        } catch (err) {
                          toast.danger(`删除失败: ${(err as Error).message}`);
                        }
                      }}
                    >
                      <Button isIconOnly size="sm" variant="danger">
                        <TrashBin width={14} height={14} />
                      </Button>
                    </Confirm>
                  </PermissionGuard>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onChangeAction={setIsOpen} size="lg">
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
