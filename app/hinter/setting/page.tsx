"use client";
import { Input, Select, ListBox, Button, toast } from "@heroui/react";
import { Controller, useForm } from "react-hook-form";
import { settingAtom, userAtom } from "@/app/store";
import { useAtom } from "jotai";
import { Setting } from "@/app/typings";
import { updateUser } from "@/app/api";
import { useState } from "react";
import { Gear, Picture } from "@gravity-ui/icons";

export default function SettingPage() {
  const [setting, setSetting] = useAtom(settingAtom);
  const [user, setUser] = useAtom(userAtom);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit } = useForm({
    values: { ...setting },
  });

  const submit = async (data: Setting) => {
    setSaving(true);
    setSetting(data);
    if (user?.uid) {
      try {
        const res = await updateUser(user.uid, { ...user, setting: data });
        toast.success("设置已保存");
        setUser(res);
        setSetting(res.setting);
      } catch (err) {
        toast.danger(`保存设置失败: ${(err as Error).message}`);
      }
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-muted">杂项</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">界面与存储首选项</h1>
        <p className="mt-2 text-sm text-muted">调整界面主题、语言及照片存储方式。</p>
      </section>

      <form onSubmit={handleSubmit(submit)} className="space-y-6">
        <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Gear width={18} height={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground">外观</h2>
              <p className="text-sm text-muted">主题与语言设置</p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <Controller
              name="theme"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <SettingItem label="系统主题" description="跟随系统、深色模式或浅色模式">
                  <Select {...field} className="w-full max-w-lg">
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item id="system" textValue="system">
                          跟随系统
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item id="dark" textValue="dark">
                          深色模式
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item id="light" textValue="light">
                          浅色模式
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </SettingItem>
              )}
            />

            <Controller
              name="language"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <SettingItem label="显示语言" description="选择界面显示语言">
                  <Select {...field} className="w-full max-w-lg">
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item id="en" textValue="en">
                          英文
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item id="zh-cn" textValue="zh-cn">
                          中文简体
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item id="fr" textValue="fr">
                          法语
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </SettingItem>
              )}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-success/10 text-success">
              <Picture width={18} height={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground">存储</h2>
              <p className="text-sm text-muted">照片存储方式与目录配置</p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <Controller
              name="upload.type"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <SettingItem label="照片存储库" description="腾讯云对象存储或服务器端存储">
                  <Select {...field} className="w-full max-w-lg">
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item id="tencent" textValue="tencent">
                          腾讯云对象存储
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item id="local" textValue="local">
                          服务器端
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </SettingItem>
              )}
            />

            <Controller
              name="upload.dir"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <SettingItem label="存储目录" description="照片在存储库中的目录前缀">
                  <Input {...field} className="w-full max-w-lg" placeholder="/upload" />
                </SettingItem>
              )}
            />
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" isDisabled={saving}>保存设置</Button>
        </div>
      </form>
    </div>
  );
}

function SettingItem({
  label,
  children,
  description,
}: {
  label: string;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}
