"use client";
import { changePassword, deleteUserByUid, updateUser, uploadPhoto, createPhoto, genSrc } from "@/app/api";
import { Confirm } from "@/app/components";
import { settingAtom, tokenAtom, userAtom } from "@/app/store";
import { UserPlain } from "@/app/typings";
import { ArrowRightFromSquare, TrashBin, PersonPencil } from "@gravity-ui/icons";
import { Button, Input, Label, toast } from "@heroui/react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { createAvatar } from "@dicebear/core";
import { micah } from "@dicebear/collection";

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    img.onload = () => { resolve(img); URL.revokeObjectURL(url); };
    img.onerror = () => { reject(new Error("Failed to load image")); URL.revokeObjectURL(url); };
  });
}

function getScaledDimensions(w: number, h: number, maxW: number, maxH: number) {
  if (w <= maxW && h <= maxH) return { width: w, height: h };
  const ratio = Math.min(maxW / w, maxH / h);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

async function resizeImage(file: File, maxW: number, maxH: number, quality: number): Promise<File> {
  const img = await loadImage(file);
  const { width, height } = getScaledDimensions(img.width, img.height, maxW, maxH);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((resolve) => {
    canvas.toBlob((b) => {
      resolve(new File([b!], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
    }, "image/jpeg", quality);
  });
}

async function svgToFile(svgStr: string, filename: string): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const img = new Image();
  const blob = new Blob([svgStr], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  img.src = url;
  await new Promise<void>((resolve) => { img.onload = () => resolve(); });
  ctx.drawImage(img, 0, 0, 512, 512);
  URL.revokeObjectURL(url);
  return new Promise((resolve) => {
    canvas.toBlob((b) => {
      resolve(new File([b!], filename, { type: "image/jpeg" }));
    }, "image/jpeg", 0.85);
  });
}

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

  // 头像
  const [avatarSeed, setAvatarSeed] = useState<string | null>(null);

  useEffect(() => {
    setAvatarSeed(Math.random().toString(36).slice(2, 10));
  }, []);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAvatarSrc = user?.avatar ? genSrc(user.avatar) : null;

  const avatarList = useMemo(() => {
    if (!avatarSeed) return [];
    return Array.from({ length: 16 }, (_, i) => {
      const seed = `${avatarSeed}-${i}`;
      return createAvatar(micah, { seed, size: 128 }).toDataUri();
    });
  }, [avatarSeed]);

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const handleRefreshAvatars = useCallback(() => {
    setAvatarSeed(Math.random().toString(36).slice(2, 10));
    setSelectedIndex(null);
    setSelectedFile(null);
    setFilePreview(null);
  }, []);

  const handleSelectSystem = useCallback((index: number) => {
    setSelectedIndex(index);
    setSelectedFile(null);
    setFilePreview(null);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedIndex(null);
      setFilePreview(URL.createObjectURL(file));
    }
    e.target.value = "";
  }, []);

  const handleSaveAvatar = useCallback(async () => {
    if (!user?.uid) return;
    setSavingAvatar(true);
    try {
      let file: File;
      if (selectedFile) {
        file = await resizeImage(selectedFile, 512, 512, 0.85);
      } else if (selectedIndex !== null) {
        const seed = `${avatarSeed}-${selectedIndex}`;
        const svgStr = createAvatar(micah, { seed, size: 512 }).toString();
        file = await svgToFile(svgStr, `avatar_${seed}.jpg`);
      } else {
        toast.warning("请先选择一个头像");
        setSavingAvatar(false);
        return;
      }
      const { src } = await uploadPhoto(file);
      const avatarSrc = `local:${src}`;
      await createPhoto({
        title: `avatar_${Date.now()}`,
        src: avatarSrc,
        type: "avatar",
        isPublic: false,
        isSelected: false,
      });
      const updated = await updateUser(user.uid, { avatar: avatarSrc });
      setUser(updated);
      setSelectedIndex(null);
      setSelectedFile(null);
      setFilePreview(null);
      toast.success("头像已更新");
    } catch (err) {
      toast.danger(`保存头像失败: ${(err as Error).message}`);
    } finally {
      setSavingAvatar(false);
    }
  }, [user?.uid, selectedFile, selectedIndex, avatarSeed, setUser]);

  const avatarPreview = filePreview || (selectedIndex !== null ? avatarList[selectedIndex] : null);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-muted">个人资料</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">账户信息</h1>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative size-20 shrink-0">
            {avatarPreview || currentAvatarSrc ? (
              <img
                src={avatarPreview || currentAvatarSrc || ""}
                className="size-20 rounded-full object-cover"
                alt="avatar"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full bg-muted/10 text-3xl font-bold text-muted">
                {initial}
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-foreground">{user?.nickname || user?.name || "未命名用户"}</h2>
            <p className="text-sm text-muted">{user?.email}</p>
            <p className="mt-1 text-xs text-muted">@{user?.name}</p>
          </div>
        </div>

        <hr className="my-6 border-border" />

        <h3 className="text-sm font-semibold text-foreground mb-4">选择头像</h3>

        {avatarList.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-4">
            {avatarList.map((dataUri, i) => (
              <button
                key={i}
                onClick={() => handleSelectSystem(i)}
                className={`rounded-full overflow-hidden size-16 ring-2 transition-all cursor-pointer ${
                  selectedIndex === i && !selectedFile
                    ? "ring-primary scale-110"
                    : "ring-transparent hover:ring-muted"
                }`}
              >
                <img src={dataUri} alt={`avatar ${i + 1}`} className="size-full" />
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 flex-wrap items-center">
          <Button size="sm" variant="ghost" onPress={handleRefreshAvatars}>
            刷新头像
          </Button>
          <Button size="sm" variant="ghost" onPress={() => fileInputRef.current?.click()}>
            上传图片
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileSelect}
          />
          {selectedFile && <span className="text-xs text-muted truncate max-w-32">{selectedFile.name}</span>}
          <Button size="sm" variant="primary" onPress={handleSaveAvatar} isDisabled={savingAvatar}>
            保存头像
          </Button>
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
