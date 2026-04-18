"use client";

import { Check } from "@gravity-ui/icons";
import { Button, Card, Header, Input, InputOTP, Label, toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { registerUser, sendVerifyCode } from "../api";

interface RegisterFormData {
  email: string;
  password: string;
  verifyCode: string;
}

export default function Basic() {
  const router = useRouter();

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
    const register = async () => {
      try {
        await registerUser(data.email, data.password, data.verifyCode);
      } catch (error) {
        throw error;
      }
    }

    register().then(() => {
      toast.success("注册成功！正在跳转到登录页...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }).catch((error) => {
      toast.danger(`注册失败: ${error.message || "未知错误"}`);
    });
  };

  return (
    <Card className="inline-block p-8">
      <Header className="text-2xl text-center font-bold">注册用户</Header>
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
                <Button variant="secondary" className="ml-4" onClick={() => {
                  toast.promise(sendVerifyCode(getValues("email")), {
                    loading: "正在发送验证码...",
                    success: "验证码已发送，请检查邮箱",
                    error: "发送验证码失败，请稍后再试",
                  })
                }}>发送验证码</Button>
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
        <Controller
          name="verifyCode"
          control={control}
          defaultValue=""
          rules={{ required: "请输入验证码", minLength: { value: 6, message: "验证码必须是6位" }, maxLength: { value: 6, message: "验证码必须是6位" } }}
          render={({ field }) => (
            <div className="flex flex-col gap-2 text-center mt-8 items-center">
              <div className="flex flex-col gap-1">
                <Label>请输入验证码</Label>
                <p className="text-sm text-muted">验证码已经发送至邮箱 {getValues("email")}</p>
              </div>
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
              <p className="text-sm text-red-500 mt-1 h-5">{errors.verifyCode?.message}</p>
              <div className="flex items-center gap-[5px] px-1 pt-1 justify-center">
                <p className="text-sm text-muted">未收到邮件?</p>
                <Button className="" variant="ghost">
                  重新发送邮件
                </Button>
              </div>
            </div>
          )}
        />
        <div className="text-center">
          <Button type="submit" className="mt-8"><Check />点击注册</Button>
        </div>
      </form>
    </Card>
  );
}