"use client";

import { Check } from "@gravity-ui/icons";
import { Button, Card, Header, Input, toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { signToken } from "../api";
import { useSetAtom } from "jotai";
import { tokenAtom, userAtom } from "../store";

interface RegisterFormData {
  email: string;
  password: string;
}

export default function Basic() {
  const setToken = useSetAtom(tokenAtom);
  const setUser = useSetAtom(userAtom);

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

      toast.success("登录成功！正在跳转到管理页面...");

      setTimeout(() => {
        router.push("/hinter");
      }, 2000);

    }).catch((error) => {
      toast.danger(`登录失败`);
      throw new Error(`登录失败: ${error}`);
    });
  };

  return (
    <Card className="inline-block p-8">
      <Header className="text-2xl text-center font-bold">登录</Header>
      <form onSubmit={handleSubmit(submit)} className="mt-8">
        <Controller
          name="email"
          control={control}
          defaultValue=""
          rules={{ required: "请输入邮箱", pattern: { value: /^\S+@\S+$/i, message: "请输入有效的邮箱地址" } }}
          render={({ field }) => (
            <div>
              <div className="flex flex-nowrap mb-2 items-center">
                <label htmlFor="email" className="w-12 inline-block">
                  邮箱
                </label>
                <Input id="email" {...field} aria-invalid={errors.email ? "true" : "false"} />
              </div>
              <p className="text-sm text-red-500 mt-1 h-5">{errors.email?.message}</p>
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
              <div className="flex flex-nowrap mb-2 items-center">
                <label htmlFor="password" className="w-12 inline-block">
                  密码
                </label>
                <Input id="password" type="password" {...field} />
              </div>
              <p className="text-sm text-red-500 mt-1 h-5">{errors.password?.message}</p>
            </div>
          )}
        />

        <div className="text-center">
          <Button type="submit" className="mt-8"><Check />登录</Button>
        </div>
      </form>
    </Card>
  );
}