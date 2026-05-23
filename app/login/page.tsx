"use client";

import { Check } from "@gravity-ui/icons";
import { Button, Input, toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { signToken } from "../api";
import { useSetAtom } from "jotai";
import { tokenAtom, userAtom, settingAtom } from "../store";

interface RegisterFormData {
  email: string;
  password: string;
}

export default function Basic() {
  const setToken = useSetAtom(tokenAtom);
  const setUser = useSetAtom(userAtom);
  const setSetting = useSetAtom(settingAtom);

  const router = useRouter();

  const defaultUser: RegisterFormData = {
    email: "",
    password: "",
  }

  const { handleSubmit, control, formState: { errors } } = useForm<RegisterFormData>({
    values: {
      email: defaultUser?.email || "",
      password: defaultUser?.password || "",
    },
  });

  const submit = (data: RegisterFormData) => {
    signToken(data.email, data.password).then((res) => {
      if (!res.token) {
        toast.danger("登录失败: 未收到令牌");
        throw new Error("登录失败: 未收到令牌");
      }

      setToken(res.token);
      setUser(res.user);
      setSetting(res.user.setting);

      toast.success("登录成功！正在跳转到管理页面...");

      setTimeout(() => {
        router.push("/hinter");
      }, 2000);

    }).catch((error) => {
      toast.danger(`登录失败: ${error.message || "未知错误"}`);
    });
    return false;
  };

  return (
    <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 shadow-sm">
      <h1 className="text-center text-2xl font-bold text-foreground">登录</h1>
      <p className="mt-2 text-center text-sm text-muted">输入邮箱和密码以继续</p>
      <form onSubmit={handleSubmit(submit)} className="mt-8 space-y-5">
        <Controller
          name="email"
          control={control}
          defaultValue=""
          rules={{ required: "请输入邮箱", pattern: { value: /^\S+@\S+$/i, message: "请输入有效的邮箱地址" } }}
          render={({ field }) => (
            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-foreground">邮箱</label>
              <Input id="email" {...field} placeholder="your@email.com" />
              <p className="mt-1 text-xs text-danger h-4">{errors.email?.message}</p>
            </div>
          )}
        />
        <Controller
          name="password"
          control={control}
          defaultValue=""
          rules={{ required: "请输入密码", minLength: { value: 8, message: "密码至少需要8个字符" } }}
          render={({ field }) => (
            <div>
              <label htmlFor="password" className="mb-1 block text-sm text-foreground">密码</label>
              <Input id="password" type="password" {...field} placeholder="········" />
              <p className="mt-1 text-xs text-danger h-4">{errors.password?.message}</p>
            </div>
          )}
        />

        <Button type="submit" className="w-full"><Check />登录</Button>
      </form>
    </div>
  );
}