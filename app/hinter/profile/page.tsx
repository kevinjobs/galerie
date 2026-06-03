"use client";
import { changePassword, deleteUserByUid, updateUser, uploadPhoto, createPhoto, genSrc, createApiToken, getApiTokens, deleteApiToken } from "@/app/api";
import { Confirm, Modal } from "@/app/components";
import { settingAtom, tokenAtom, userAtom } from "@/app/store";
import { UserPlain } from "@/app/typings";
import { ArrowRightFromSquare, TrashBin, PersonPencil, Key, Copy, Check, ArrowsRotateLeft, Xmark } from "@gravity-ui/icons";
import { Button, Input, Label, toast, Checkbox, Select, ListBox } from "@heroui/react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { createAvatar } from "@dicebear/core";
import { micah } from "@dicebear/collection";
import { uploadToCOS } from "../utils";

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
  const ratio = Math.min(maxW / w, maxW / h);
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

const permissionOptions = [
  { value: "photo.upload", label: "上传" },
  { value: "photo.get", label: "读取" },
  { value: "photo.create", label: "创建" },
  { value: "photo.update", label: "更新" },
  { value: "photo.delete", label: "删除" },
];

const expiresInOptions: { label: string; value: "7d" | "30d" | "1y" | "never" }[] = [
  { label: "7 天", value: "7d" },
  { label: "30 天", value: "30d" },
  { label: "1 年", value: "1y" },
  { label: "永不过期", value: "never" },
];

function formatDate(date: Date | null): string {
  if (!date) return "永不过期";
  return new Date(date).toLocaleDateString("zh-CN");
}

function truncateToken(token: string, visible = 8): string {
  return `${token.slice(0, visible)}...${token.slice(-visible)}`;
}

export default function ProfilePage() {
  const [user, setUser] = useAtom(userAtom);
  const [token, setToken] = useAtom(tokenAtom);
  const [setting, setSetting] = useAtom(settingAtom);
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

  // API Token 表单
  const {
    control: tokenControl,
    handleSubmit: tokenFormSubmit,
    reset: resetTokenForm,
    watch: watchTokenForm,
    setValue: setTokenFormValue,
  } = useForm({
    values: {
      name: "",
      permissions: [] as string[],
      expiresIn: "7d" as "7d" | "30d" | "1y" | "never",
    },
  });

  // 头像
  const [avatarSeed, setAvatarSeed] = useState<string | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

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
      let avatarSrc: string;
      if (setting?.upload?.type === "tencent") {
        avatarSrc = await new Promise<string>((resolve, reject) => {
          uploadToCOS(file, (src) => resolve(src), undefined, setting?.upload).catch(reject);
        });
      } else {
        const { src } = await uploadPhoto(file);
        avatarSrc = `local:${src}`;
      }
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
      setIsAvatarModalOpen(false);
      toast.success("头像已更新");
    } catch (err) {
      toast.danger(`保存头像失败: ${(err as Error).message}`);
    } finally {
      setSavingAvatar(false);
    }
  }, [user?.uid, selectedFile, selectedIndex, avatarSeed, setUser, setting]);

  const avatarPreview = filePreview || (selectedIndex !== null ? avatarList[selectedIndex] : null);

  // API Token 相关状态
  const [apiTokens, setApiTokens] = useState<Array<{ uid: string; name: string; permissions: string[]; expiresAt: string | null; createdAt: string; lastUsedAt: string | null }>>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [creatingToken, setCreatingToken] = useState(false);
  const [createdTokenValue, setCreatedTokenValue] = useState<string | null>(null);
  const [showTokenFormModal, setShowTokenFormModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const loadApiTokens = useCallback(async () => {
    setLoadingTokens(true);
    try {
      const tokens = await getApiTokens();
      setApiTokens(tokens);
    } catch (err) {
      toast.danger(`加载 API Token 列表失败: ${(err as Error).message}`);
    } finally {
      setLoadingTokens(false);
    }
  }, []);

  useEffect(() => {
    if (user?.permissions) {
      loadApiTokens();
    }
  }, [user?.permissions]);

  const handleTokenSubmit = async (data: { name: string; permissions: string[]; expiresIn: "7d" | "30d" | "1y" | "never" }) => {
    if (data.permissions.length === 0) {
      toast.warning("请至少选择一个权限");
      return;
    }
    setCreatingToken(true);
    try {
      const result = await createApiToken({
        name: data.name,
        permissions: data.permissions,
        expiresIn: data.expiresIn,
      });
      setShowTokenFormModal(false);
      setCreatedTokenValue(result.token);
      setShowTokenModal(true);
      resetTokenForm();
      await loadApiTokens();
    } catch (err) {
      toast.danger(`创建 API Token 失败: ${(err as Error).message}`);
    } finally {
      setCreatingToken(false);
    }
  };

  const handleRevokeToken = async (uid: string) => {
    try {
      await deleteApiToken(uid);
      await loadApiTokens();
      toast.success("Token 已撤销");
    } catch (err) {
      toast.danger(`撤销 Token 失败: ${(err as Error).message}`);
    }
  };

  const handleCloseTokenModal = useCallback(() => {
    setShowTokenModal(false);
    setCreatedTokenValue(null);
  }, []);

  const handleCopyToken = useCallback(async () => {
    if (!createdTokenValue) return;
    await navigator.clipboard.writeText(createdTokenValue);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }, [createdTokenValue]);

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

  const selectedPermissions = watchTokenForm("permissions");
  const hasUserPermissions = user?.permissions && user.permissions.length > 0;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-background p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-muted">个人资料</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">账户信息</h1>
      </section>

      <section className="rounded-3xl bg-background p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <button
            className="relative size-20 shrink-0 cursor-pointer group"
            onClick={() => setIsAvatarModalOpen(true)}
          >
            {currentAvatarSrc ? (
              <img
                src={currentAvatarSrc}
                className="size-20 rounded-full object-cover"
                alt="avatar"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full bg-muted/10 text-3xl font-bold text-muted">
                {initial}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <PersonPencil width={20} height={20} className="text-white" />
            </div>
          </button>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-foreground">{user?.nickname || user?.name || "未命名用户"}</h2>
            <p className="text-sm text-muted">{user?.email}</p>
            <p className="mt-1 text-xs text-muted">@{user?.name}</p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2"
              onPress={() => setIsAvatarModalOpen(true)}
            >
              更换头像
            </Button>
          </div>
        </div>
      </section>

      {/* 头像选择弹出层 */}
      <Modal isOpen={isAvatarModalOpen} onChangeAction={setIsAvatarModalOpen} size="lg" title="选择头像">
        <div className="p-6">
          {avatarPreview && (
            <div className="flex justify-center mb-4">
              <img
                src={avatarPreview}
                className="size-24 rounded-full object-cover ring-2 ring-primary"
                alt="preview"
              />
            </div>
          )}

          {avatarList.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mb-4">
              {avatarList.map((dataUri, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectSystem(i)}
                  className={`rounded-full overflow-hidden size-16 ring-2 transition-all cursor-pointer ${selectedIndex === i && !selectedFile
                    ? "ring-primary scale-110"
                    : "ring-transparent hover:ring-muted"
                    }`}
                >
                  <img src={dataUri} alt={`avatar ${i + 1}`} className="size-full" />
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3 flex-wrap items-center justify-between">
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
            </div>
            <div className="flex gap-3">
              <Button size="sm" variant="secondary" onPress={() => setIsAvatarModalOpen(false)}>
                取消
              </Button>
              <Button size="sm" variant="primary" onPress={handleSaveAvatar} isDisabled={savingAvatar}>
                {savingAvatar ? "保存中..." : "保存头像"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <section className="rounded-3xl bg-background p-6">
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
                  <Input {...field} placeholder="设置昵称" className="w-full" />
                </div>
                <Button type="submit" >保存</Button>
              </div>
            )}
          />
        </form>
      </section>

      <section className="rounded-3xl bg-background p-6">
        <h2 className="text-base font-semibold text-foreground">修改密码</h2>
        <form onSubmit={handlePasswordSubmit(handleChangePassword)} className="mt-4 space-y-4">
          <Controller
            name="oldPassword"
            control={passwordControl}
            rules={{ required: "请输入旧密码" }}
            render={({ field, fieldState }) => (
              <div>
                <Label className="mb-1 block text-sm">旧密码</Label>
                <Input {...field} type="password" placeholder="输入旧密码" className="w-full" />
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
                <Input {...field} type="password" placeholder="输入新密码（至少6位）" className="w-full" />
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

      <section className="rounded-3xl bg-background p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Key width={18} height={18} />
          API 令牌
        </h2>
        <p className="mt-1 text-sm text-muted">生成令牌用于第三方工具或脚本访问 API。令牌权限必须是你当前权限的子集。</p>

        {/* 创建令牌表单 */}
        <div className="flex justify-end">
          <Button onPress={() => setShowTokenFormModal(true)} variant="primary">
            创建令牌
          </Button>
        </div>

        {/* 令牌列表 */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">已生成的令牌</h3>
            <Button size="sm" variant="ghost" onPress={loadApiTokens} isDisabled={loadingTokens}>
              <ArrowsRotateLeft width={14} height={14} />
            </Button>
          </div>

          {loadingTokens ? (
            <p className="text-sm text-muted">加载中...</p>
          ) : apiTokens.length === 0 ? (
            <p className="text-sm text-muted">暂无令牌</p>
          ) : (
            <div className="space-y-2">
              {apiTokens.map((t) => (
                <div key={t.uid} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-xl bg-background p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{t.name}</p>
                    <p className="text-xs text-muted mt-0.5">
                      权限：{t.permissions.join(", ")} · 过期：{formatDate(t.expiresAt ? new Date(t.expiresAt) : null)}
                    </p>
                    {t.lastUsedAt && (
                      <p className="text-xs text-muted mt-0.5">最后使用：{new Date(t.lastUsedAt).toLocaleString("zh-CN")}</p>
                    )}
                  </div>
                  <Confirm
                    title="撤销令牌"
                    content={`确定要撤销 "${t.name}" 吗？此操作不可撤销。`}
                    confirmText="撤销"
                    variant="danger"
                    onConfirmAction={() => handleRevokeToken(t.uid)}
                  >
                    <Button size="sm" variant="danger">
                      撤销
                    </Button>
                  </Confirm>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-danger/20 bg-background p-6">
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
            <Button variant="secondary" className="w-full justify-start sm:w-auto border-warning/30 text-warning hover:bg-warning/10">
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
            <Button variant="danger" className="w-full justify-start sm:w-auto border-warning/30">
              <TrashBin width={16} height={16} />
              <span className="ml-2">注销账户</span>
            </Button>
          </Confirm>
        </div>
      </section>

      {/* 创建令牌弹出层 */}
      {showTokenFormModal && (
        <Modal isOpen={showTokenFormModal} onChangeAction={setShowTokenFormModal} size="lg">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">创建令牌</h3>
            <form onSubmit={tokenFormSubmit(handleTokenSubmit)} className="space-y-6">
              <div>
                <Label className="mb-1 block text-sm">令牌名称</Label>
                <Controller
                  name="name"
                  control={tokenControl}
                  rules={{ required: "请输入令牌名称" }}
                  render={({ field }) => (
                    <Input {...field} placeholder="例如：脚本上传" />
                  )}
                />
              </div>

              <div>
                <Label className="mb-1 block text-sm">过期时间</Label>
                <Controller
                  name="expiresIn"
                  control={tokenControl}
                  render={({ field }) => (
                    <Select {...field} className="w-full max-w-sm" placeholder="选择过期时间">
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {expiresInOptions.map((opt) => (
                            <ListBox.Item key={opt.value} id={opt.value} textValue={opt.label}>
                              {opt.label}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label className="mb-1 block text-sm">权限范围（仅显示你已有的权限）</Label>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {permissionOptions.map((opt) => (
                    <Checkbox
                      key={opt.value}
                      value={opt.value}
                      isSelected={selectedPermissions.includes(opt.value)}
                      onChange={(checked) => {
                        const newPerms = checked
                          ? [...selectedPermissions, opt.value]
                          : selectedPermissions.filter((p) => p !== opt.value);
                        setTokenFormValue("permissions", newPerms);
                      }}
                    >
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Content>
                        <Label className="text-sm">{opt.label}</Label>
                      </Checkbox.Content>
                    </Checkbox>
                  ))}
                </div>
                {selectedPermissions.length === 0 && (
                  <p className="mt-1 text-xs text-muted">请至少选择一个权限</p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="secondary" onPress={() => { setShowTokenFormModal(false); resetTokenForm(); }}>
                  取消
                </Button>
                <Button type="submit" isDisabled={creatingToken || selectedPermissions.length === 0} variant="primary">
                  {creatingToken ? "创建中..." : "创建令牌"}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* 令牌创建成功 Modal */}
      {showTokenModal && createdTokenValue && (
        <Modal isOpen={showTokenModal} onChangeAction={handleCloseTokenModal}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">令牌已创建</h3>
              <button onClick={() => { setShowTokenModal(false); setCreatedTokenValue(null); }}>
                <Xmark width={20} height={20} className="text-muted" />
              </button>
            </div>
            <p className="text-sm text-muted mb-3">
              这是你的令牌，请妥善保管。它只会显示这一次，关闭后将无法再次查看。
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-3">
              <code className="flex-1 text-sm font-mono break-all">{createdTokenValue}</code>
              <Button
                size="sm"
                variant="ghost"
                onPress={handleCopyToken}
                isIconOnly
              >
                {copySuccess ? <Check width={18} height={18} className="text-success" /> : <Copy width={18} height={18} />}
              </Button>
            </div>
            {copySuccess && (
              <p className="mt-1 text-xs text-success">已复制到剪贴板</p>
            )}
            <div className="mt-4 text-center">
              <Button onPress={() => { setShowTokenModal(false); setCreatedTokenValue(null); }}>
                完成
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
