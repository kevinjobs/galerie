"use client";
import { getUserLists } from "@/app/api";
import { Modal } from "@/app/components";
import { UserPlain } from "@/app/typings";
import { ArrowRotateLeft, Pencil, Plus, TrashBin } from "@gravity-ui/icons";
import {
  Avatar,
  Button,
  ButtonGroup,
  Description,
  Label,
  ListBox,
  toast,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { UserEdit } from "./edit";

export default function UserPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<Partial<UserPlain> | null>(null);

  const { data, refetch, error, isFetching } = useQuery({
    queryKey: ["data"],
    queryFn: getUserLists,
  });

  return (
    <div className="min-w-200 w-200 flex justify-center flex-wrap">
      <div className="mt-4 flex justify-center w-full">
        <ButtonGroup className="">
          <Button
            onPress={() => {
              setIsOpen(true);
              setUser({
                name: "",
                email: "",
                nickname: "",
              });
            }}
          >
            <Plus />
            <span>添加用户</span>
          </Button>
          <Button onPress={() => {
            toast.promise(refetch(), {
              loading: "正在刷新",
              success: "刷新成功",
              error: "刷新失败",
            })
          }}>
            <ArrowRotateLeft />
            <span>刷新</span>
          </Button>
        </ButtonGroup>
      </div>
      {isFetching ? <div className="mt-8">加载数据中...</div> : error ? <div className="mt-8">加载数据失败: {error.message}</div> :
        (
          <div className="inline-block mt-8">
            <ListBox aria-label="Users" className="" selectionMode="single">
              {data &&
                data instanceof Array &&
                data?.map((item: UserPlain) => {
                  return (
                    <ListBox.Item id={item.id} key={item.id} textValue={item.name}>
                      <Avatar size="sm">
                        <Avatar.Fallback>{item.name.split("")[0]}</Avatar.Fallback>
                      </Avatar>
                      <div className="flex flex-wrap grow">
                        <Label>{item.name}</Label>
                        <Description className="w-full">{item.email}</Description>
                      </div>
                      <div className="min-w-20">
                        <Button
                          isIconOnly
                          size="sm"
                          onPress={() => {
                            setIsOpen(true);
                            setUser(item);
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="danger"
                          className="ml-2"
                        >
                          <TrashBin />
                        </Button>
                      </div>
                    </ListBox.Item>
                  );
                })}
            </ListBox>
          </div>
        )
      }
      <Modal isOpen={isOpen} onChangeAction={setIsOpen} size="sm">
        <UserEdit
          defaultUser={user as UserPlain}
          onSubmitAction={() => {
            setIsOpen(false);
            setUser(null);
            refetch();
          }}
          onCancelAction={() => {
            setIsOpen(false);
            setUser(null);
          }}
        />
      </Modal>
    </div>
  );
}
