export interface Photo {
  [key: string]: string | number | boolean | undefined;
  id: number;
  uid: string;
  title: string;
  src: string;
  description?: string;
  location?: string;
  shootTime?: string;
  createTime?: string;
  updateTime?: string;
  exif?: string;
  author?: string;
  isPublic: boolean;
  isSelected: boolean;
}

export type PhotoCreate = Omit<
  Photo,
  "id" | "uid" | "createTime" | "updateTime"
>;

export type PhotoUpdate = PhotoCreate;

export interface Exif {
  [key: string]: string | number | boolean | undefined;
  createTime?: string;
  focalLength?: string;
  exposureTime?: string;
  fNumber?: string;
  iso?: number;
  width?: string;
  height?: string;
  lens?: string;
  model?: string;
  altitude?: string;
  latitude?: string;
  longitude?: string;
  src?: string;
}

export interface Setting {
  theme?: string;
  language?: string;
  upload?: {
    type: string;
    secretId: string;
    secretKey: string;
    bucket: string;
    region: string;
    dir: string;
  };
}

export interface UserPlain {
  id: number;
  uid: string;
  name: string;
  nickname?: string;
  email: string;
  password?: string;
  permissions?: string[];
  setting?: Setting;
}

export type UserCreate = Omit<UserPlain, "id" | "uid">;

export type UserUpdate = UserPlain;
