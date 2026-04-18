import { NextRequest, NextResponse } from "next/server";
import { AuthTool } from "@/src/lib/auth";
import STS from "qcloud-cos-sts";
import path from "path";

// 从环境变量读取腾讯云配置
const TENCENT_COS_SECRET_ID = process.env.TENCENT_COS_SECRET_ID;
const TENCENT_COS_SECRET_KEY = process.env.TENCENT_COS_SECRET_KEY;
const TENCENT_COS_BUCKET = process.env.TENCENT_COS_BUCKET;
const TENCENT_COS_REGION = process.env.TENCENT_COS_REGION;

// 配置参数
const config = {
  secretId: TENCENT_COS_SECRET_ID!,
  secretKey: TENCENT_COS_SECRET_KEY!,
  proxy: process.env.Proxy,
  durationSeconds: 1800,
  bucket: TENCENT_COS_BUCKET!,
  region: TENCENT_COS_REGION!,
  allowActions: [
    'name/cos:PutObject',
    'name/cos:InitiateMultipartUpload',
    'name/cos:ListMultipartUploads',
    'name/cos:ListParts',
    'name/cos:UploadPart',
    'name/cos:CompleteMultipartUpload',
  ],
};

// 生成 COS 文件路径
function generateCosKey(filename: string): string {
  const date = new Date();
  const m = date.getMonth() + 1;
  const ymd = `${date.getFullYear()}${m < 10 ? `0${m}` : m}${date.getDate()}`;
  const r = ('000000' + Math.random() * 1000000).slice(-6);
  const ext = path.extname(filename);
  const cosKey = `upload/${ymd}/${ymd}_${r}${ext}`;
  return cosKey;
}

// 生成临时密钥
async function getSts(cosKey: string, condition: any = {}) {
  return new Promise((resolve, reject) => {
    const AppId = config.bucket.substr(config.bucket.lastIndexOf('-') + 1);
    let resource =
      'qcs::cos:' +
      config.region +
      ':uid/' +
      AppId +
      ':' +
      config.bucket +
      '/' +
      cosKey;

    console.log('检查resource是否正确', resource);

    const policy = {
      version: '2.0',
      statement: [
        {
          action: config.allowActions,
          effect: 'allow',
          resource: [resource],
          condition
        },
      ],
    };

    const startTime = Math.round(Date.now() / 1000);
    STS.getCredential(
      {
        secretId: config.secretId,
        secretKey: config.secretKey,
        proxy: config.proxy,
        region: config.region,
        durationSeconds: config.durationSeconds,
        policy: policy,
      },
      function (err: any, tempKeys: any) {
        if (tempKeys) tempKeys.startTime = startTime;
        if (err) {
          reject(err);
        } else {
          resolve(tempKeys);
        }
      }
    );
  });
}

export async function GET(request: NextRequest) {
  try {
    const bearer = request.headers.get("Authorization")?.replace("Bearer ", "");
    AuthTool.checkPermission(bearer, "photo.upload");

    if (!TENCENT_COS_SECRET_ID || !TENCENT_COS_SECRET_KEY || !TENCENT_COS_BUCKET || !TENCENT_COS_REGION) {
      return NextResponse.json({ error: "腾讯云配置未设置" }, { status: 500 });
    }

    const filename = request.nextUrl.searchParams.get("filename");
    if (!filename) {
      return NextResponse.json({ error: "请传入文件名" }, { status: 400 });
    }

    // 上传文件可控制类型、大小，按需开启
    const permission = {
      limitExt: false, // 限制上传文件后缀
      extWhiteList: ['jpg', 'jpeg', 'png', 'gif', 'bmp'], // 限制的上传后缀
      limitContentType: false, // 限制上传 contentType
      limitContentLength: false, // 限制上传文件大小
    };

    const ext = path.extname(filename);
    const cosKey = generateCosKey(filename);
    const condition: any = {};

    // 1. 限制上传文件后缀
    if (permission.limitExt) {
      const extInvalid = !ext || !permission.extWhiteList.includes(ext.slice(1));
      if (extInvalid) {
        return NextResponse.json({ error: '非法文件，禁止上传' }, { status: 400 });
      }
    }

    // 2. 限制上传文件 content-type
    if (permission.limitContentType) {
      Object.assign(condition, {
        'string_like_if_exist': {
          'cos:content-type': 'image/*'
        }
      });
    }

    // 3. 限制上传文件大小
    if (permission.limitContentLength) {
      Object.assign(condition, {
        'numeric_less_than_equal': {
          'cos:content-length': 5 * 1024 * 1024
        },
      });
    }

    try {
      // 尝试使用 STS 生成临时密钥
      const stsData = await getSts(cosKey, condition);
      return NextResponse.json(
        Object.assign(stsData as any, {
          startTime: Math.round(Date.now() / 1000),
          bucket: config.bucket,
          region: config.region,
          key: cosKey,
        })
      );
    } catch (error) {
      console.error("使用 STS 生成临时密钥失败，使用永久密钥:", error);
      // 如果 STS 失败，使用永久密钥（仅用于开发和测试）
      const startTime = Math.floor(Date.now() / 1000);
      const expiredTime = startTime + 1800;
      return NextResponse.json({
        credentials: {
          tmpSecretId: TENCENT_COS_SECRET_ID,
          tmpSecretKey: TENCENT_COS_SECRET_KEY,
          sessionToken: "",
        },
        startTime,
        expiredTime,
        bucket: TENCENT_COS_BUCKET,
        region: TENCENT_COS_REGION,
        key: cosKey,
      });
    }
  } catch (error) {
    console.error("获取上传信息失败:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "获取上传信息失败" }, { status: 500 });
  }
}