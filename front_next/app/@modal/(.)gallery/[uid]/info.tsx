import { Photo, Exif } from "@/app/typings";
import dayjs from "dayjs";
import { useMemo, useState, createContext, useContext } from "react";
import {
  Hashtag,
  Clock,
  Heading,
  Comment,
  LocationArrow,
  Person,
  LockOpen,
  Star,
} from "@gravity-ui/icons";
import { getAddress, updatePhoto } from "@/app/api";
import { Button, toast } from "@heroui/react";

const Context = createContext<Partial<Photo>>({});

const hiddenInfo = ["id", "src", "updateTime", "exif"];

const SHOW_BASE_INFOS = [
  "uid",
  "title",
  "description",
  "location",
  "shootTime",
  "author",
  "isPublic",
  "isSelected",
];

const SHOW_EXIF_INFOS = [
  "focalLength",
  "exposureTime",
  "iso",
  "fNumber",
  "width",
  "height",
  "lens",
  "model",
];

const INFO_NAME_DICT: Record<string, string> = {
  uid: "UID",
  title: "标题",
  description: "描述",
  location: "位置",
  shootTime: "拍摄时间",
  author: "摄影师",
  isPublic: "是否公开",
  isSelected: "是否精选",
  focalLength: "焦距",
  exposureTime: "快门",
  iso: "ISO",
  fNumber: "光圈",
  width: "宽度",
  height: "高度",
  lens: "镜头",
  model: "相机",
};

export default function PhotoInfo({ photo }: { photo: Photo }) {
  const baseInfos = useMemo(() => {
    const showBaseInfos: Record<
      string,
      Array<string | number | boolean | undefined>
    > = {};
    for (const k in photo) {
      if (SHOW_BASE_INFOS.includes(k)) {
        showBaseInfos[k] = [INFO_NAME_DICT[k], photo[k]];
      }
    }
    return showBaseInfos;
  }, [photo]);

  const exifInfos = useMemo(() => {
    const showExifInfos: Record<
      string,
      Array<string | number | boolean | undefined>
    > = {};
    const exifs: Exif = JSON.parse(photo?.exif || "{}");
    for (const k in exifs) {
      if (SHOW_EXIF_INFOS.includes(k)) {
        showExifInfos[k] = [INFO_NAME_DICT[k], exifs[k]];
      }
    }
    return showExifInfos;
  }, [photo]);

  return (
    <Context.Provider value={photo}>
      <div className="photo-info">
        <section>
          <h2 className="mb-4">基本信息</h2>
          {Object.entries(baseInfos).map(([key, value]) => {
            if (hiddenInfo.includes(key)) return null;
            return (
              <PhotoInfoItem
                key={key}
                name={key}
                label={value[0] as string}
                value={value[1]}
              />
            );
          })}
        </section>

        <section className="mt-8">
          <h2 className="mb-4">拍摄参数</h2>
          {photo?.exif &&
            Object.entries(exifInfos).map(([key, value]) => {
              if (hiddenInfo.includes(key)) return null;
              return (
                <PhotoInfoItem
                  key={key}
                  name={key}
                  label={value[0] as string}
                  value={value[1]}
                />
              );
            })}
        </section>
      </div>
    </Context.Provider>
  );
}

function PhotoInfoItem({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value: string | number | boolean | undefined;
}) {
  let labelElement: React.ReactNode = label;
  let valueElement: React.ReactNode = value;

  switch (name) {
    case "uid":
      labelElement = (
        <label className="flex items-center">
          <Hashtag />
          <span className="ml-1">编号</span>
        </label>
      );
      valueElement = <span className="text-muted">{value}</span>;
      break;
    case "title":
      labelElement = (
        <label className="flex items-center">
          <Heading />
          <span className="ml-1">标题</span>
        </label>
      );
      break;
    case "description":
      labelElement = (
        <label className="flex items-center">
          <Comment />
          <span className="ml-1">描述</span>
        </label>
      );
      valueElement = value || "没有描述";
      break;
    case "location":
      labelElement = (
        <label className="flex items-center">
          <LocationArrow />
          <span className="ml-1">位置</span>
        </label>
      );
      valueElement = <Location />;
      break;
    case "author":
      labelElement = (
        <label className="flex items-center">
          <Person />
          <span className="ml-1">作者</span>
        </label>
      );
      valueElement = value || "未知摄影师";
      break;
    case "isPublic":
      labelElement = (
        <label className="flex items-center">
          <LockOpen />
          <span className="ml-1">状态</span>
        </label>
      );
      valueElement = value ? "公开" : "私密";
      break;
    case "isSelected":
      labelElement = (
        <label className="flex items-center">
          <Star />
          <span className="ml-1">是否精选</span>
        </label>
      );
      valueElement = value ? "是" : "否";
      break;
    case "shootTime":
      labelElement = (
        <label className="flex items-center">
          <Clock />
          <span className="ml-1">{label}</span>
        </label>
      );
      valueElement = dayjs(value as string).format("YYYY-MM-DD HH:mm:ss");
      break;
    default:
      labelElement = label;
      valueElement = value || "-";
      break;
  }

  return (
    <div className="w-full flex my-2 items-center">
      <label className="text-sm text-muted min-w-19" data-label={name}>
        {labelElement}
      </label>
      <span className="inline-block text-right grow text-sm">
        {valueElement}
      </span>
    </div>
  );
}

function Location() {
  const { uid, exif, location, ...rest } = useContext(Context);
  const [address, setAddress] = useState<string | null>(location || null);

  const handleGet = () => {
    const { longitude, latitude } = JSON.parse(exif || "{}");

    const lg = longitude.split(",")[0];
    const lt = latitude.split(",")[0];

    if (!longitude || !latitude) {
      toast.warning("照片中没有位置信息");
      return;
    }

    getAddress(lg as string, lt as string).then((res) => {
      const adds = res.regeocode.formatted_address;
      setAddress(adds);
      //
      if (uid) {
        toast.promise(
          updatePhoto(uid, { location: adds || "", exif, ...rest }),
          {
            loading: "正在更新位置信息...",
            success: "位置信息已更新",
            error: "更新位置信息失败",
          },
        );
      }
    });
  };

  return (
    <span className="inline-block text-right grow text-sm">
      <span>{address || "暂无位置信息"}</span>
      <Button variant="tertiary" onPress={handleGet} size="sm" className="ml-2">
        {address ? "更新" : "获取"}
      </Button>
    </span>
  );
}
