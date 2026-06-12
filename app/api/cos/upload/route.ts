import { NextRequest, NextResponse } from "next/server";
import { AuthTool } from "@/prisma/lib/auth";
import path from "path";
import { getCredential } from "qcloud-cos-sts";

const TENCENT_COS_SECRET_ID = process.env.TENCENT_COS_SECRET_ID;
const TENCENT_COS_SECRET_KEY = process.env.TENCENT_COS_SECRET_KEY;
const TENCENT_COS_BUCKET = process.env.TENCENT_COS_BUCKET;
const TENCENT_COS_REGION = process.env.TENCENT_COS_REGION;

const config = {
  secretId: TENCENT_COS_SECRET_ID!,
  secretKey: TENCENT_COS_SECRET_KEY!,
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

function generateCosKey(filename: string): string {
  const date = new Date();
  const m = date.getMonth() + 1;
  const ymd = `${date.getFullYear()}${m < 10 ? `0${m}` : m}${date.getDate()}`;
  const r = ('000000' + Math.random() * 1000000).slice(-6);
  const ext = path.extname(filename);
  return `upload/${ymd}/${ymd}_${r}${ext}`;
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

    const permission = {
      limitExt: false,
      extWhiteList: ['jpg', 'jpeg', 'png', 'gif', 'bmp'],
      limitContentType: false,
      limitContentLength: false,
    };

    const ext = path.extname(filename);
    const cosKey = generateCosKey(filename);

    if (permission.limitExt) {
      const extInvalid = !ext || !permission.extWhiteList.includes(ext.slice(1));
      if (extInvalid) {
        return NextResponse.json({ error: '非法文件，禁止上传' }, { status: 400 });
      }
    }

    const AppId = config.bucket.substr(config.bucket.lastIndexOf('-') + 1);
    const resource = `qcs::cos:${config.region}:uid/${AppId}:${config.bucket}/${cosKey}`;

    const condition: any = {};

    if (permission.limitContentType) {
      Object.assign(condition, {
        'string_like_if_exist': {
          'cos:content-type': 'image/*'
        }
      });
    }

    if (permission.limitContentLength) {
      Object.assign(condition, {
        'numeric_less_than_equal': {
          'cos:content-length': 5 * 1024 * 1024
        },
      });
    }

    const policy = {
      version: '2.0',
      statement: [
        {
          action: config.allowActions,
          effect: 'allow',
          resource: [resource],
          condition,
        },
      ],
    };

    const stsData = await getCredential({
      secretId: config.secretId,
      secretKey: config.secretKey,
      policy,
      durationSeconds: config.durationSeconds,
      region: config.region,
    });

    return NextResponse.json({
      credentials: stsData.credentials,
      expiredTime: stsData.expiredTime,
      startTime: Math.round(Date.now() / 1000),
      bucket: config.bucket,
      region: config.region,
      key: cosKey,
    });
  } catch (error) {
    console.error("获取上传信息失败:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "获取上传信息失败" }, { status: 500 });
  }
}
