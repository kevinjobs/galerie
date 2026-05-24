/* eslint-disable @next/next/no-img-element */
"use client";
import { settingAtom } from "@/app/store";
import { Picture, TrashBin } from "@gravity-ui/icons";
import { Button, toast } from "@heroui/react";
import { Tags } from "exifreader";
import { useAtomValue } from "jotai";
import React from "react";
import { genSrc, uploadPhoto } from "../../api";
import { convertImgFormat, readExifs, uploadToCOS } from "../utils";
import md5 from "md5";

export interface UploadOnDoneParams {
  src?: string;
  tags?: Tags;
  file?: File;
}

export interface UploadProps {
  onDone?: ({ src, tags, file }: UploadOnDoneParams) => void;
  onProgress?: (progress: number) => void;
  onClear?: () => void;
  previewSrc?: string | null;
}

export function UploadCloud({
  onDone,
  onProgress,
  onClear,
  previewSrc = null,
}: UploadProps) {
  const setting = useAtomValue(settingAtom);

  const ref = React.useRef<HTMLInputElement>(null);
  const [src, setSrc] = React.useState<string | null>();
  const objectUrlRef = React.useRef<string | null>(null);

  const revokeObjectUrl = React.useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const oldFile = e.target.files?.[0];

    if (oldFile) {
      const filename = `${md5(oldFile.name.split(".")[0])}.${oldFile.name.split(".")[1]}`;
      const file = new File([oldFile], filename, { type: oldFile.type });

      // 1. 先读取原始文件的 EXIF（DNG 等 RAW 格式的 EXIF 需要在转换前读取）
      const exifs = await readExifs(file);

      // 2. 转换文件格式（如 DNG 转 JPEG）
      const convertedFile = await convertImgFormat(file);

      revokeObjectUrl();
      const newObjectUrl = URL.createObjectURL(convertedFile);
      objectUrlRef.current = newObjectUrl;
      setSrc(newObjectUrl);

      const handleDone = (src: string) => {
        e.target.value = "";
        // 返回转换后的文件，但 EXIF 来自原始文件
        if (onDone) onDone({ src, tags: exifs, file: convertedFile });
      };

      const handleProgress = (p: number) => {
        if (onProgress) onProgress(p);
      };

      // 上传图片
      const upload = async () => {
        if (setting?.upload?.type === "tencent") {
          return uploadToCOS(convertedFile, (src) => {
            setSrc(genSrc(src));
            handleDone(src);
          }, handleProgress, setting?.upload);
        }

        if (setting?.upload?.type === "local" || !setting?.upload?.type) {
          try {
            const res = await uploadPhoto(convertedFile);
            handleDone(`local:${res.src}`);
          } catch (err) {
            throw err;
          }
        }
      };

      toast.promise(upload(), {
        loading: "正在上传...",
        success: "上传成功",
        error: (err) => `上传失败: ${err instanceof Error ? err.message : "未知错误"}`,
      });
    }
  };

  return (
    <div className="border w-75 h-55 text-center relative rounded-lg overflow-hidden">
      <input
        title="file"
        className="w-0 h-0 opacity-0"
        type="file"
        onChange={handleChange}
        ref={ref}
        accept="image/*, image/heic, .dng"
      />

      <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center">
        {src || previewSrc ? (
          <img
            src={src || genSrc(previewSrc as string)}
            alt="preview"
            className="object-cover w-full h-full rounded-lg"
          />
        ) : (
          <Picture className="w-12 h-12 relative bottom-4" />
        )}
      </div>
      <div className="absolute left-1/2 bottom-2 -translate-x-1/2 w-full flex items-center justify-center">
        <Button
          variant="secondary"
          onPress={() => {
            return ref.current?.click();
          }}
        >
          点击{src ? "更换" : "上传"}图片
        </Button>
        <Button
          isIconOnly
          variant="danger"
          className="ml-2"
          onPress={() => {
            revokeObjectUrl();
            setSrc(null);
            if (ref.current) {
              ref.current.value = "";
            }
            if (onClear) onClear();
          }}
        >
          <TrashBin />
        </Button>
      </div>
    </div>
  );
}
