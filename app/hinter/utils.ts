import COS from "cos-js-sdk-v5";
import * as ExifReader from "exifreader";
import { heicTo, isHeic } from "heic-to";
import * as UTIF from "utif";
import { Exif } from "../typings";
import { getCosUploadInfo } from "../api";

/**
 * 检测文件是否为 DNG 格式
 */
export const isDng = (file: File): boolean => {
  const ext = file.name.toLowerCase().split('.').pop();
  return ext === 'dng' || file.type === 'image/dng' || file.type === 'image/x-adobe-dng';
};

/**
 * 将 DNG 文件转换为 JPEG
 * 使用 UTIF 解析 DNG 原始数据，然后用 Canvas 渲染导出，质量 0.92
 */
export const dngToJpg = async (file: File, quality = 0.92): Promise<File> => {
  if (!isDng(file)) {
    return file;
  }

  const buffer = await fileToArrayBuffer(file);
  const ifds = UTIF.decode(buffer);

  if (ifds.length === 0) {
    throw new Error('无法解析 DNG 文件');
  }

  UTIF.decodeImage(buffer, ifds[0]);

  const rgba = UTIF.toRGBA8(ifds[0]);
  const width = ifds[0].width;
  const height = ifds[0].height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法创建 canvas context');
  }

  const imageData = ctx.createImageData(width, height);
  imageData.data.set(rgba);
  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('转换失败，无法生成 blob'));
          return;
        }

        const baseName = file.name.replace(/\.dng$/i, '');
        const newFileName = `${baseName}.jpg`;

        const jpgFile = new File([blob], newFileName, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });

        resolve(jpgFile);
      },
      'image/jpeg',
      quality,
    );
  });
};

export async function convertImgFormat(file: File) {
  // 转换 HEIC/HEIF 为 JPEG
  const heicConverted = await heicToJpg(file);
  // 转换 DNG 为 JPEG
  const convertedFile = await dngToJpg(heicConverted, 0.92);
  return convertedFile;
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

const withTimeout = <T>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms),
    ),
  ]);
};

export async function uploadToCOS(
  file: File,
  onDone?: (src: string, file: File) => void,
  onProgress?: (progress: number) => void,
  options?: {
    dir: string;
  },
) {
  // 获取上传信息（临时密钥和 COS 文件路径），超时 60s
  const uploadInfo = await withTimeout(
    getCosUploadInfo(file.name),
    60000,
    "获取上传凭证超时（60s），请检查网络连接或重新登录",
  );

  const cos = new COS({
    SecretId: uploadInfo.credentials.tmpSecretId,
    SecretKey: uploadInfo.credentials.tmpSecretKey,
    SecurityToken: uploadInfo.credentials.sessionToken,
    Protocol: 'https',
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
      if (err) {
        console.error("COS 上传分片失败:", err);
        return;
      }
      if (data && onDone) onDone("tencent:" + data.Location, file);
    },
  };

  try {
    // COS 上传本身超时 120s
    const data = await withTimeout(
      cos.uploadFile(config),
      120000,
      "上传到腾讯云超时（120s），请检查网络或 COS 配置",
    );
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