"use client";

import { Button, Input as I, Label, Switch, toast } from "@heroui/react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import { Controller, FieldErrors, useForm } from "react-hook-form";
import { createPhoto, getAddress, updatePhoto } from "../../api";
import { Exif, Photo } from "../../typings";
import { getImageSize, parseExif } from "../utils";
import { UploadCloud, UploadOnDoneParams } from "./upload-cloud";

dayjs.extend(customParseFormat);

const convertDate = (date: string | Date | undefined) => {
  if (dayjs(date, "YYYY:MM:DD HH:mm:ss").isValid()) {
    return dayjs(date, "YYYY:MM:DD HH:mm:ss").toISOString();
  }
  return dayjs().toISOString();
};

type FormData = Exif & Photo;

export interface EditPanelProps {
  photo?: Photo | null;
  onFinish?: () => void;
}

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

export default function EditPanel({ photo, onFinish }: EditPanelProps) {
  const [exifs, setExifs] = useState<Exif | null>(null);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const defaultExifs: Exif = {
    focalLength: "",
    createTime: new Date().toISOString(),
    fNumber: "",
    exposureTime: "",
    iso: 0,
    width: "",
    height: "",
    lens: "",
    model: "",
    altitude: "",
    latitude: "",
    longitude: "",
  };

  const parseExifSafe = (exif?: string | object | null): Exif => {
    if (!exif) return defaultExifs;
    if (typeof exif === "string") {
      try {
        return JSON.parse(exif) as Exif;
      } catch {
        return defaultExifs;
      }
    }
    if (typeof exif === "object" && !Array.isArray(exif)) {
      return exif as unknown as Exif;
    }
    return defaultExifs;
  };

  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    reset,
  } = useForm<FormData>({
    defaultValues: {
      id: -1,
      uid: "",
      title: "",
      description: "",
      location: "",
      author: "",
      shootTime: "",
      isPublic: false,
      isSelected: false,
      src: "",
      ...defaultExifs,
    },
  });

  useEffect(() => {
    if (photo) {
      const parsedExif = parseExifSafe(photo.exif as any);
      reset({
        id: photo.id,
        uid: photo.uid,
        title: photo.title || "",
        description: photo.description || "",
        location: photo.location || "",
        author: photo.author || "",
        shootTime: photo.shootTime || "",
        isPublic: photo.isPublic || false,
        isSelected: photo.isSelected || false,
        src: photo.src || "",
        ...parsedExif,
      });
    } else {
      reset({
        id: -1,
        uid: "",
        title: "",
        description: "",
        location: "",
        author: "",
        shootTime: "",
        isPublic: false,
        isSelected: false,
        src: "",
        ...defaultExifs,
      });
    }
  }, [photo, reset]);

  useEffect(() => {
    if (file?.name && !photo) {
      setValue("title", file.name);
    }
  }, [file, photo, setValue]);

  useEffect(() => {
    if (uploadResult) {
      setValue("src", String(uploadResult));
    }
  }, [uploadResult, setValue]);

  useEffect(() => {
    if (exifs) {
      (Object.keys(exifs) as string[]).forEach((key) => {
        setValue(key, (exifs as any)[key]);
      });
      if (exifs.createTime) {
        setValue("shootTime", exifs.createTime);
      }
    }
  }, [exifs, setValue]);

  const submit = async (fd: FormData) => {
    const data = {
      title: fd.title,
      isPublic: fd.isPublic,
      src: fd.src,
      description: fd.description,
      location: fd.location,
      author: fd.author,
      shootTime: convertDate(fd.shootTime),
      isSelected: fd.isSelected,
      exif: JSON.stringify({
        focalLength: fd.focalLength,
        createTime: convertDate(fd.createTime),
        exposureTime: fd.exposureTime,
        fNumber: fd.fNumber,
        iso: fd.iso,
        width: fd.width,
        height: fd.height,
        lens: fd.lens,
        model: fd.model,
        altitude: fd.altitude,
        latitude: fd.latitude,
        longitude: fd.longitude,
      }),
    };

    if (photo) {
      toast.promise(updatePhoto(photo.uid, data), {
        success: () => {
          handleFinish();
          return "更新照片成功";
        },
        error: (err) => err.message,
        loading: "正在更新照片中...",
      });
    }

    if (!photo) {
      toast.promise(createPhoto(data), {
        success: () => {
          handleFinish();
          return "添加照片成功";
        },
        error: (err) => err.message,
        loading: "正在上传照片中...",
      });
    }
  };

  const handleFinish = () => {
    setFile(null);
    setExifs(null);
    setUploadResult(null);
    reset();
    onFinish?.();
  };

  const handleUploadDone = async ({ src, tags, file }: UploadOnDoneParams) => {
    if (src) setUploadResult(src);
    if (file) setFile(file);

    if (tags) {
      const es = parseExif(tags);

      if (!es.width || !es.height) {
        if (!file) return;

        getImageSize(file).then(({ width, height }) => {
          es.width = width + 'px';
          es.height = height + 'px';
          setExifs(es);
        });

        return;
      }

      setExifs(es);
    }
  };

  useEffect(() => {
    if (exifs && exifs.latitude && exifs.longitude) {
      getAddress(exifs.longitude.split(",")[0], exifs.latitude.split(",")[0])
        .then((res) => {
          setValue("location", res.regeocode.formatted_address);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [exifs, setValue]);

  return (
    <div className="rounded-2xl w-full max-w-6xl mx-auto overflow-x-hidden">
      <form onSubmit={handleSubmit(submit)} className="">
        <main style={{ display: isMobile ? "block" : "flex" }} className="w-full items-start justify-center overflow-x-hidden">
          <section className="p-4">
            <UploadCloud
              onDone={handleUploadDone}
              previewSrc={photo?.src}
              onClear={() => {
                setExifs(null);
                setUploadResult(null);
                setValue("src", "");
                (Object.keys(defaultExifs) as string[]).forEach((key) => {
                  setValue(key, (defaultExifs as any)[key]);
                });
              }}
            />
            <div className="mt-4">
              <h2 className="font-bold mb-2">编辑基本信息</h2>
              <Controller
                name="title"
                control={control}
                rules={{ required: "title is required" }}
                render={({ field }) => (
                  <FormItem errors={errors} name="title" label="标题">
                    <Input {...field} />
                  </FormItem>
                )}
              />
              <Controller
                name="description"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormItem errors={errors} name="description" label="描述">
                    <Input {...field} />
                  </FormItem>
                )}
              />
              <Controller
                name="location"
                control={control}
                rules={{ required: false }}
                render={({ field }) => (
                  <FormItem errors={errors} name="location" label="位置">
                    <Input {...field} />
                  </FormItem>
                )}
              />
              <Controller
                name="isPublic"
                control={control}
                render={({ field }) => (
                  <FormItem label="是否公开" name="isPublic" errors={errors}>
                    <Switch
                      isSelected={field.value}
                      onChange={field.onChange}
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch>
                  </FormItem>
                )}
              />
              <Controller
                name="isSelected"
                control={control}
                render={({ field }) => (
                  <FormItem
                    label="是否精选"
                    name="isSelected"
                    errors={errors}
                  >
                    <Switch
                      isSelected={field.value}
                      onChange={field.onChange}
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch>
                  </FormItem>
                )}
              />
              <Controller
                name="author"
                control={control}
                render={({ field }) => (
                  <FormItem errors={errors} name="author" label="摄影师">
                    <Input {...field} />
                  </FormItem>
                )}
              />
              <Controller
                name="src"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormItem errors={errors} name="src" label="图片地址">
                    <Input {...field} />
                  </FormItem>
                )}
              />
              <Controller
                name="shootTime"
                control={control}
                rules={{ required: false }}
                render={({ field }) => (
                  <FormItem errors={errors} name="shootTime" label="拍摄时间">
                    <Input {...field} />
                  </FormItem>
                )}
              />
            </div>
          </section>
          <section className="p-4">
            <header className="w-full">
              <h2 className="font-bold mb-2 text-left">编辑 EXIF 信息</h2>
            </header>
            <Controller
              name="focalLength"
              control={control}
              render={({ field }) => (
                <FormItem errors={errors} name="focalLength" label="焦距">
                  <Input {...field} />
                </FormItem>
              )}
            />
            <Controller
              name="createTime"
              control={control}
              render={({ field }) => {
                return (
                  <FormItem errors={errors} name="createTime" label="创建时间">
                    <Input {...field} />
                  </FormItem>
                );
              }}
            />
            <Controller
              name="exposureTime"
              control={control}
              render={({ field }) => (
                <FormItem errors={errors} name="exposureTime" label="快门">
                  <Input {...field} />
                </FormItem>
              )}
            />
            <Controller
              name="fNumber"
              control={control}
              render={({ field }) => (
                <FormItem errors={errors} name="fNumber" label="光圈">
                  <Input {...field} />
                </FormItem>
              )}
            />
            <Controller
              name="iso"
              control={control}
              render={({ field }) => (
                <FormItem errors={errors} name="iso" label="ISO">
                  <Input {...field} />
                </FormItem>
              )}
            />
            <Controller
              name="width"
              control={control}
              render={({ field }) => (
                <FormItem errors={errors} name="width" label="宽度">
                  <Input {...field} />
                </FormItem>
              )}
            />
            <Controller
              name="height"
              control={control}
              render={({ field }) => (
                <FormItem errors={errors} name="height" label="高度">
                  <Input {...field} />
                </FormItem>
              )}
            />
            <Controller
              name="lens"
              control={control}
              render={({ field }) => (
                <FormItem errors={errors} name="lens" label="镜头">
                  <Input {...field} />
                </FormItem>
              )}
            />
            <Controller
              name="model"
              control={control}
              render={({ field }) => (
                <FormItem errors={errors} name="model" label="相机">
                  <Input {...field} />
                </FormItem>
              )}
            />
            <Controller
              name="altitude"
              control={control}
              render={({ field }) => (
                <FormItem errors={errors} name="altitude" label="海拔">
                  <Input {...field} />
                </FormItem>
              )}
            />
            <Controller
              name="latitude"
              control={control}
              render={({ field }) => (
                <FormItem errors={errors} name="latitude" label="纬度">
                  <Input {...field} />
                </FormItem>
              )}
            />
            <Controller
              name="longitude"
              control={control}
              render={({ field }) => (
                <FormItem errors={errors} name="longitude" label="经度">
                  <Input {...field} />
                </FormItem>
              )}
            />
          </section>
        </main>
        <footer className="w-full text-center mt-4">
          <Button
            type="submit"
            className="bg-(--accent) rounded-full"
            style={{ width: isMobile ? "80%" : "200px" }}
          >
            {photo ? "更新" : "添加"}
          </Button>
        </footer>
      </form>
    </div>
  );
}

function FormItem({
  name,
  label,
  children,
}: {
  name: string;
  label: string;
  children: React.ReactNode;
  errors: FieldErrors<FormData>;
}) {
  return (
    <div className="my-2 flex items-center h-9" data-name={name}>
      <Label className="mr-2 w-14 inline-block">{label}</Label>
      <span>{children}</span>
    </div>
  );
}
