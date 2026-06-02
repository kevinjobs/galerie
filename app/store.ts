import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { UserPlain, Setting } from "./typings";

export const userAtom = atomWithStorage<UserPlain | null>("user", null);
export const tokenAtom = atomWithStorage<string | null>("token", null);
export const settingAtom = atomWithStorage<Setting | null>("setting", {
  theme: "dark",
  language: "en",
  upload: {
    type: "tencent",
    secretId: "",
    secretKey: "",
    bucket: "gallery-1252473272",
    region: "ap-nanjing",
    dir: "",
  },
  map: {
    code: '',
    key: '',
  }
});

// 照片导航列表（存储当前画廊视图的照片 UID 有序数组）
export const photoListAtom = atom<string[]>([]);
