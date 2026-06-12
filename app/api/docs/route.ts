import { NextResponse } from "next/server";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "Galerie API",
    description: "Galerie 相册管理系统 API 文档，适用于 AI 客户端集成。认证支持 JWT（Bearer Token）和 API Token 两种方式。",
    version: "1.0.0",
    contact: { name: "Galerie" },
  },
  servers: [{ url: "/api", description: "Base API path" }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "JWT token，登录后获得，存储在 localStorage('token') 中。每次请求在 Authorization header 中传入 Bearer <token>。",
      },
      ApiTokenAuth: {
        type: "http",
        scheme: "bearer",
        description: "API Token，通过 POST /api/user/token 创建。用于第三方/ AI 客户端访问。权限受限于创建时指定的 scope。user.* 权限不可用。",
      },
    },
    schemas: {
      Photo: {
        type: "object",
        properties: {
          id: { type: "integer" },
          uid: { type: "string", description: "唯一标识" },
          title: { type: "string", description: "标题，唯一" },
          src: { type: "string", description: "来源字符串，格式: 'local:<path>' 或 'tencent:<url>'" },
          description: { type: "string", nullable: true },
          location: { type: "string", nullable: true },
          shootTime: { type: "string", format: "date-time" },
          createTime: { type: "string", format: "date-time" },
          updateTime: { type: "string", format: "date-time", nullable: true },
          exif: { type: "object", nullable: true, description: "EXIF JSON 数据" },
          author: { type: "string", nullable: true },
          isPublic: { type: "boolean" },
          isSelected: { type: "boolean" },
          type: { type: "string", default: "photo" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          uid: { type: "string" },
          name: { type: "string", description: "用户名，唯一" },
          nickname: { type: "string", nullable: true },
          email: { type: "string" },
          permissions: { type: "array", items: { type: "string" }, description: "权限列表" },
          setting: { type: "object", nullable: true, description: "用户设置（主题/语言/存储配置等）" },
          avatar: { type: "string", nullable: true },
        },
      },
      ApiTokenCreate: {
        type: "object",
        required: ["name", "permissions"],
        properties: {
          name: { type: "string", description: "Token 名称" },
          permissions: { type: "array", items: { type: "string" }, description: "权限列表，仅限 photo.*，不可包含 user.*" },
          expiresIn: { type: "string", enum: ["7d", "30d", "1y", "never"], description: "过期时间" },
        },
      },
      ApiTokenResponse: {
        type: "object",
        properties: {
          uid: { type: "string" },
          name: { type: "string" },
          permissions: { type: "array", items: { type: "string" } },
          expiresAt: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          lastUsedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      Error: { type: "object", properties: { error: { type: "string" } } },
    },
  },
  security: [{ BearerAuth: [] }, { ApiTokenAuth: [] }],
  paths: {
    "/auth/sign-token": {
      post: {
        tags: ["认证"],
        summary: "登录获取 JWT Token",
        description: "使用邮箱密码登录，返回 JWT token 和用户信息。该接口不需要认证。",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
              example: { email: "user@example.com", password: "mypassword" },
            },
          },
        },
        responses: {
          "200": {
            description: "登录成功",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string", description: "JWT token" },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
                example: { token: "eyJhbGciOiJIUzI1NiIs...", user: { id: 1, uid: "abc123", name: "admin", email: "admin@example.com" } },
              },
            },
          },
          "418": { description: "认证失败（用户不存在或密码错误）", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auth/verify-token": {
      post: {
        tags: ["认证"],
        summary: "验证 JWT Token",
        description: "验证 JWT token 有效性，返回对应用户信息。不需要额外认证。",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token"],
                properties: { token: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Token 有效，返回用户信息", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          "404": { description: "用户不存在" },
          "418": { description: "Token 无效" },
        },
      },
    },
    "/auth/send-verify-code": {
      get: {
        tags: ["认证"],
        summary: "发送验证码邮件",
        description: "向指定邮箱发送验证码。不需要认证。验证码用于注册。",
        parameters: [
          { name: "email", in: "query", required: true, schema: { type: "string", format: "email" } },
        ],
        responses: {
          "200": { description: "发送成功", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } } } },
          "400": { description: "邮箱参数缺失" },
          "418": { description: "邮件发送失败" },
        },
      },
    },
    "/user/token": {
      post: {
        tags: ["API Token"],
        summary: "创建 API Token",
        description: "为当前用户创建一个 API Token。需要 JWT 认证（不支持 API Token 创建 API Token）。权限必须是当前用户权限的子集，且不能包含 user.* 权限。",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiTokenCreate" },
              example: { name: "AI Client", permissions: ["photo.get", "photo.create", "photo.upload"], expiresIn: "30d" },
            },
          },
        },
        responses: {
          "200": {
            description: "创建成功，返回 token 明文（仅在创建时可见）",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string", description: "API Token 明文" },
                    uid: { type: "string" },
                    name: { type: "string" },
                    expiresAt: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
          "400": { description: "参数错误或权限超出范围" },
          "401": { description: "未认证" },
        },
      },
      get: {
        tags: ["API Token"],
        summary: "获取 API Token 列表",
        description: "获取当前用户的所有 API Token（不含 token 明文）。需要 JWT 认证。",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Token 列表", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ApiTokenResponse" } } } } },
          "401": { description: "未认证" },
        },
      },
      delete: {
        tags: ["API Token"],
        summary: "撤销 API Token",
        description: "撤销指定 API Token。需要 JWT 认证。",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "uid", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "撤销成功", content: { "application/json": { schema: { type: "object", properties: { msg: { type: "string" } } } } } },
          "400": { description: "uid 参数缺失" },
          "401": { description: "未认证" },
        },
      },
    },
    "/photo": {
      post: {
        tags: ["图片"],
        summary: "创建图片记录",
        description: "创建一条图片记录。需要 photo.create 权限。",
        security: [{ BearerAuth: [] }, { ApiTokenAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "src"],
                properties: {
                  title: { type: "string", description: "标题，必须唯一" },
                  src: { type: "string", description: "来源字符串" },
                  description: { type: "string" },
                  location: { type: "string" },
                  shootTime: { type: "string", format: "date-time" },
                  exif: { type: "object" },
                  author: { type: "string" },
                  isPublic: { type: "boolean" },
                  isSelected: { type: "boolean" },
                  type: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "创建成功", content: { "application/json": { schema: { $ref: "#/components/schemas/Photo" } } } },
          "403": { description: "无权限" },
          "409": { description: "标题已存在" },
        },
      },
      get: {
        tags: ["图片"],
        summary: "获取单张图片",
        description: "通过 uid 获取图片信息。需要 photo.get 权限。",
        security: [{ BearerAuth: [] }, { ApiTokenAuth: [] }],
        parameters: [
          { name: "uid", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "图片信息", content: { "application/json": { schema: { $ref: "#/components/schemas/Photo" } } } },
          "400": { description: "uid 参数缺失" },
          "404": { description: "图片不存在" },
        },
      },
      put: {
        tags: ["图片"],
        summary: "更新图片信息",
        description: "更新图片信息。需要 photo.update 权限。",
        security: [{ BearerAuth: [] }, { ApiTokenAuth: [] }],
        parameters: [
          { name: "uid", in: "query", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  src: { type: "string" },
                  description: { type: "string" },
                  location: { type: "string" },
                  shootTime: { type: "string", format: "date-time" },
                  exif: { type: "object" },
                  author: { type: "string" },
                  isPublic: { type: "boolean" },
                  isSelected: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "更新成功", content: { "application/json": { schema: { $ref: "#/components/schemas/Photo" } } } },
          "400": { description: "uid 参数缺失" },
          "403": { description: "无权限" },
          "404": { description: "图片不存在" },
          "409": { description: "标题已存在" },
        },
      },
      delete: {
        tags: ["图片"],
        summary: "删除图片",
        description: "删除图片及其本地文件（如果是 local 存储）。需要 photo.delete 权限。",
        security: [{ BearerAuth: [] }, { ApiTokenAuth: [] }],
        parameters: [
          { name: "uid", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "删除成功", content: { "application/json": { schema: { type: "object", properties: { msg: { type: "string" } } } } } },
          "400": { description: "uid 参数缺失" },
          "403": { description: "无权限" },
        },
      },
    },
    "/photo/lists": {
      get: {
        tags: ["图片"],
        summary: "获取图片列表",
        description: "分页查询图片列表，支持排序和筛选。不需要认证（公开图片）。",
        parameters: [
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "orderBy", in: "query", schema: { type: "string", default: "shootTime", enum: ["shootTime", "createTime", "title"] } },
          { name: "order", in: "query", schema: { type: "string", default: "desc", enum: ["asc", "desc"] } },
          { name: "isSelected", in: "query", schema: { type: "string", enum: ["true", "false"] } },
          { name: "isPublic", in: "query", schema: { type: "string", enum: ["true", "false"] } },
        ],
        responses: {
          "200": {
            description: "图片列表",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    lists: { type: "array", items: { $ref: "#/components/schemas/Photo" } },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/photo/upload": {
      post: {
        tags: ["图片"],
        summary: "上传图片文件",
        description: "上传图片文件到本地服务器存储。需要 photo.upload 权限。Content-Type 为 multipart/form-data。",
        security: [{ BearerAuth: [] }, { ApiTokenAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  image: { type: "string", format: "binary", description: "图片文件" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "上传成功，返回图片路径", content: { "application/json": { schema: { type: "object", properties: { src: { type: "string" } } } } } },
          "400": { description: "未提供图片" },
          "403": { description: "无权限" },
        },
      },
    },
    "/photo/file/{filename}": {
      get: {
        tags: ["图片"],
        summary: "获取图片文件",
        description: "获取上传的图片文件二进制内容。公开接口，不需要认证。",
        parameters: [
          { name: "filename", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "图片二进制内容", content: { "image/*": {} } },
          "404": { description: "文件不存在" },
        },
      },
    },
    "/user": {
      post: {
        tags: ["用户管理"],
        summary: "创建用户",
        description: "创建用户。需要 user.create 权限（仅 JWT）。",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  nickname: { type: "string" },
                  permissions: { type: "array", items: { type: "string" } },
                  setting: { type: "object" },
                  avatar: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "创建成功", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          "403": { description: "无权限" },
        },
      },
      get: {
        tags: ["用户管理"],
        summary: "获取用户信息",
        description: "获取用户信息。未传 uid 返回所有用户列表；传 uid 返回单个用户。需要 user.get 权限（仅 JWT）。",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "uid", in: "query", required: false, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "用户信息或列表", content: { "application/json": { schema: { oneOf: [{ $ref: "#/components/schemas/User" }, { type: "array", items: { $ref: "#/components/schemas/User" } }] } } } },
          "403": { description: "无权限" },
          "404": { description: "用户不存在" },
        },
      },
      put: {
        tags: ["用户管理"],
        summary: "更新用户",
        description: "更新用户信息。需要 user.update 权限（仅 JWT）。空字符串密码会被忽略。",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "uid", in: "query", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  nickname: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string", description: "留空则不修改密码" },
                  permissions: { type: "array", items: { type: "string" } },
                  setting: { type: "object" },
                  avatar: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "更新成功", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          "400": { description: "uid 参数缺失" },
          "403": { description: "无权限" },
          "404": { description: "用户不存在" },
        },
      },
      delete: {
        tags: ["用户管理"],
        summary: "删除用户",
        description: "删除用户。需要 user.delete 权限（仅 JWT）。",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "uid", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "删除成功", content: { "application/json": { schema: { type: "object", properties: { msg: { type: "string" } } } } } },
          "400": { description: "uid 参数缺失" },
          "403": { description: "无权限" },
        },
      },
    },
    "/user/lists": {
      get: {
        tags: ["用户管理"],
        summary: "获取用户列表",
        description: "获取所有用户列表。需要 user.get 权限（仅 JWT）。",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "用户列表", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/User" } } } } },
          "403": { description: "无权限" },
        },
      },
    },
    "/user/register": {
      post: {
        tags: ["用户管理"],
        summary: "用户自助注册",
        description: "用户自助注册，需要验证码（通过 GET /api/auth/send-verify-code 获取）。不需要认证。注册成功后获得默认 photo.* 权限。",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "verifyCode"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  verifyCode: { type: "string", description: "邮箱验证码" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "注册成功", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          "418": { description: "验证码无效或注册失败" },
        },
      },
    },
    "/user/password": {
      put: {
        tags: ["用户管理"],
        summary: "修改密码",
        description: "修改当前用户密码。需要 JWT 认证（不支持 API Token）。需要提供旧密码验证。",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["oldPassword", "newPassword"],
                properties: {
                  oldPassword: { type: "string" },
                  newPassword: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "修改成功", content: { "application/json": { schema: { type: "object", properties: { msg: { type: "string" } } } } } },
          "403": { description: "无权限或旧密码错误" },
          "404": { description: "用户不存在" },
        },
      },
    },
    "/geocode": {
      get: {
        tags: ["地图"],
        summary: "通过经纬度获取地址信息",
        description: "代理高德逆地理编码 API。接收 WGS84 经纬度参数，服务端将其转换为 GCJ-02 坐标后调用高德 API，返回地址信息。不需要认证。",
        parameters: [
          { name: "longitude", in: "query", required: true, schema: { type: "string" }, description: "经度（WGS84 坐标系）" },
          { name: "latitude", in: "query", required: true, schema: { type: "string" }, description: "纬度（WGS84 坐标系）" },
        ],
        responses: {
          "200": {
            description: "返回高德 API 响应",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string" },
                    info: { type: "string" },
                    regeocode: {
                      type: "object",
                      properties: {
                        formatted_address: { type: "string", description: "格式化地址" },
                        addressComponent: {
                          type: "object",
                          properties: {
                            city: { type: "string" },
                            province: { type: "string" },
                            district: { type: "string" },
                            adcode: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
                example: {
                  status: "1",
                  info: "OK",
                  regeocode: {
                    formatted_address: "北京市朝阳区建国门外大街1号",
                    addressComponent: {
                      city: "北京市",
                      province: "北京市",
                      district: "朝阳区",
                      adcode: "110105",
                    },
                  },
                },
              },
            },
          },
          "400": { description: "缺少 longitude 或 latitude 参数，或参数格式错误" },
          "500": { description: "服务端未配置高德 API Key 或高德 API 请求失败" },
        },
      },
    },
    "/cos/upload": {
      get: {
        tags: ["腾讯云 COS"],
        summary: "获取 COS 临时上传凭证",
        description: "获取腾讯云 COS 临时密钥和上传路径。需要 photo.upload 权限。",
        security: [{ BearerAuth: [] }, { ApiTokenAuth: [] }],
        parameters: [
          { name: "filename", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "上传凭证",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    credentials: { type: "object", description: "临时密钥" },
                    expiredTime: { type: "integer" },
                    startTime: { type: "integer" },
                    bucket: { type: "string" },
                    region: { type: "string" },
                    key: { type: "string", description: "上传路径" },
                  },
                },
              },
            },
          },
          "400": { description: "filename 参数缺失" },
          "403": { description: "无权限" },
          "500": { description: "服务器配置错误" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
