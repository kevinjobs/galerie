"use client";
import { Input, Select, ListBox, Button, toast } from "@heroui/react";
import { Controller, useForm } from "react-hook-form";
import { settingAtom, userAtom } from "@/app/store";
import { useAtom } from "jotai";
import { Setting } from "@/app/typings";
import { updateUser } from "@/app/api";

export default function Default() {
  const [setting, setSetting] = useAtom(settingAtom);
  const [user, setUser] = useAtom(userAtom);

  const { control, handleSubmit } = useForm({
    values: { ...setting },
  });

  const submit = (data: Setting) => {
    setSetting(data);
    if (user?.uid) {
      updateUser(user.uid, { ...user, setting: data })
        .then((res) => {
          toast.success("设置已保存");
          setUser(res);
          setSetting(res.setting);
        })
        .catch((err) => {
          toast.danger(`保存设置失败: ${err.message}`);
        });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <main className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.24em] text-muted">杂项</p>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">界面与存储首选项</h1>
            <p className="mt-2 text-sm text-muted">调整界面主题、语言及照片存储方式。</p>
          </div>

          <form onSubmit={handleSubmit(submit)} className="space-y-6">
            <Controller
              name="theme"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <SettingItem label="系统主题" description="选择系统主题: 跟随系统、深色模式或浅色模式">
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

            <Controller
              name="upload.type"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <SettingItem label="照片存储库" description="选择照片存储方式: 腾讯云对象存储或服务器端存储">
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
                <SettingItem label="存储目录" description="设置照片在存储库中的目录前缀，默认为 '/upload'">
                  <Input {...field} className="w-full max-w-lg" />
                </SettingItem>
              )}
            />

            <div className="flex justify-end pt-4 border-t border-border">
              <Button type="submit">保存设置</Button>
            </div>
          </form>
        </main>
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
    <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)] items-start">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description ? <div className="mt-2 text-sm text-muted">{description}</div> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}
