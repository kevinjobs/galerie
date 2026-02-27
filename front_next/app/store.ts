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
});
