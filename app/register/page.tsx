"use client";

import { Check } from "@gravity-ui/icons";
import { Button, Input, InputOTP, Label, toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { registerUser, sendVerifyCode } from "../api";
import { useEffect, useRef } from "react";

interface RegisterFormData {
  email: string;
  password: string;
  verifyCode: string;
}

export default function Basic() {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const defaultUser: RegisterFormData = {
    email: "",
    password: "",
    verifyCode: "",
  }

  const { handleSubmit, control, getValues, formState: { errors } } = useForm<RegisterFormData>({
    values: {
      email: defaultUser?.email || "",
      password: defaultUser?.password || "",
      verifyCode: "",
    },
  });

  const submit = (data: RegisterFormData) => {
    registerUser(data.email, data.password, data.verifyCode).then(() => {
      toast.success("注册成功！正在跳转到登录页...");
      timeoutRef.current = setTimeout(() => {
        router.push("/login");
      }, 2000);
    }).catch((error) => {
      toast.danger(`注册失败: ${error.message || "未知错误"}`);
    });
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-sm">
      <h1 className="text-center text-2xl font-bold text-foreground">注册用户</h1>
      <p className="mt-2 text-center text-sm text-muted">输入邮箱和验证码以创建账户</p>
      <form onSubmit={handleSubmit(submit)} className="mt-8 space-y-5">
        <Controller
          name="email"
          control={control}
          defaultValue=""
          rules={{ required: "请输入邮箱", pattern: { value: /^\S+@\S+$/i, message: "请输入有效的邮箱地址" } }}
          render={({ field }) => (
            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-foreground">邮箱</label>
              <div className="flex gap-2">
                <Input id="email" {...field} placeholder="your@email.com" className="flex-1" />
                <Button variant="secondary" onPress={() => {
                  toast.promise(sendVerifyCode(getValues("email")), {
                    loading: "正在发送验证码...",
                    success: "验证码已发送，请检查邮箱",
                    error: "发送验证码失败，请稍后再试",
                  })
                }}>发送验证码</Button>
              </div>
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
              <Input id="password" type="password" {...field} placeholder="········" className="w-full" />
              <p className="mt-1 text-xs text-danger h-4">{errors.password?.message}</p>
            </div>
          )}
        />
        <Controller
          name="verifyCode"
          control={control}
          defaultValue=""
          rules={{ required: "请输入验证码", minLength: { value: 6, message: "验证码必须是6位" }, maxLength: { value: 6, message: "验证码必须是6位" } }}
          render={({ field }) => (
            <div className="space-y-3">
              <Label className="block text-sm text-foreground">请输入验证码</Label>
              <p className="text-xs text-muted">验证码已发送至 {getValues("email")}</p>
              <div className="flex justify-center gap-1">
                <InputOTP maxLength={6} {...field}>
                  <InputOTP.Group>
                    <InputOTP.Slot index={0} />
                    <InputOTP.Slot index={1} />
                    <InputOTP.Slot index={2} />
                  </InputOTP.Group>
                  <InputOTP.Separator />
                  <InputOTP.Group>
                    <InputOTP.Slot index={3} />
                    <InputOTP.Slot index={4} />
                    <InputOTP.Slot index={5} />
                  </InputOTP.Group>
                </InputOTP>
              </div>
              <p className="text-xs text-danger h-4 text-center">{errors.verifyCode?.message}</p>
              <div className="flex items-center justify-center gap-1">
                <p className="text-xs text-muted">未收到邮件?</p>
                <Button variant="ghost" size="sm" onPress={() => {
                  toast.promise(sendVerifyCode(getValues("email")), {
                    loading: "正在重新发送验证码...",
                    success: "验证码已重新发送",
                    error: "发送失败，请稍后再试",
                  });
                }}>
                  重新发送
                </Button>
              </div>
            </div>
          )}
        />
        <Button type="submit" className="w-full"><Check />点击注册</Button>
      </form>
    </div>
  );
}