import COS from "cos-js-sdk-v5";
import * as ExifReader from "exifreader";
import { heicTo, isHeic } from "heic-to";
import { Exif } from "../typings";

export async function convertImgFormat(file: File) {
  const convertedFile = await heicToJpg(file);
  // 下面还可以转换其他格式照片，如png等，根据需要添加
  return convertedFile;
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
    secretId: string;
    secretKey: string;
    bucket: string;
    region: string;
    dir: string;
  },
) {
  const cos = new COS({
    SecretId: options?.secretId,
    SecretKey: options?.secretKey,
    Protocol: 'https', // 统一使用 https 协议，否则会有跨域问题
  });

  const config: COS.UploadFileParams = {
    Bucket: options?.bucket || "",
    Region: options?.region || "",
    Key: `${options?.dir || "upload"}/${file.name}`,
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
    return err;
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