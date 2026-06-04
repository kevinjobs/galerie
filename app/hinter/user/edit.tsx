"use client";
import { createUser, updateUser } from "@/app/api";
import { UserPlain } from "@/app/typings";
import {
  Button,
  Input,
  Label,
  toast,
  Select,
  ListBox,
} from "@heroui/react";
import { Controller, useForm } from "react-hook-form";
import { settingAtom, userAtom } from "@/app/store";
import { useAtom } from "jotai";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, ROLES } from "@/prisma/lib/roles";
import { usePermission } from "@/app/hooks/usePermission";

const roleOptions = [
  { id: ROLES.ADMIN, label: ROLE_LABELS.admin, description: ROLE_DESCRIPTIONS.admin },
  { id: ROLES.CONTRIBUTOR, label: ROLE_LABELS.contributor, description: ROLE_DESCRIPTIONS.contributor },
  { id: ROLES.VIEWER, label: ROLE_LABELS.viewer, description: ROLE_DESCRIPTIONS.viewer },
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
  const { isSuperuser, user: operatorUser } = usePermission();

  // Determine if current user can edit this user's role
  const canEditRole = operatorUser?.role === ROLES.ADMIN || isSuperuser;
  const isEditingSelf = defaultUser?.uid === currentUser?.uid;

  const { handleSubmit, control } = useForm<UserPlain>({
    values: {
      id: defaultUser?.id || -1,
      uid: defaultUser?.uid || "",
      name: defaultUser?.name || "",
      nickname: defaultUser?.nickname || undefined,
      email: defaultUser?.email || "",
      password: defaultUser?.password || undefined,
      role: defaultUser?.role || ROLES.CONTRIBUTOR,
      isSuperuser: defaultUser?.isSuperuser || false,
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
          name="role"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-3">
              <Label className="text-right text-sm">角色</Label>
              <Select
                {...field}
                className="w-full min-w-0"
                isDisabled={!canEditRole || isEditingSelf}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {roleOptions.map((role) => (
                      <ListBox.Item key={role.id} id={role.id} textValue={role.label}>
                        <div className="flex flex-col">
                          <span>{role.label}</span>
                          <span className="text-xs text-muted">{role.description}</span>
                        </div>
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          )}
        />

        {isEditingSelf && (
          <p className="text-xs text-muted text-center">
            不能修改自己的角色，请让其他管理员操作
          </p>
        )}

        <div className="space-y-4 p-0">
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
                <Input {...field} className="min-w-0" placeholder="例如 /upload" />
              </div>
            )}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Button type="submit" variant="primary">保存</Button>
        <Button variant="ghost" onPress={() => onCancelAction?.()}>取消</Button>
      </div>
    </form>
  );
}
