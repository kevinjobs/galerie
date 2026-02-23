import { deletePhotoByUid, genSrc, updatePhoto } from "@/app/api";
import { Confirm } from "@/app/components";
import { Photo } from "@/app/typings";
import {
  LockFill,
  LockOpen,
  Pencil,
  Star,
  StarFill,
  TrashBin,
} from "@gravity-ui/icons";
import { Button, toast } from "@heroui/react";

import dayjs from "dayjs";
import { useRouter } from "next/navigation";

export default function PhotoLists({
  lists,
  onRefresh,
}: {
  lists: Photo[];
  onRefresh: () => void;
}) {
  const router = useRouter();

  const HEADS = [
    {
      name: "src",
      label: "预览",
    },
    {
      name: "title",
      label: "标题",
    },
    {
      name: "description",
      label: "描述",
    },
    {
      name: "shootTime",
      label: "拍摄时间",
    },
    {
      name: "location",
      label: "位置",
    },
    {
      name: "author",
      label: "摄影师",
    },
    {
      name: "isPublic",
      label: "公开",
    },
    {
      name: "isSelected",
      label: "精选",
    },
    {
      name: "toolbar",
      label: "操作",
    },
  ];

  const handleDelete = (item: Photo) => {
    deletePhotoByUid(item.uid)
      .then(() => {
        onRefresh();
        toast.success("删除成功");
      })
      .catch((err) => {
        toast.danger(err.message);
      });
  };

  const RENDER_DATA = () => {
    return lists?.map((item: Photo) => ({
      key: item.uid,
      element: (
        <tr key={item.id} className="">
          {HEADS.map((head) => {
            if (head.name === "src") {
              return (
                <td key={head.name} className="w-40 h-30 p-2">
                  <img
                    src={genSrc(item.src)}
                    alt={item.title}
                    className="w-full h-full object-contain"
                  />
                </td>
              );
            }

            if (head.name === "toolbar") {
              return (
                <td key={head.name} className="p-2">
                  <div className="flex items-center">
                    <Button
                      isIconOnly
                      onPress={() => router.push(`/hinter/photo/${item.uid}`)}
                    >
                      <Pencil />
                    </Button>
                    <Confirm
                      title="确认删除？"
                      variant="danger"
                      onConfirmAction={() => handleDelete(item)}
                      content={
                        <p className="text-danger">
                          确认删除该图片？删除后不可找回
                        </p>
                      }
                    >
                      <Button isIconOnly variant="danger" className="ml-2">
                        <TrashBin />
                      </Button>
                    </Confirm>
                  </div>
                </td>
              );
            }

            if (head.name === "isPublic") {
              return (
                <td key={head.name} className="p-2">
                  {item.isPublic ? (
                    <Confirm
                      title="确认取消公开？"
                      onConfirmAction={() => {
                        updatePhoto(item.uid, { ...item, isPublic: false }).then(res => {
                          onRefresh();
                          toast.success("已取消公开");
                        }).catch(err => {
                          toast.danger(err.message);
                        });
                      }}
                      content={
                        <p className="text-danger">
                          确认取消公开该图片？取消后不可找回
                        </p>
                      }
                    >
                      <LockOpen />
                    </Confirm>
                  ) : (
                    <Confirm
                      title="确认公开？"
                      onConfirmAction={() => {
                        toast.promise(
                          updatePhoto(item.uid, { ...item, isPublic: true }),
                          {
                            loading: "正在公开...",
                            success: () => {
                              onRefresh();
                              return "已公开";
                            },
                            error: "公开失败",
                          },
                        );
                      }}
                      content={
                        <p className="text-danger">
                          确认公开该图片？公开后不可取消
                        </p>
                      }
                    >
                      <LockFill />
                    </Confirm>
                  )}
                </td>
              );
            }

            if (head.name === "isSelected") {
              return (
                <td key={head.name} className="p-2">
                  {item.isSelected ? (
                    <Confirm
                      title="确认取消精选？"
                      onConfirmAction={() => {
                        toast.promise(
                          updatePhoto(item.uid, {
                            ...item,
                            isSelected: false,
                          }),
                          {
                            loading: "正在取消...",
                            success: () => {
                              onRefresh();
                              return "取消成功";
                            },
                            error: "取消失败",
                          },
                        );
                      }}
                    >
                      <StarFill color="#fffb0d" />
                    </Confirm>
                  ) : (
                    <Confirm
                      title="确认标记为精选？"
                      onConfirmAction={() => {
                        toast.promise(
                          updatePhoto(item.uid, {
                            ...item,
                            isSelected: true,
                          }),
                          {
                            loading: "正在标记...",
                            success: () => {
                              onRefresh();
                              return "标记成功";
                            },
                            error: "标记失败",
                          },
                        );
                      }}
                    >
                      <Star />
                    </Confirm>
                  )}
                </td>
              );
            }

            if (head.name === "author") {
              return (
                <td key={head.name} className="p-2">
                  {item.author || "未知"}
                </td>
              );
            }

            if (head.name === "shootTime") {
              return (
                <td key={head.name} className="p-2">
                  {dayjs(item.shootTime).format("YYYY-MM-DD HH:mm:ss")}
                </td>
              );
            }

            return (
              <td key={head.name} className="p-2">
                {item[head.name]}
              </td>
            );
          })}
        </tr>
      ),
    }));
  };

  return (
    <div className="flex justify-center">
      <table>
        <thead>
          <tr className="">
            {HEADS.map((head) => (
              <th
                key={head.name}
                className="text-left py-3 first:pl-8 bg-surface first:rounded-l-full last:rounded-r-full last:pr-8 last:pl-4"
              >
                {head.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RENDER_DATA()?.map(
            (item: { key: string; element: React.ReactNode }) => item.element,
          )}
        </tbody>
      </table>
    </div>
  );
}
