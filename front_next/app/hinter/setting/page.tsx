"use client";
import { Input, Select, ListBox, Button, toast } from "@heroui/react";
import { Controller, set, useForm } from "react-hook-form";
import { settingAtom, userAtom } from "@/app/store";
import { useAtom } from "jotai";
import { Setting } from "@/app/typings";
import { updateUser } from "@/app/api";

export default function Default({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [setting, setSetting] = useAtom(settingAtom);
  const [user, setUser] = useAtom(userAtom);

  const { control, handleSubmit, watch } = useForm({
    values: { ...setting },
  });

  const submit = (data: Setting) => {
    setSetting(data);
    if (user?.uid) {
      updateUser(user.uid, { ...user, setting: data }).then((res) => {
        toast.success("设置已保存");
        setUser(res);
        setSetting(res.setting);
      }).catch(err => {
        toast.danger(`保存设置失败: ${err.message}`);
      });
    }
  };

  return (
    <div className="flex justify-center">
      <form onSubmit={handleSubmit(submit)}>
        <Controller
          name="theme"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <SettingItem label="系统主题" description="选择系统主题: 跟随系统、深色模式或浅色模式">
              <Select {...field} className="w-44">
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
              <Select {...field} className="w-44">
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
            <SettingItem label="照片存储库" description="选择照片存储方式: 腾讯云对象存储或服务器端">
              <Select {...field} className="w-44">
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
              <Input {...field} />
            </SettingItem>
          )}
        />
        {
          watch("upload.type") === "tencent" && (<>
            <Controller
              name="upload.secretId"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <SettingItem label="Secret ID" description="对象存储的 Secret ID">
                  <Input {...field} />
                </SettingItem>
              )}
            />
            <Controller
              name="upload.secretKey"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <SettingItem label="Secret Key" description="对象存储的 Secret Key">
                  <Input {...field} />
                </SettingItem>
              )}
            />
            <Controller
              name="upload.region"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <SettingItem label="Region" description="对象存储的地域信息，例如 'ap-guangzhou'">
                  <Input {...field} />
                </SettingItem>
              )}
            />
            <Controller
              name="upload.bucket"
              control={control}
              rules={{ required: false }}
              render={({ field }) => (
                <SettingItem label="Bucket" description="对象存储的 Bucket 名称，如果不填则使用默认 Bucket">
                  <Input {...field} />
                </SettingItem>
              )}
            /></>)
        }
        <div className="flex justify-center mt-4">
          <Button type="submit">保存设置</Button>
        </div>
      </form>
    </div>
  );
}

function SettingItem({
  label,
  children,
  description
}: {
  label: string;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="my-2 mb-4">
      <div className="flex items-center">
        <span className="inline-block w-24 min-w-24">{label}</span>
      <span className="ml-4">{children}</span>
      </div>
      <div className="text-xs font-light text-muted">{description}</div>
    </div>
  );
}
