"use client";
import { createUser, updateUser } from "@/app/api";
import { UserPlain } from "@/app/typings";
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Input as I,
  Label,
  toast,
  TextArea,
} from "@heroui/react";
import { Controller, useForm } from "react-hook-form";
import { settingAtom, userAtom } from "@/app/store";
import { useAtom } from "jotai";

function Input(props: React.ComponentProps<typeof I>) {
  const { className, value, onChange, ...rest } = props;
  return (
    <I
      value={value}
      onChange={onChange}
      {...rest}
      className={className + " min-w-60"}
    />
  );
}

export function UserEdit({
  onSubmitAction,
  onCancelAction,
  defaultUser,
}: {
  onSubmitAction?: (data: UserPlain) => void;
  onCancelAction?: () => void;
  defaultUser?: UserPlain | null;
}) {
  const [setting, setSetting] = useAtom(settingAtom);
  const [user, setUser] = useAtom(userAtom);

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
        })
        .catch((err) => {
          toast.danger("创建失败: " + err.message);
        });
    } else {
      updateUser(defaultUser.uid, data)
        .then((res) => {
          if (res.email === user?.email) {
            setUser(res);
            setSetting(res.setting);
          }
          toast.success("更新成功");
        })
        .catch((err) => {
          toast.danger("更新失败: " + err.message);
        });
    }

    if (onSubmitAction) {
      onSubmitAction(data);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
    >
      <h2 className="text-2xl font-bold mb-4 text-center">
        {defaultUser?.uid ? "编辑" : "新增"}用户
      </h2>
      <div className="flex justify-center flex-wrap w-full">
        <Controller
          name="uid"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <div className="flex flex-nowrap mb-2 items-center">
              <label htmlFor="uid" className="w-14 inline-block">
                UID
              </label>
              <Input id="uid" {...field} disabled />
            </div>
          )}
        />
        <Controller
          name="name"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <div className="flex flex-nowrap mb-2 items-center">
              <label htmlFor="name" className="w-14 inline-block">
                用户名
              </label>
              <Input id="name" {...field} />
            </div>
          )}
        />
        {!defaultUser?.uid && (
          <Controller
            name="password"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <div className="flex flex-nowrap mb-2 items-center">
                <label htmlFor="password" className="w-14 inline-block">
                  密码
                </label>
                <Input id="password" {...field} />
              </div>
            )}
          />
        )}
        <Controller
          name="email"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <div className="flex flex-nowrap mb-2 items-center">
              <label htmlFor="email" className="w-14 inline-block">
                Email
              </label>
              <Input id="email" {...field} />
            </div>
          )}
        />
        <Controller
          name="nickname"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <div className="flex flex-nowrap mb-2 items-center">
              <label htmlFor="nickname" className="w-14 inline-block">
                昵称
              </label>
              <Input id="nickname" {...field} />
            </div>
          )}
        />
        {defaultUser?.uid && (
          <Controller
            name="password"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <div className="flex flex-nowrap mb-2 items-center">
                <label htmlFor="password" className="w-14 inline-block">
                  改密码
                </label>
                <Input id="password" {...field} />
              </div>
            )}
          />
        )}
        <Controller
          name="permissions"
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <div className="flex flex-nowrap mb-2 items-center">
              <label htmlFor="permissions" className="w-14 inline-block">
                权限
              </label>
              <CheckboxGroup {...field}>
                <div className="flex w-60 min-w-60 flex-nowrap justify-around">
                  <div className="">
                    <Checkbox value="photo.upload">
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Content>
                        <Label>照片-上传</Label>
                      </Checkbox.Content>
                    </Checkbox>
                    <Checkbox value="photo.get">
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Content>
                        <Label>照片-读</Label>
                      </Checkbox.Content>
                    </Checkbox>
                    <Checkbox value="photo.create">
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Content>
                        <Label>照片-写</Label>
                      </Checkbox.Content>
                    </Checkbox>
                    <Checkbox value="photo.update">
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Content>
                        <Label>照片-更新</Label>
                      </Checkbox.Content>
                    </Checkbox>
                    <Checkbox value="photo.delete">
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Content>
                        <Label>照片-删除</Label>
                      </Checkbox.Content>
                    </Checkbox>
                  </div>
                  <div className="ml-4" style={{ marginLeft: 8 }}>
                    <Checkbox value="user.get">
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Content>
                        <Label>用户-读</Label>
                      </Checkbox.Content>
                    </Checkbox>
                    <Checkbox value="user.create">
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Content>
                        <Label>用户-写</Label>
                      </Checkbox.Content>
                    </Checkbox>
                    <Checkbox value="user.update">
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Content>
                        <Label>用户-更新</Label>
                      </Checkbox.Content>
                    </Checkbox>
                    <Checkbox value="user.delete">
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Content>
                        <Label>用户-删除</Label>
                      </Checkbox.Content>
                    </Checkbox>
                  </div>
                </div>
              </CheckboxGroup>
            </div>
          )}
        />
        <Controller
          name="setting"
          control={control}
          render={({ field }) => (
            <div className="flex flex-nowrap mt-4 mb-2 items-center w-74">
              <label htmlFor="setting" className="w-14 min-w-14 inline-block">
                设置
              </label>
              <TextArea
                fullWidth
                id="setting"
                rows={12}
                {...field}
                value={JSON.stringify(field.value, null, 2)}
                onChange={(e) => {
                  field.onChange(JSON.parse(e.target.value));
                }}
              />
            </div>
          )}
        />
      </div>
      <div className="mt-8 text-center">
        <Button type="submit">保存</Button>
        <Button
          variant="danger"
          className="ml-2"
          onPress={() => {
            if (onCancelAction) {
              onCancelAction();
            }
          }}
        >
          取消
        </Button>
      </div>
    </form>
  );
}
