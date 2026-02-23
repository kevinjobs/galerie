/* eslint-disable @next/next/no-img-element */
"use client";
import { Picture, TrashBin } from "@gravity-ui/icons";
import { Button, toast } from "@heroui/react";
import { Tags } from "exifreader";
import React from "react";
import { uploadPhoto, genSrc } from "../../api";
import { convertImage, readExifs } from "../utils";

export interface UploadOnDoneParams {
  src?: string;
  tags?: Tags;
  file?: File;
}

export interface UploadProps {
  onDone?: ({ src, tags, file }: UploadOnDoneParams) => void;
  onProgress?: (progress: number) => void;
  onStart?: () => void;
  previewSrc?: string | null;
}

export function UploadCloud({
  onDone,
  onProgress,
  previewSrc = null,
}: UploadProps) {
  const ref = React.useRef<HTMLInputElement>(null);
  const [src, setSrc] = React.useState<string | null>();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const nfile = await convertImage(file);
      setSrc(URL.createObjectURL(nfile));
      const exifs = await readExifs(nfile);

      const handleDone = (src: string, file?: File) => {
        e.target.files = null;
        if (onDone) onDone({ src, tags: exifs, file });
      };

      const handleProgress = (p: number) => {
        if (onProgress) onProgress(p);
      };

      // uploadToCOS(file, handleDone, handleProgress)
      const upload = async () => {
        try {
          const res = await uploadPhoto(file);
          handleDone(res.src, file);
        } catch (err) {
          throw err;
        }
      }

      toast.promise(upload(), {
        loading: "正在上传...",
        success: "上传成功",
        error: "上传失败",
      })
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
        accept="image/jpeg"
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
            setSrc(null);
            if (ref.current?.files) {
              ref.current.files = null;
            }
          }}
        >
          <TrashBin />
        </Button>
      </div>
    </div>
  );
}
