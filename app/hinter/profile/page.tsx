"use client";
import { changePassword, deleteUserByUid, updateUser } from "@/app/api";
import { Confirm } from "@/app/components";
import { settingAtom, tokenAtom, userAtom } from "@/app/store";
import { UserPlain } from "@/app/typings";
import { ArrowRightFromSquare, TrashBin, PersonPencil } from "@gravity-ui/icons";
import { Button, Input, Label, toast } from "@heroui/react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

export default function ProfilePage() {
  const [user, setUser] = useAtom(userAtom);
  const [token, setToken] = useAtom(tokenAtom);
  const [, setSetting] = useAtom(settingAtom);
  const router = useRouter();

  // 昵称表单
  const {
    control: nicknameControl,
    handleSubmit: handleNicknameSubmit,
  } = useForm({
    values: {
      nickname: user?.nickname || "",
    },
  });

  // 密码表单
  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
  } = useForm({
    values: {
      oldPassword: "",
      newPassword: "",
    },
  });

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    toast.success("已退出登录");
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteUserByUid(user?.uid || "");
      setToken(null);
      setUser(null);
      toast.success("账户已注销");
      router.push("/register");
    } catch (err) {
      toast.danger(`注销失败: ${(err as Error).message}`);
    }
  };

  const handleChangePassword = async (data: { oldPassword: string; newPassword: string }) => {
    try {
      await changePassword(data.oldPassword, data.newPassword);
      toast.success("密码已修改");
      resetPassword({ oldPassword: "", newPassword: "" });
    } catch (err) {
      toast.danger(`修改密码失败: ${(err as Error).message}`);
    }
  };

  const handleUpdateNickname = async (data: { nickname: string }) => {
    if (!user?.uid) return;
    try {
      const res = await updateUser(user.uid, { nickname: data.nickname });
      setUser(res);
      setSetting(res.setting);
      toast.success("昵称已更新");
    } catch (err) {
      toast.danger(`更新失败: ${(err as Error).message}`);
    }
  };

  const initial = (user?.nickname || user?.name || user?.email || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-muted">个人资料</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">账户信息</h1>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-muted/10 text-3xl font-bold text-muted">
            {initial}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-foreground">{user?.nickname || user?.name || "未命名用户"}</h2>
            <p className="text-sm text-muted">{user?.email}</p>
            <p className="mt-1 text-xs text-muted">@{user?.name}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <PersonPencil width={18} height={18} />
          基本信息
        </h2>
        <form onSubmit={handleNicknameSubmit(handleUpdateNickname)} className="mt-4">
          <Controller
            name="nickname"
            control={nicknameControl}
            render={({ field }) => (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label className="mb-1 block text-sm">昵称</Label>
                  <Input {...field} placeholder="设置昵称"  />
                </div>
                <Button type="submit" >保存</Button>
              </div>
            )}
          />
        </form>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">修改密码</h2>
        <form onSubmit={handlePasswordSubmit(handleChangePassword)} className="mt-4 space-y-4">
          <Controller
            name="oldPassword"
            control={passwordControl}
            rules={{ required: "请输入旧密码" }}
            render={({ field, fieldState }) => (
              <div>
                <Label className="mb-1 block text-sm">旧密码</Label>
                <Input {...field} type="password" placeholder="输入旧密码"  />
                {fieldState.error && (
                  <p className="mt-1 text-xs text-danger">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
          <Controller
            name="newPassword"
            control={passwordControl}
            rules={{ required: "请输入新密码", minLength: { value: 6, message: "密码至少6位" } }}
            render={({ field, fieldState }) => (
              <div>
                <Label className="mb-1 block text-sm">新密码</Label>
                <Input {...field} type="password" placeholder="输入新密码（至少6位）"  />
                {fieldState.error && (
                  <p className="mt-1 text-xs text-danger">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit" variant="secondary" >修改密码</Button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-danger/30 bg-surface p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-semibold text-danger">
          <TrashBin width={18} height={18} />
          危险区域
        </h2>
        <p className="mt-1 text-sm text-muted">以下操作不可逆，请谨慎执行。</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Confirm
            title="退出登录"
            content="确定要退出当前账户吗？"
            confirmText="退出"
            variant="danger"
            onConfirmAction={handleLogout}
          >
            <Button variant="danger" className="w-full justify-start sm:w-auto">
              <ArrowRightFromSquare width={16} height={16} />
              <span className="ml-2">退出登录</span>
            </Button>
          </Confirm>

          <Confirm
            title="注销账户"
            content="此操作不可撤销，账户中的所有数据将被永久删除。确定要继续吗？"
            confirmText="确认注销"
            variant="danger"
            onConfirmAction={handleDeleteAccount}
          >
            <Button variant="danger" className="w-full justify-start sm:w-auto">
              <TrashBin width={16} height={16} />
              <span className="ml-2">注销账户</span>
            </Button>
          </Confirm>
        </div>
      </section>
    </div>
  );
}
