"use client";
import { changePassword, updateUser } from "@/app/api";
import { Confirm } from "@/app/components";
import { settingAtom, tokenAtom, userAtom } from "@/app/store";
import { UserPlain } from "@/app/typings";
import { ArrowRightFromSquare, TrashBin } from "@gravity-ui/icons";
import { Button, Input as I, Label, toast } from "@heroui/react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

function Input(props: React.ComponentProps<typeof I>) {
  return (
    <I
      {...props}
      className={(props.className || "") + " min-w-60"}
    />
  );
}

export default function ProfilePage() {
  const [user, setUser] = useAtom(userAtom);
  const [token, setToken] = useAtom(tokenAtom);
  const [setting, setSetting] = useAtom(settingAtom);
  const router = useRouter();

  const { control, handleSubmit, reset } = useForm({
    values: {
      nickname: user?.nickname || "",
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
      const res = await fetch(`/api/user?uid=${user?.uid}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "注销失败");
      }

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
      reset({ oldPassword: "", newPassword: "", nickname: user?.nickname || "" });
    } catch (err) {
      toast.danger(`修改密码失败: ${(err as Error).message}`);
    }
  };

  const handleUpdateNickname = async (data: { nickname: string }) => {
    if (!user?.uid) return;
    try {
      const res = await updateUser(user.uid, { ...user, nickname: data.nickname } as UserPlain);
      setUser(res);
      setSetting(res.setting);
      toast.success("昵称已更新");
    } catch (err) {
      toast.danger(`更新失败: ${(err as Error).message}`);
    }
  };

  return (
    <div className="flex justify-center pb-8">
      <div className="w-full max-w-md">
        {/* 头像与基本信息 */}
        <div className="text-center mt-8 mb-8">
          <div className="w-20 h-20 rounded-full bg-surface mx-auto flex items-center justify-center text-3xl font-bold text-muted">
            {user?.name?.toUpperCase()?.slice(0, 1) || user?.email?.toUpperCase()?.slice(0, 2)}
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-bold">{user?.name || "未命名用户"}</h1>
            <p className="text-sm text-muted mt-1">{user?.email}</p>
          </div>
        </div>

        {/* 修改昵称 */}
        <section>
          <h2 className="font-bold mb-4 text-sm">基本信息</h2>
          <form onSubmit={handleSubmit(handleUpdateNickname)}>
            <Controller
              name="nickname"
              control={control}
              render={({ field }) => (
                <div className="flex flex-nowrap items-center my-2">
                  <Label className="w-14 inline-block">昵称</Label>
                  <Input {...field} placeholder="设置昵称" />
                  <Button type="submit" size="sm" className="ml-2">保存</Button>
                </div>
              )}
            />
          </form>
        </section>

        <hr className="my-6 border-border" />

        {/* 修改密码 */}
        <section>
          <h2 className="font-bold mb-4 text-sm">修改密码</h2>
          <form onSubmit={handleSubmit(handleChangePassword)}>
            <Controller
              name="oldPassword"
              control={control}
              rules={{ required: "请输入旧密码" }}
              render={({ field, fieldState }) => (
                <div className="flex flex-nowrap items-center my-2">
                  <Label className="w-14 inline-block">旧密码</Label>
                  <Input {...field} type="password" placeholder="输入旧密码" />
                  {fieldState.error && (
                    <p className="text-sm text-red-500 mt-1">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              name="newPassword"
              control={control}
              rules={{ required: "请输入新密码", minLength: { value: 6, message: "密码至少6位" } }}
              render={({ field, fieldState }) => (
                <div className="flex flex-nowrap items-center my-2">
                  <Label className="w-14 inline-block">新密码</Label>
                  <Input {...field} type="password" placeholder="输入新密码（至少6位）" />
                  {fieldState.error && (
                    <p className="text-sm text-red-500 mt-1">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
            <div className="mt-4 text-center">
              <Button type="submit" variant="secondary">修改密码</Button>
            </div>
          </form>
        </section>

        <hr className="my-6 border-border" />

        {/* 危险操作 */}
        <section>
          <h2 className="font-bold mb-4 text-sm text-danger">危险区域</h2>
          <div className="flex flex-col gap-4">
            <Confirm
              title="退出登录"
              content="确定要退出当前账户吗？"
              confirmText="退出"
              variant="danger"
              onConfirmAction={handleLogout}
            >
              <Button variant="danger" className="w-full justify-start">
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
              <Button variant="danger" className="w-full justify-start">
                <TrashBin width={16} height={16} />
                <span className="ml-2">注销账户</span>
              </Button>
            </Confirm>
          </div>
        </section>
      </div>
    </div>
  );
}
