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
  Spinner,
  toast,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { UserEdit } from "./edit";
import { isMobile } from "react-device-detect";

export default function UserPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<Partial<UserPlain> | null>(null);

  const { data, refetch, error, isPending } = useQuery({
    queryKey: ["data"],
    queryFn: getUserLists,
  });

  const handleAddUser = () => {
    setIsOpen(true);
    setUser({
      name: "",
      email: "",
      nickname: "",
    });
  }

  const handleRefresh = () => {
    toast.promise(refetch(), {
      loading: "正在刷新",
      success: "刷新成功",
      error: "刷新失败",
    })
  }

  return (
    <div className="min-w-200 flex justify-center flex-wrap">

      <div className="inline-block mt-8">
        {error && <div>{error.message}</div>}
        {data &&
          data instanceof Array &&
          <ListBox aria-label="Users" className="" selectionMode="single">
            {
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
                  </ListBox.Item>);
              })}
          </ListBox>}
      </div>
      <div className="fixed bottom-16 right-8">
        <div>
          <Button
            isIconOnly
            onPress={handleRefresh}
            variant="tertiary"
          >
            <ArrowRotateLeft />
          </Button>
        </div>
        <div className="mt-2">
          <Button isIconOnly onPress={handleAddUser}><Plus /></Button>
        </div>
      </div>

      <Modal isOpen={isOpen} onChangeAction={setIsOpen} size={isMobile ? "full" : 'md'}>
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
