# Galerie - 智能照片管理系统

一个现代化的照片管理系统，支持照片上传、EXIF 解析、地图显示、后台管理等功能。

## 📋 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [数据库设置](#数据库设置)
- [使用指南](#使用指南)
- [API 文档](#api-文档)
- [部署指南](#部署指南)
- [贡献指南](#贡献指南)

## 🚀 项目简介

Galerie 是一个基于 Next.js 构建的智能照片管理系统，提供完整的照片生命周期管理功能。系统支持照片上传、EXIF 元数据解析、地理位置展示、用户权限管理等核心功能。

## ✨ 功能特性

### 📷 照片管理

- 照片上传（支持 HEIC 格式转换）
- EXIF 元数据自动解析
- 照片信息编辑
- 公开/私有照片切换
- 精选照片标记

### 🗺️ 地图功能

- 基于 EXIF 经纬度在地图上显示照片位置
- 支持 WGS84 到 GCJ-02 坐标系转换
- 交互式地图浏览

### 🔐 用户认证

- 邮箱验证码注册
- JWT Token 认证
- 用户权限管理
- 超级用户系统

### 📱 响应式设计

- 桌面端完整功能
- 移动端优化界面
- 自适应布局

### 🎨 美观界面

- 深色主题
- 现代化 UI 设计
- 流畅的动画效果

## 🛠️ 技术栈

### 前端技术

- **运行时**: Bun
- **框架**: Next.js 16.1.6 (React 19.2.3)
- **样式**: Tailwind CSS 4.1.18
- **UI 组件**: HeroUI 3.0.0-beta.7
- **状态管理**: Jotai 2.18.0 + React Query 5.90.20
- **表单处理**: React Hook Form 7.71.1
- **地图**: Leaflet 1.9.4 + React-Leaflet 5.0.0

### 后端技术

- **API**: Next.js API Routes
- **数据库 ORM**: Prisma 7.3.0
- **数据库**: PostgreSQL
- **认证**: JWT (jsonwebtoken 9.0.3)
- **邮件服务**: Nodemailer 8.0.1
- **对象存储**: 腾讯云 COS

### 开发工具

- **语言**: TypeScript 5.9.3
- **代码规范**: ESLint 9.39.2
- **构建**: Turbopack (Next.js 内置)

## 📁 项目结构

```
galerie/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── auth/                # 认证相关 API
│   │   │   ├── sign-token/     # 登录
│   │   │   ├── verify-token/   # 验证 Token
│   │   │   └── send-verify-code/ # 发送验证码
│   │   ├── photo/               # 照片相关 API
│   │   │   ├── lists/          # 照片列表
│   │   │   ├── upload/         # 照片上传
│   │   │   ├── file/[filename] # 文件服务
│   │   │   └── route.ts        # 照片 CRUD
│   │   ├── user/                # 用户相关 API
│   │   │   ├── register/       # 用户注册
│   │   │   ├── lists/          # 用户列表
│   │   │   └── route.ts        # 用户 CRUD
│   │   └── cos/                 # 腾讯云 COS API
│   │       └── upload/         # COS 上传
│   ├── gallery/                 # 画廊页面
│   │   ├── [uid]/page.tsx      # 照片详情
│   │   ├── page.tsx            # 画廊首页
│   │   ├── album.tsx           # 相册组件
│   │   ├── toolbar.tsx         # 工具栏
│   │   └── layout.tsx          # 画廊布局
│   ├── map/                     # 地图页面
│   │   ├── page.tsx            # 地图页面
│   │   └── layout.tsx          # 地图布局
│   ├── hinter/                  # 后台管理
│   │   ├── page.tsx            # 后台首页
│   │   ├── layout.tsx          # 后台布局
│   │   ├── utils.ts            # 工具函数
│   │   ├── photo/              # 照片管理
│   │   │   ├── page.tsx       # 照片列表页
│   │   │   ├── [uid]/page.tsx # 照片详情/编辑
│   │   │   ├── lists.tsx      # 照片列表组件
│   │   │   ├── edit.tsx       # 照片编辑表单
│   │   │   ├── upload-cloud.tsx # 上传组件
│   │   │   └── mobile-lists.tsx # 移动端列表
│   │   ├── user/               # 用户管理
│   │   │   ├── page.tsx       # 用户列表
│   │   │   └── edit.tsx       # 用户编辑
│   │   └── setting/            # 设置页面
│   │       └── page.tsx       # 设置页
│   ├── login/                   # 登录页面
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── register/                # 注册页面
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── @modal/                  # 模态框路由
│   │   ├── (.)gallery/[uid]/
│   │   │   ├── page.tsx
│   │   │   └── info.tsx
│   │   └── (.)hinter/photo/[uid]/
│   │       └── page.tsx
│   ├── components/              # 通用组件
│   │   ├── navbar.tsx          # 导航栏
│   │   ├── modal.tsx           # 模态框
│   │   ├── confirm.tsx         # 确认对话框
│   │   └── index.ts
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 首页
│   ├── typings.ts               # TypeScript 类型定义
│   ├── config.ts                # 配置文件
│   ├── store.ts                 # Jotai 状态管理
│   └── globals.css              # 全局样式
├── prisma/                       # Prisma 配置
│   ├── schema.prisma           # 数据库模型
│   ├── lib/                    # Prisma 工具
│   │   ├── db.ts              # 数据库连接
│   │   ├── userService.ts     # 用户服务
│   │   ├── photoService.ts    # 照片服务
│   │   ├── auth.ts            # 认证工具
│   │   ├── email.ts           # 邮件服务
│   │   └── errors.ts          # 错误处理
│   └── migrations/             # 数据库迁移
├── scripts/                      # 脚本文件
│   └── createSuperuser.ts      # 创建超级用户脚本
├── public/                       # 静态资源
│   ├── globe.svg
│   ├── window.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── file.svg
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── prisma.config.ts
├── manifest.ts
├── global.d.ts
└── README.md
```

## 🏁 快速开始

### 前置要求

确保你的环境满足以下要求：

- Node.js 20+ (推荐使用 Bun)
- Bun 1.0+
- PostgreSQL 14+
- 腾讯云 COS 账号（可选，用于照片存储）

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd galerie

# 安装依赖
bun install
```

### 环境配置

复制 `.env` 示例文件并配置你的环境变量：

```bash
# 如果没有 .env 文件，创建一个
touch .env
```

编辑 `.env` 文件（详见[环境配置](#环境配置)章节）：

```env
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/galerie

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 邮件配置
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=465
EMAIL_USER=your-email@qq.com
EMAIL_PASS=your-email-password

# 腾讯云 COS 配置
TENCENT_COS_SECRET_ID=your-cos-secret-id
TENCENT_COS_SECRET_KEY=your-cos-secret-key
TENCENT_COS_BUCKET=your-bucket-name
TENCENT_COS_REGION=ap-guangzhou
NEXT_PUBLIC_TENCENT_COS_BUCKET=your-bucket-name
NEXT_PUBLIC_TENCENT_COS_REGION=ap-guangzhou
```

### 数据库设置

```bash
# 生成 Prisma Client
bunx prisma generate

# 运行数据库迁移
bunx prisma migrate dev

# （可选）打开 Prisma Studio 查看数据库
bunx prisma studio
```

### 创建超级用户

```bash
# 创建超级管理员账号
bunx tsx scripts/createSuperuser.ts admin@example.com yourpassword123
```

### 启动开发服务器

```bash
# 启动开发服务器（端口 7777）
bun run dev
```

访问 <http://localhost:7777> 查看应用。

### 构建生产版本

```bash
# 构建生产版本
bun run build

# 启动生产服务器
bun run start
```

## ⚙️ 环境配置

### 必需配置

| 变量名            | 说明                   | 示例                                                  |
| -------------- | -------------------- | --------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL 数据库连接 URL | `postgresql://user:password@localhost:5432/galerie` |
| `JWT_SECRET`   | JWT 签名密钥             | `your-super-secret-jwt-key`                         |
| `EMAIL_HOST`   | SMTP 服务器地址           | `smtp.qq.com`                                       |
| `EMAIL_PORT`   | SMTP 服务器端口           | `465`                                               |
| `EMAIL_USER`   | SMTP 邮箱地址            | `your-email@qq.com`                                 |
| `EMAIL_PASS`   | SMTP 邮箱密码或授权码        | `your-email-password`                               |

### 可选配置（腾讯云 COS）

| 变量名                              | 说明               | 示例                  |
| -------------------------------- | ---------------- | ------------------- |
| `TENCENT_COS_SECRET_ID`          | 腾讯云 Secret ID    | `AKIDxxxxxxxxxxxxx` |
| `TENCENT_COS_SECRET_KEY`         | 腾讯云 Secret Key   | `xxxxxxxxxxxxx`     |
| `TENCENT_COS_BUCKET`             | COS Bucket 名称    | `my-photos`         |
| `TENCENT_COS_REGION`             | COS 区域           | `ap-guangzhou`      |
| `NEXT_PUBLIC_TENCENT_COS_BUCKET` | 前端可访问的 Bucket 名称 | `my-photos`         |
| `NEXT_PUBLIC_TENCENT_COS_REGION` | 前端可访问的区域         | `ap-guangzhou`      |

### 生产环境建议

- 使用强密码和密钥
- 启用 HTTPS
- 使用环境变量管理敏感信息
- 配置数据库连接池
- 设置合理的 JWT 过期时间

## 💾 数据库设置

### 数据库模型

系统包含三个主要模型：

#### Photo（照片）

```prisma
model Photo {
  id          Int       @id @default(autoincrement())
  uid         String    @unique @default(cuid())
  title       String    @unique
  src         String
  description String?
  location    String?
  shootTime   DateTime  @default(now())
  createTime  DateTime  @default(now())
  updateTime  DateTime? @updatedAt
  exif        Json?
  author      String?
  isPublic    Boolean   @default(false)
  isSelected  Boolean   @default(false)
}
```

#### User（用户）

```prisma
model User {
  id          Int       @id @default(autoincrement())
  uid         String    @unique @default(cuid())
  name        String    @unique
  nickname    String?   @default("Nameless User")
  email       String    @unique
  password    String
  permissions Json?
  setting     Json?
}
```

#### VerifyCode（验证码）

```prisma
model VerifyCode {
  id         Int       @id @default(autoincrement())
  uid        String    @unique @default(cuid())
  email      String
  code       String
  createTime DateTime  @default(now())
}
```

### 数据库迁移

```bash
# 开发环境迁移
bunx prisma migrate dev

# 生产环境迁移
bunx prisma migrate deploy

# 创建新迁移
bunx prisma migrate dev --name <migration-name>

# 重置数据库（仅开发环境）
bunx prisma migrate reset
```

## 📖 使用指南

### 用户注册与登录

1. **注册账号**
   - 访问 `/register` 页面
   - 输入邮箱地址
   - 点击获取验证码
   - 输入收到的验证码和密码
   - 点击注册
2. **登录系统**
   - 访问 `/login` 页面
   - 输入邮箱和密码
   - 点击登录

### 照片管理

#### 上传照片

1. 登录后台管理系统（`/hinter`）
2. 进入照片管理页面（`/hinter/photo`）
3. 点击"添加照片"按钮
4. 选择照片文件（支持 JPG、PNG、HEIC 等格式）
5. 填写照片信息（标题、描述等）
6. 点击保存

#### 编辑照片信息

1. 在照片列表中点击编辑按钮
2. 修改照片信息
3. 点击保存

#### 管理照片状态

- **公开/私有**：切换照片的公开状态
- **精选标记**：将照片标记为精选
- **删除照片**：删除不需要的照片

### 地图功能

1. 访问 `/map` 页面
2. 地图上会显示所有公开照片的位置
3. 点击照片标记查看详情

### 后台管理

#### 首页仪表盘

- 查看统计数据（总照片数、分类数等）
- 浏览最近上传的照片

#### 用户管理（需要管理员权限）

- 查看用户列表
- 编辑用户信息
- 管理用户权限
- 删除用户

#### 系统设置

- 配置系统参数
- 自定义主题
- 设置上传目录等

## 📡 API 文档

### 认证 API

#### 发送验证码

```
POST /api/auth/send-verify-code
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "Verification code sent successfully"
}
```

#### 用户登录

```
POST /api/auth/sign-token
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "uid": "xxxx",
    "name": "username",
    "email": "user@example.com",
    "nickname": "User",
    "permissions": [...]
  }
}
```

#### 验证 Token

```
POST /api/auth/verify-token
Authorization: Bearer <token>

Response:
{
  "success": true,
  "user": {
    "uid": "xxxx",
    "name": "username",
    "email": "user@example.com",
    "nickname": "User",
    "permissions": [...]
  }
}
```

### 照片 API

#### 获取照片列表

```
GET /api/photo/lists?offset=0&limit=20&orderBy=shootTime&order=desc&isPublic=true

Response:
{
  "photos": [...],
  "total": 100,
  "offset": 0,
  "limit": 20
}
```

#### 获取单张照片

```
GET /api/photo?uid=<photo-uid>

Response:
{
  "uid": "xxxx",
  "title": "Photo Title",
  "src": "https://...",
  "description": "...",
  "location": "...",
  "shootTime": "...",
  "exif": {...},
  "author": "...",
  "isPublic": true,
  "isSelected": false
}
```

#### 创建照片（需认证）

```
POST /api/photo
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Photo Title",
  "src": "https://...",
  "description": "...",
  "location": "...",
  "shootTime": "2024-01-01T00:00:00.000Z",
  "exif": {...},
  "author": "Author",
  "isPublic": false,
  "isSelected": false
}

Response:
{
  "success": true,
  "photo": {...}
}
```

#### 更新照片（需认证）

```
PUT /api/photo?uid=<photo-uid>
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "isPublic": true,
  "isSelected": true
}

Response:
{
  "success": true,
  "photo": {...}
}
```

#### 删除照片（需认证）

```
DELETE /api/photo?uid=<photo-uid>
Authorization: Bearer <token>

Response:
{
  "success": true
}
```

### 用户 API

#### 用户注册

```
POST /api/user/register
Content-Type: application/json

{
  "name": "username",
  "nickname": "User",
  "email": "user@example.com",
  "password": "password123",
  "verifyCode": "123456"
}

Response:
{
  "success": true,
  "user": {...}
}
```

#### 获取用户列表（需认证）

```
GET /api/user/lists
Authorization: Bearer <token>

Response:
{
  "users": [...]
}
```

#### 获取用户信息（需认证）

```
GET /api/user?uid=<user-uid>
Authorization: Bearer <token>

Response:
{
  "user": {...}
}
```

#### 创建用户（需认证）

```
POST /api/user
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "newuser",
  "nickname": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "permissions": ["photo.get", "photo.create"]
}

Response:
{
  "success": true,
  "user": {...}
}
```

#### 更新用户（需认证）

```
PUT /api/user?uid=<user-uid>
Authorization: Bearer <token>
Content-Type: application/json

{
  "nickname": "Updated Name",
  "permissions": [...]
}

Response:
{
  "success": true,
  "user": {...}
}
```

#### 删除用户（需认证）

```
DELETE /api/user?uid=<user-uid>
Authorization: Bearer <token>

Response:
{
  "success": true
}
```

### COS 上传 API

#### 获取上传凭证

```
POST /api/cos/upload
Authorization: Bearer <token>

Response:
{
  "success": true,
  "credentials": {
    "tmpSecretId": "...",
    "tmpSecretKey": "...",
    "sessionToken": "...",
    "expiration": "..."
  },
  "bucket": "my-bucket",
  "region": "ap-guangzhou"
}
```

## 🚀 部署指南

### 使用 Vercel 部署

1. **连接 Git 仓库**
   - 在 Vercel 中导入你的 Git 仓库
   - 配置项目设置
2. **配置环境变量**
   - 在 Vercel 项目设置中添加所有环境变量
   - 确保 `DATABASE_URL` 指向生产数据库
3. **配置数据库**
   - 使用 Vercel Postgres 或其他云数据库服务
   - 运行生产环境迁移：`bunx prisma migrate deploy`
4. **部署**
   - 推送代码到 Git 仓库
   - Vercel 会自动部署

### 使用 Docker 部署（示例）

```dockerfile
FROM oven/bun:1.0

WORKDIR /app

# 复制依赖文件
COPY package.json bun.lock ./

# 安装依赖
RUN bun install --frozen-lockfile

# 复制项目文件
COPY . .

# 生成 Prisma Client
RUN bunx prisma generate

# 构建应用
RUN bun run build

# 暴露端口
EXPOSE 7777

# 启动应用
CMD ["bun", "run", "start"]
```

### 使用传统服务器部署

1. **构建应用**

```bash
bun run build
```

1. **启动服务**

```bash
# 使用 PM2
pm2 start "bun run start" --name galerie

# 或直接运行
bun run start
```

1. **配置反向代理（Nginx 示例）**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:7777;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔐 权限系统

### 用户权限列表

| 权限名称           | 说明   |
| -------------- | ---- |
| `photo.create` | 创建照片 |
| `photo.get`    | 查看照片 |
| `photo.update` | 更新照片 |
| `photo.delete` | 删除照片 |
| `photo.upload` | 上传照片 |
| `user.create`  | 创建用户 |
| `user.get`     | 查看用户 |
| `user.update`  | 更新用户 |
| `user.delete`  | 删除用户 |

### 超级用户

拥有所有权限，可以使用 `scripts/createSuperuser.ts` 脚本创建。

## 🤝 贡献指南

1. **Fork 项目**
2. **创建特性分支**
   ```bash
   git checkout -b feature/your-feature
   ```
3. **提交更改**
   ```bash
   git commit -m 'Add some feature'
   ```
4. **推送到分支**
   ```bash
   git push origin feature/your-feature
   ```
5. **创建 Pull Request**

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 👥 维护者

- [Kevin Jobs](https://github.com/kevinjobs)

## 📞 联系方式

如有问题或建议，欢迎提交 Issue 或 Pull Request！

## 🙏 致谢

感谢所有为本项目做出贡献的开发者！
