"use client";
import { Input, Select, ListBox, Button } from "@heroui/react";
import { Controller, useForm } from "react-hook-form";
import { settingAtom } from "@/app/store";
import { useAtom } from "jotai";
import { Setting } from "@/app/typings";

export default function Default({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [setting, setSetting] = useAtom(settingAtom);

  const { control, handleSubmit } = useForm({
    values: { ...setting },
  });

  const submit = (data: Setting) => {
    setSetting(data);
  };

  return (
    <div className="flex justify-center">
      <form onSubmit={handleSubmit(submit)}>
        <Controller
          name="theme"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <SettingItem label="系统主题">
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
            <SettingItem label="显示语言">
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
            <SettingItem label="照片存储库">
              <Select {...field} className="w-44">
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="tecent" textValue="tecent">
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
            <SettingItem label="存储目录">
              <Input {...field} />
            </SettingItem>
          )}
        />
        <Controller
          name="upload.secretId"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <SettingItem label="Secret ID">
              <Input {...field} />
            </SettingItem>
          )}
        />
        <Controller
          name="upload.secretKey"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <SettingItem label="Secret Key">
              <Input {...field} />
            </SettingItem>
          )}
        />
        <Controller
          name="upload.region"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <SettingItem label="Region">
              <Input {...field} />
            </SettingItem>
          )}
        />
        <Controller
          name="upload.bucket"
          control={control}
          rules={{ required: false }}
          render={({ field }) => (
            <SettingItem label="Bucket">
              <Input {...field} />
            </SettingItem>
          )}
        />
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
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center my-2">
      <span className="inline-block w-24 min-w-24">{label}</span>
      <span className="ml-4">{children}</span>
    </div>
  );
}
