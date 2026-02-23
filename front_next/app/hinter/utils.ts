import { isHeic, heicTo } from "heic-to";
import COS from "cos-js-sdk-v5";
import * as ExifReader from "exifreader";
import { Exif } from "../typings";

export async function convertImage(file: File) {
  const blob = await heicToJpg(file);
  const nfile = new File([blob as Blob], "hello.jpg", { type: "image/jpeg" });
  return nfile;
}

export async function readExifs(file: File) {
  try {
    const tags = await ExifReader.load(file);
    console.log(tags);
    return tags;
  } catch (err) {
    console.error("EXIF parse error:", err);
  }
}

export function parseExif(tags?: ExifReader.Tags | null): Exif {
  if (!tags) return {};

  return {
    focalLength: String(tags?.FocalLength35efl?.description),
    createTime: String(
      tags?.["DateCreated"]?.description || tags?.DateTime?.description,
    ),
    exposureTime: String(tags?.ExposureTime?.description),
    fNumber: String(tags?.FNumber?.description),
    iso: Number(tags?.ISOSpeedRatings?.description),
    width: String(tags?.["Image Width"]?.description),
    height: String(tags?.["Image Height"]?.description),
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
}

export async function uploadToCOS(
  file: File,
  onDone?: (src: string) => void,
  onProgress?: (progress: number) => void,
) {
  const cos = new COS({
    SecretId: "",
    SecretKey: "",
  });

  const config: COS.UploadFileParams = {
    Bucket: "gallery-1252473272",
    Region: "ap-nanjing",
    Key: `upload/${file.name}`,
    Body: file,
    SliceSize: 1024 * 1024 * 5,
    onProgress: (progressData) => {
      const progress = Math.round(
        (progressData.loaded / progressData.total) * 100,
      );
      onProgress?.(progress);
    },
    onFileFinish: (err, data) => {
      if (onDone) onDone(data?.Location);
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

    return jpeg;
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
