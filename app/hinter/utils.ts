import COS from "cos-js-sdk-v5";
import * as ExifReader from "exifreader";
import { heicTo, isHeic } from "heic-to";
import { Exif } from "../typings";
import { getCosUploadInfo } from "../api";

export async function convertImgFormat(file: File) {
  // 因为腾讯云可以上传heic文件，所以这里不需要转换
  // const convertedFile = await heicToJpg(file);
  // 下面还可以转换其他格式照片，如png等，根据需要添加
  return file;
}

export function wgs84ToGcj02(lng: number, lat: number): [number, number] {
  const PI = Math.PI;
  const A = 6378245.0;
  const EE = 0.00669342162296594323;

  const transformLat = (x: number, y: number): number => {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
    return ret;
  };

  const transformLng = (x: number, y: number): number => {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
    return ret;
  };

  const outOfChina = lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
  if (outOfChina) {
    return [lng, lat];
  }

  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = lat / 180.0 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (A * (1 - EE) / (magic * sqrtMagic) * PI);
  dLng = (dLng * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);
  return [lng + dLng, lat + dLat];
}

export async function readExifs(file: File) {
  try {
    const tags = await ExifReader.load(file);
    return tags;
  } catch (err) {
    console.error("EXIF parse error:", err);
  }
}

export function parseExif(tags?: ExifReader.Tags | null): Exif {
  if (!tags) return {};

  const exifs = {
    focalLength: String(tags?.FocalLength35efl?.description),
    createTime: String(
      tags?.["DateCreated"]?.description || tags?.DateTime?.description,
    ),
    exposureTime: String(tags?.ExposureTime?.description),
    fNumber: String(tags?.FNumber?.description),
    iso: Number(tags?.ISOSpeedRatings?.description),
    width: tags?.["Image Width"]?.description || undefined,
    height: tags?.["Image Height"]?.description || undefined,
    lens: String(tags?.Lens?.description || tags?.LensModel?.description),
    model: String(tags?.Model?.description),
    altitude: String(
      tags?.GPSAltitude?.description + "," + tags?.GPSAltitudeRef?.description,
    ),
    latitude: String(
      tags?.GPSLatitude?.description + "," + tags?.GPSLatitudeRef?.description,
    ),
    longitude: String(
      tags?.GPSLongitude?.description +
      "," +
      tags?.GPSLongitudeRef?.description,
    ),
  };

  return exifs;
}

export async function uploadToCOS(
  file: File,
  onDone?: (src: string, file: File) => void,
  onProgress?: (progress: number) => void,
  options?: {
    dir: string;
  },
) {
  // 获取上传信息（临时密钥和 COS 文件路径）
  const uploadInfo = await getCosUploadInfo(file.name);

  const cos = new COS({
    SecretId: uploadInfo.credentials.tmpSecretId,
    SecretKey: uploadInfo.credentials.tmpSecretKey,
    SecurityToken: uploadInfo.credentials.sessionToken,
    Protocol: 'https', // 统一使用 https 协议，否则会有跨域问题
  });

  const config: COS.UploadFileParams = {
    Bucket: uploadInfo.bucket,
    Region: uploadInfo.region,
    Key: uploadInfo.key,
    Body: file,
    SliceSize: 1024 * 1024 * 5,
    onProgress: (progressData) => {
      const progress = Math.round(
        (progressData.loaded / progressData.total) * 100,
      );
      onProgress?.(progress);
    },
    onFileFinish: (err, data) => {
      if (onDone) onDone("tencent:" + data?.Location, file);
    },
  };

  try {
    const data = await cos.uploadFile(config);
    return data;
  } catch (err) {
    console.error("上传失败:", err);
    throw err;
  }
}

export const heicToJpg = async (file: File) => {
  const isheic = await isHeic(file);
  if (isheic) {
    const jpeg = await heicTo({
      blob: file,
      type: "image/jpeg",
      quality: 1,
    });

    return new File([jpeg as Blob], `${file.name.split(".")[0]}.jpg`, { type: "image/jpeg" });
  } else {
    return file;
  }
};

export const fileToArrayBuffer = async (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
};

export const genFileSrc = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
};

export const arrayBufferToFile = (buffer: ArrayBuffer, filename: string) => {
  return new File([buffer], filename);
};

export async function getImageSize(file: File): Promise<{ width: number, height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = URL.createObjectURL(file);
    image.onload = () => {
      resolve({ width: image.width, height: image.height });
    };
    image.onerror = (err) => {
      reject(err);
    };
  });
}