"use client";
import { createUser, updateUser } from "@/app/api";
import { UserPlain } from "@/app/typings";
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Input,
  Label,
  toast,
  Select,
  ListBox,
} from "@heroui/react";
import { Controller, useForm } from "react-hook-form";
import { settingAtom, userAtom } from "@/app/store";
import { useAtom } from "jotai";

const permissionGroups = [
  {
    group: "photo",
    label: "照片",
    perms: [
      { value: "photo.upload", label: "上传" },
      { value: "photo.get", label: "读取" },
      { value: "photo.create", label: "创建" },
      { value: "photo.update", label: "更新" },
      { value: "photo.delete", label: "删除" },
    ],
  },
  {
    group: "user",
    label: "用户",
    perms: [
      { value: "user.get", label: "读取" },
      { value: "user.create", label: "创建" },
      { value: "user.update", label: "更新" },
      { value: "user.delete", label: "删除" },
    ],
  },
];

export function UserEdit({
  onSubmitAction,
  onCancelAction,
  defaultUser,
}: {
  onSubmitAction?: (data: UserPlain) => void;
  onCancelAction?: () => void;
  defaultUser?: UserPlain | null;
}) {
  const [setting] = useAtom(settingAtom);
  const [currentUser, setCurrentUser] = useAtom(userAtom);

  const { handleSubmit, control } = useForm<UserPlain>({
    values: {
      id: defaultUser?.id || -1,
      uid: defaultUser?.uid || "",
      name: defaultUser?.name || "",
      nickname: defaultUser?.nickname || undefined,
      email: defaultUser?.email || "",
      password: defaultUser?.password || undefined,
      permissions: defaultUser?.permissions || [],
      setting: defaultUser?.setting || setting || {},
    },
  });

  const submit = (data: UserPlain) => {
    if (!defaultUser?.uid) {
      createUser(data)
        .then((res) => {
          toast.success("创建成功");
          onSubmitAction?.(data);
        })
        .catch((err) => {
          toast.danger("创建失败: " + err.message);
        });
    } else {
      updateUser(defaultUser.uid, data)
        .then((res) => {
          if (res.email === currentUser?.email) {
            setCurrentUser(res);
          }
          toast.success("更新成功");
          onSubmitAction?.(data);
        })
        .catch((err) => {
          toast.danger("更新失败: " + err.message);
        });
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="px-6 py-6 overflow-x-hidden">
      <h2 className="mb-6 text-center text-2xl font-bold text-foreground">
        {defaultUser?.uid ? "编辑用户" : "新增用户"}
      </h2>

      <div className="mx-auto max-w-xl space-y-5">
        <Controller
          name="uid"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-3">
              <Label className="text-right text-sm">UID</Label>
              <Input {...field} readOnly />
            </div>
          )}
        />

        <Controller
          name="name"
          control={control}
          rules={{ required: "用户名不能为空" }}
          render={({ field }) => (
            <div className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-3">
              <Label className="text-right text-sm">用户名</Label>
              <Input {...field} placeholder="请输入用户名"  />
            </div>
          )}
        />

        {!defaultUser?.uid && (
          <Controller
            name="password"
            control={control}
            rules={{ required: "密码不能为空" }}
            render={({ field }) => (
              <div className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-3">
                <Label className="text-right text-sm">密码</Label>
                <Input {...field} type="password" placeholder="设置密码"  />
              </div>
            )}
          />
        )}

        <Controller
          name="email"
          control={control}
          rules={{ required: "邮箱不能为空" }}
          render={({ field }) => (
            <div className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-3">
              <Label className="text-right text-sm">Email</Label>
              <Input {...field} placeholder="user@example.com"  />
            </div>
          )}
        />

        <Controller
          name="nickname"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-3">
              <Label className="text-right text-sm">昵称</Label>
              <Input {...field} placeholder="可选"  />
            </div>
          )}
        />

        {defaultUser?.uid && (
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-3">
                <Label className="text-right text-sm">改密码</Label>
                <Input {...field} type="password" placeholder="留空则不修改"  />
              </div>
            )}
          />
        )}

        <Controller
          name="permissions"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3">
              <Label className="pt-1 text-right text-sm">权限</Label>
              <CheckboxGroup {...field} className="space-y-3">
                {permissionGroups.map((group) => (
                  <div key={group.group}>
                    <p className="mb-1.5 text-xs font-medium text-muted">{group.label}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {group.perms.map((perm) => (
                        <Checkbox key={perm.value} value={perm.value} >
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                          <Checkbox.Content>
                            <Label className="text-sm">{perm.label}</Label>
                          </Checkbox.Content>
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                ))}
              </CheckboxGroup>
            </div>
          )}
        />

        <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
          <p className="text-sm font-semibold text-foreground">用户设置</p>

          {/* 主题 */}
          <Controller
            name="setting.theme"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-3">
                <Label className="text-right text-sm">主题</Label>
                <Select {...field} className="w-full min-w-0">
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="system" textValue="system">跟随系统<ListBox.ItemIndicator /></ListBox.Item>
                      <ListBox.Item id="dark" textValue="dark">深色模式<ListBox.ItemIndicator /></ListBox.Item>
                      <ListBox.Item id="light" textValue="light">浅色模式<ListBox.ItemIndicator /></ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
            )}
          />

          {/* 语言 */}
          <Controller
            name="setting.language"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-3">
                <Label className="text-right text-sm">语言</Label>
                <Select {...field} className="w-full min-w-0">
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="en" textValue="en">英文<ListBox.ItemIndicator /></ListBox.Item>
                      <ListBox.Item id="zh-cn" textValue="zh-cn">中文简体<ListBox.ItemIndicator /></ListBox.Item>
                      <ListBox.Item id="fr" textValue="fr">法语<ListBox.ItemIndicator /></ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
            )}
          />

          {/* 存储类型 */}
          <Controller
            name="setting.upload.type"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-3">
                <Label className="text-right text-sm">存储方式</Label>
                <Select {...field} className="w-full min-w-0">
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="tencent" textValue="tencent">腾讯云 COS<ListBox.ItemIndicator /></ListBox.Item>
                      <ListBox.Item id="local" textValue="local">本地服务器<ListBox.ItemIndicator /></ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
            )}
          />

          {/* 存储目录 */}
          <Controller
            name="setting.upload.dir"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-3">
                <Label className="text-right text-sm">存储目录</Label>
                <Input {...field} size="sm" className="min-w-0" placeholder="例如 /upload" />
              </div>
            )}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Button type="submit" variant="primary">保存</Button>
        <Button variant="danger" onPress={() => onCancelAction?.()}>取消</Button>
      </div>
    </form>
  );
}
