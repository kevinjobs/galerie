import { NextRequest, NextResponse } from "next/server";
import { AuthTool } from "@/src/lib/auth";
import * as tencentcloud from "tencentcloud-sdk-nodejs";
import path from "path";

// 从环境变量读取腾讯云配置
const TENCENT_COS_SECRET_ID = process.env.TENCENT_COS_SECRET_ID;
const TENCENT_COS_SECRET_KEY = process.env.TENCENT_COS_SECRET_KEY;
const TENCENT_COS_BUCKET = process.env.TENCENT_COS_BUCKET;
const TENCENT_COS_REGION = process.env.TENCENT_COS_REGION;

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
async function getSts(cosKey: string) {
  return new Promise((resolve, reject) => {
    // 初始化 STS 客户端
    const StsClient = tencentcloud.sts.v20180813.Client;
    const clientConfig = {
      credential: {
        secretId: TENCENT_COS_SECRET_ID!,
        secretKey: TENCENT_COS_SECRET_KEY!,
      },
      profile: {
        httpProfile: {
          endpoint: "sts.tencentcloudapi.com",
        },
      },
    };

    const client = new StsClient(clientConfig);

    // 生成策略
    const policy = {
      version: "2.0",
      statement: [
        {
          action: [
            "name/cos:PutObject",
            "name/cos:InitiateMultipartUpload",
            "name/cos:ListMultipartUploads",
            "name/cos:ListParts",
            "name/cos:UploadPart",
            "name/cos:CompleteMultipartUpload",
          ],
          effect: "allow",
          resource: [
            `qcs::cos:${TENCENT_COS_REGION}:uid/*:${TENCENT_COS_BUCKET}/${cosKey}`,
          ],
        },
      ],
    };

    // 生成临时密钥
    client.AssumeRole({
      RoleArn: `qcs::cam::1252473272:role/cos-upload-role`,
      RoleSessionName: "galerie-upload",
      DurationSeconds: 1800,
      Policy: JSON.stringify(policy),
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
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

    // 生成 COS 文件路径
    const cosKey = generateCosKey(filename);

    try {
      // 尝试使用 STS 生成临时密钥
      const stsData = await getSts(cosKey);
      return NextResponse.json({
        credentials: {
          tmpSecretId: (stsData as any).Credentials?.TmpSecretId,
          tmpSecretKey: (stsData as any).Credentials?.TmpSecretKey,
          sessionToken: (stsData as any).Credentials?.SessionToken,
        },
        startTime: Math.floor(Date.now() / 1000),
        expiredTime: (stsData as any).Credentials?.ExpiredTime,
        bucket: TENCENT_COS_BUCKET,
        region: TENCENT_COS_REGION,
        key: cosKey,
      });
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