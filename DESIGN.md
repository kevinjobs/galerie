# Galerie 设计文档

> 基于 HeroUI v3 + Tailwind CSS v4 构建的自托管相册管理系统
> Next.js 16 (App Router) + React 19, Bun runtime, PostgreSQL, Prisma 7

---

## 目录

- [架构总览](#架构总览)
- [数据模型](#数据模型)
- [路由设计](#路由设计)
- [API 层](#api-层)
- [服务层](#服务层)
- [状态管理](#状态管理)
- [认证与授权](#认证与授权)
- [照片上传流程](#照片上传流程)
- [地图集成](#地图集成)
- [响应式策略](#响应式策略)
- [设计原则](#设计原则)
- [色彩系统](#色彩系统)
- [排版](#排版)
- [间距与布局](#间距与布局)
- [圆角体系](#圆角体系)
- [阴影与层级](#阴影与层级)
- [组件设计](#组件设计)
- [交互模式](#交互模式)
- [测试策略](#测试策略)
- [项目约定](#项目约定)

---

## 架构总览

Galerie 是一个**全栈单仓库（monorepo-style）** Next.js 应用，遵循 App Router 约定。

### 分层结构

```
┌─────────────────────────────────────────────┐
│                  客户端 (React)               │
│  app/ 页面 + 组件 + @modal 并行路由           │
│  Jotai 客户端状态 · React Query 服务端状态     │
├─────────────────────────────────────────────┤
│              API 层 (Next.js Route Handlers) │
│  app/api/  ── 认证 / 照片 / 用户 / COS       │
├─────────────────────────────────────────────┤
│             服务层 (Prisma lib)               │
│  prisma/lib/ ── photoService / userService   │
│  / auth / email / errors / db                │
├─────────────────────────────────────────────┤
│             数据层 (PostgreSQL)               │
│  Photo · User · VerifyCode                   │
└─────────────────────────────────────────────┘
```

### 核心数据流

```
用户操作 → React Query / 直接 API 调用
         → _fetch 封装 (自动注入 JWT)
         → Next.js Route Handler
         → Prisma Service (权限检查)
         → PostgreSQL
```

### 技术栈

| 层 | 技术 | 备注 |
|---|---|---|
| 运行时 | Bun | 包管理 + 脚本执行 |
| 框架 | Next.js 16.1.6 | App Router |
| UI 引擎 | React 19.2.3 | — |
| 样式 | Tailwind CSS 4.1.18 | `@import "tailwindcss"` |
| UI 组件 | HeroUI 3.0.0-beta.7 | OKLCH 色彩令牌体系 |
| 图标 | @gravity-ui/icons 2.17 | — |
| 客户端状态 | Jotai 2.18 | `atomWithStorage`(localStorage) |
| 服务端状态 | React Query 5.90 | `@tanstack/react-query` |
| 表单 | React Hook Form 7.71 | — |
| 地图 | Leaflet 1.9 + React-Leaflet 5 | 高德暗色瓦片 |
| 数据库 ORM | Prisma 7.3 | PostgreSQL |
| 认证 | JWT (jsonwebtoken) | HS256, 7d 过期 |
| 邮件 | Nodemailer 8 | SMTP |
| 对象存储 | 腾讯云 COS | 可选，也支持本地存储 |
| 测试 | Vitest 3 + jsdom | — |
| 代码规范 | ESLint 9 (next/core-web-vitals) | — |
| 构建 | Turbopack | — |

---

## 数据模型

### Photo（照片）

```prisma
model Photo {
  id          Int       @id @default(autoincrement())
  uid         String    @unique @default(cuid())    // 公开标识，用于 URL
  title       String    @unique                     // 标题（唯一约束）
  src         String                                // 存储源标识
  description String?                               // 描述
  location    String?                               // 地理位置文本
  shootTime   DateTime  @default(now())             // 拍摄时间
  createTime  DateTime  @default(now())             // 创建时间
  updateTime  DateTime? @updatedAt                  // 更新时间
  exif        Json?                                 // EXIF 元数据 (JSON)
  author      String?                               // 摄影师
  isPublic    Boolean   @default(false)             // 是否公开
  isSelected  Boolean   @default(false)             // 是否精选
}
```

**关键设计点**：
- `uid` 使用 cuid 生成，作为公开 URL 标识符；`id` 为内部自增主键
- `title` 唯一约束防止重复标题，API 层处理 P2002 唯一冲突错误
- `src` 存储格式为 `"tencent:<url>"` 或 `"local:<path>"`，通过 `genSrc()` 解析
- `exif` 为 JSON 字段，内部存储序列化后的 EXIF 对象

### User（用户）

```prisma
model User {
  id          Int       @id @default(autoincrement())
  uid         String    @unique @default(cuid())
  name        String    @unique                     // 用户名（登录用）
  nickname    String?   @default("Nameless User")   // 昵称
  email       String    @unique                     // 邮箱
  password    String                                // 加盐哈希密码
  permissions Json?                                 // 权限列表
  setting     Json?                                 // 用户设置（主题/语言/存储配置）
}
```

**密码存储**：`salt:derivedKey` 格式，使用 `crypto.scrypt` 派生 64 字节密钥

### VerifyCode（验证码）

```prisma
model VerifyCode {
  id         Int       @id @default(autoincrement())
  uid        String    @unique @default(cuid())
  email      String                                // 目标邮箱
  code       String                                // 6 位验证码
  createTime DateTime  @default(now())             // 创建时间
}
```

**验证码有效期**：10 分钟（服务端检查 `createTime`）

---

## 路由设计

### 页面路由

| 路径 | 文件 | 类型 | 访问控制 | 说明 |
|---|---|---|---|---|
| `/` | `app/page.tsx` | 客户端 | 公开 | 首页，随机精选照片全屏封面 |
| `/gallery` | `app/gallery/page.tsx` | 客户端 | 公开 | 画廊，精选/最新/随览三种视图 |
| `/gallery/[uid]` | `app/gallery/[uid]/page.tsx` | 客户端 | 公开 | 照片详情（直接访问） |
| `/map` | `app/map/page.tsx` | 客户端 | 公开 | 照片地图，高德瓦片 + Leaflet |
| `/login` | `app/login/page.tsx` | 客户端 | 公开 | 邮箱+密码登录 |
| `/register` | `app/register/page.tsx` | 客户端 | 公开 | 邮箱验证码注册 |
| `/hinter` | `app/hinter/page.tsx` | 客户端 | 需登录 | 管理后台首页仪表盘 |
| `/hinter/photo` | `app/hinter/photo/page.tsx` | 客户端 | 需登录 | 照片管理列表 |
| `/hinter/photo/[uid]` | `app/hinter/photo/[uid]/page.tsx` | 客户端 | 需登录 | 照片编辑/创建 |
| `/hinter/user` | `app/hinter/user/page.tsx` | 客户端 | 需登录+权限 | 用户管理 |
| `/hinter/setting` | `app/hinter/setting/page.tsx` | 客户端 | 需登录 | 系统设置 |
| `/hinter/profile` | `app/hinter/profile/page.tsx` | 客户端 | 需登录 | 个人资料 |

### 并行路由（Intercepting Routes）

| 路径 | 拦截目标 | 说明 |
|---|---|---|
| `@modal/(.)gallery/[uid]` | `/gallery/[uid]` | 画廊照片详情模态框 |
| `@modal/(.)hinter/photo/[uid]` | `/hinter/photo/[uid]` | 后台照片编辑模态框 |

并行路由通过 `app/layout.tsx` 的 `{children}{modal}` 渲染。客户端导航时，目标页面在模态框中打开而 URL 更新；直接访问或刷新则回退到完整页面。

### 布局层级

```
RootLayout (app/layout.tsx)
├── Header + Navbar (固定顶部)
├── QueryClientProvider
├── children
└── @modal (并行路由插槽)
```

```
HinterLayout (app/hinter/layout.tsx)
├── 桌面：左侧导航菜单 + 右侧内容
├── 移动端：底部 tab bar + 内容
└── children
```

RootLayout 使用 `"use client"` 而非 server component，因为它依赖客户端状态（Jotai atom 从 localStorage 读取 token、user）和 `useEffect` 来处理响应式。

---

## API 层

### 认证 API

| 端点 | 方法 | 认证 | 说明 |
|---|---|---|---|
| `/api/auth/sign-token` | POST | 否 | 邮箱+密码登录，返回 JWT |
| `/api/auth/verify-token` | POST | Bearer | 验证并返回用户信息 |
| `/api/auth/send-verify-code` | GET | 否 | 发送邮箱验证码 |

### 照片 API

| 端点 | 方法 | 认证 | 说明 |
|---|---|---|---|
| `/api/photo?uid=<uid>` | GET | 否 | 获取单张照片 |
| `/api/photo` | POST | `photo.create` | 创建照片 |
| `/api/photo?uid=<uid>` | PUT | `photo.update` | 更新照片 |
| `/api/photo?uid=<uid>` | DELETE | `photo.delete` | 删除照片 |
| `/api/photo/lists` | GET | 否 | 获取照片列表（分页/排序/筛选） |
| `/api/photo/upload` | POST | Bearer | 上传照片文件（本地存储） |
| `/api/photo/file/[filename]` | GET | 否 | 获取本地存储的图片文件 |

**照片列表查询参数**：`offset`, `limit`, `orderBy`, `order`, `isSelected`, `isPublic`

### 用户 API

| 端点 | 方法 | 认证 | 说明 |
|---|---|---|---|
| `/api/user?uid=<uid>` | GET | `user.get` | 获取单个用户 |
| `/api/user` | POST | `user.create` | 创建用户 |
| `/api/user?uid=<uid>` | PUT | `user.update` | 更新用户 |
| `/api/user?uid=<uid>` | DELETE | `user.delete` | 删除用户 |
| `/api/user/lists` | GET | Bearer | 获取所有用户 |
| `/api/user/register` | POST | 否 | 邮箱验证码注册 |
| `/api/user/password` | PUT | Bearer | 修改密码 |

### COS API

| 端点 | 方法 | 认证 | 说明 |
|---|---|---|---|
| `/api/cos/upload?filename=<name>` | GET | Bearer | 获取腾讯云 COS 临时密钥和上传路径 |

### 客户端 API 封装

`app/api/index.ts` 提供统一的前端 API 函数：

- `_fetch(url, options)` — 自动注入 `Content-Type: application/json` 和 `Authorization: Bearer <token>` 的基础封装
- 所有 API 函数统一通过 `_fetch` 调用，错误统一处理为 `throw new Error(message)`
- 文件上传使用原生 `FormData` + 手动设置 Authorization header
- `genSrc(str, compressed?)` — 将存储源字符串解析为可访问的 URL：

```typescript
genSrc("tencent:cos-bucket/file.jpg", true)
// → "https://cos-bucket/file.jpg!compressed"

genSrc("local:/photo/file/test.jpg")
// → "/api/photo/file/test.jpg"
```

---

## 服务层

### 文件结构 (`prisma/lib/`)

```
prisma/lib/
├── db.ts              ← PrismaClient 单例 + 连接池
├── auth.ts            ← JWT 签名/验证/权限检查
├── photoService.ts    ← 照片 CRUD + 文件上传
├── userService.ts     ← 用户 CRUD + 密码哈希/验证
├── email.ts           ← 邮件发送（验证码）
└── errors.ts          ← 自定义错误类（PermissionError 等）
```

### 关键设计

**数据库连接** (`db.ts`)：
- 使用 `PrismaPg` 适配器 + `pg` 连接池
- 支持 `postgres://` 和 `postgresql://` URL 格式
- SSL 通过 `sslmode=require` 查询参数控制
- 开发环境启用 query/error/warn 日志

**权限检查** (`auth.ts`)：
- `AuthTool.sign(payload)` — 签发 HS256 JWT，7 天过期
- `AuthTool.verify(token)` — 验证并解析 token
- `AuthTool.decode(token)` — 仅解码不验证
- `AuthTool.checkPermission(bearer, permission)` — 从 Bearer 头提取 token，检查用户是否包含指定权限

**照片服务** (`photoService.ts`)：
- `getAll` 支持分页、排序（含 `random` 排序）、筛选（isSelected/isPublic）
- `upload` 将文件写入 `public/upload/` 目录
- `getFile` 从 `public/upload/` 读取文件

**用户服务** (`userService.ts`)：
- 密码使用 `crypto.scrypt` + 随机 16 字节盐，格式 `"<salt>:<derivedKey>"`
- `checkVerifyCode` 检查验证码有效性（10 分钟窗口）
- 返回用户数据时统一屏蔽 `password` 字段

**邮件服务** (`email.ts`)：
- SMTP 配置通过环境变量注入
- `sendVerificationEmail` 发送含 6 位验证码的 HTML 模板邮件

**错误体系** (`errors.ts`)：

```
MyError (status=418, code=9000)
├── PermissionError (code=9001)
├── WrongPasswordError (code=9002)
├── UniqueError (code=9003)
└── NotFoundError (code=9004)
```

---

## 状态管理

### Jotai（客户端状态）

`app/store.ts` 使用 `atomWithStorage`（localStorage 持久化）：

```typescript
export const userAtom   = atomWithStorage<UserPlain | null>("user", null)
export const tokenAtom  = atomWithStorage<string | null>("token", null)
export const settingAtom = atomWithStorage<Setting | null>("setting", {
  theme: "dark",
  language: "en",
  upload: { type: "tencent", ... },
  map: { code: "", key: "" },
})
```

**使用场景**：
- 登录后设置 `tokenAtom` + `userAtom` + `settingAtom`
- 根布局 `useEffect` 中通过 `verifyToken` 恢复用户会话
- Navbar 组件读取 `userAtom` 显示用户信息
- 上传组件读取 `settingAtom.upload` 确定上传目标（腾讯云 COS / 本地）

### React Query（服务端状态）

所有 API 数据获取都通过 `useQuery` / `useQueryClient`：

- `queryKey` 命名规范：`["photoLists"]`, `["photoLists", "dashboard"]`, `["data", filter]`, `["userLists"]`
- 后台自动管理缓存失效、重新获取
- `toast.promise` 包装 mutation 操作（新建/编辑/删除）

---

## 认证与授权

### 认证流程

```
登录/注册成功 → 服务端返回 JWT + 用户信息
              → localStorage 存储 token / user
              → Navbar 显示用户头像
              → 后续 API 调用自动注入 Authorization header
```

### 权限体系

权限列表：

| 权限 | 说明 |
|---|---|
| `photo.create` | 创建照片 |
| `photo.get` | 查看照片 |
| `photo.update` | 更新照片 |
| `photo.delete` | 删除照片 |
| `photo.upload` | 上传照片文件 |
| `user.create` | 创建用户 |
| `user.get` | 查看用户 |
| `user.update` | 更新用户 |
| `user.delete` | 删除用户 |

**权限检查**在 API Route Handler 中通过 `AuthTool.checkPermission(authHeader, "photo.create")` 实现。

**超级用户**通过 `scripts/createSuperuser.ts` 脚本创建，绕过注册流程，拥有所有权限。

### 前端鉴权

前端鉴权在页面级通过 `useEffect` + `verifyToken` 实现：

```typescript
// 页面入口检查 token 有效性
useEffect(() => {
  if (!token) {
    router.push("/login")
    return
  }
  verifyToken(token).catch(() => router.push("/login"))
}, [token])
```

---

## 照片上传流程

### 两种存储后端

1. **腾讯云 COS**（默认）：
   ```
   选择文件 → 读取 EXIF → 获取临时密钥 (GET /api/cos/upload)
   → COS SDK 切片上传 → 返回 "tencent:<url>" → 创建/更新照片记录
   ```

2. **本地存储**：
   ```
   选择文件 → 读取 EXIF → POST /api/photo/upload (FormData)
   → 写入 public/upload/ → 返回 "local:/photo/file/<name>" → 创建/更新照片记录
   ```

### 上传组件 (`upload-cloud.tsx`)

- 支持图片格式：`image/*, image/heic, .dng`
- 使用 `md5` 对文件名做哈希，避免中文/特殊字符问题
- 读取 EXIF 后触发 `onDone({ src, tags, file })` 回调
- 支持上传进度回调
- 上传操作使用 `toast.promise` 包装（loading/success/error）

### EXIF 处理 (`hinter/utils.ts`)

- `readExifs(file)` — 使用 `exifreader` 库读取原始 EXIF 标签
- `parseExif(tags)` — 提取焦距、拍摄时间、快门、光圈、ISO、尺寸、镜头、相机型号、GPS 等信息
- `wgs84ToGcj02(lng, lat)` — WGS-84 → GCJ-02 坐标转换（用于高德地图）
- 上传后自动通过高德逆地理编码 API 获取地址文本

---

## 地图集成

### 技术选择

- Leaflet 1.9 + React-Leaflet 5
- 高德地图瓦片（暗色风格）：`style=9`
- 所有 Leaflet 组件通过 `next/dynamic` 动态导入，禁用 SSR

### 暗色地图

通过 CSS `filter` 实现暗色地图瓦片：

```css
#map-container .leaflet-container {
  filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
}
```

### 标记渲染

- 使用 `CircleMarker` 而非默认标记（更简洁）
- 坐标从 EXIF 经纬度提取 → WGS-84 转 GCJ-02
- 点击标记：`router.push(/gallery/${item.uid})`
- 空状态：无照片/无位置信息的友好提示

---

## 响应式策略

项目不依赖 CSS 媒体查询，而是通过 `react-device-detect` 的 `isMobile`、`BrowserView`、`MobileView` 在 React 层分流。

### 桌面端特征

| 模块 | 布局 |
|---|---|
| 导航栏 | 水平 Logo + 链接 + 头像下拉菜单 |
| 后台布局 | 左侧固定菜单 + 右侧内容 |
| 照片编辑 | 双栏（表单 + 预览） |
| 照片详情 | 左 75% 图片 + 右 25% 信息面板 |
| 后台列表 | 卡片网格 (`grid-cols-1 lg:grid-cols-2`) |

### 移动端特征

| 模块 | 布局 |
|---|---|
| 导航栏 | 汉堡菜单 + 头像 |
| 后台布局 | 全屏内容 + 底部 Tab Bar |
| 照片编辑 | 全屏弹窗 |
| 照片详情 | 全屏图片 + 底部可展开信息面板 |
| 后台列表 | 单列卡片 |

### 首屏渲染

为避免 hydration mismatch，所有组件在首次渲染时使用桌面版尺寸占位，`useEffect` 后检测窗口宽度再切换：

```typescript
const [mounted, setMounted] = useState(false);
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  setMounted(true);
  setIsMobile(window.innerWidth < 768);
}, []);
```

---

## 设计原则

1. **内容优先** — 照片是核心，UI 作为背景服务于内容，保持克制和留白
2. **沉浸深色** — 全站强制深色模式，减少视觉干扰，突出照片色彩
3. **响应适配** — 通过 `react-device-detect` 区分移动端/桌面端，各自独立布局
4. **一致克制** — 有限的色彩角色、统一的圆角体系、固定的标题高度

---

## 色彩系统

项目使用 HeroUI 的 OKLCH 色彩令牌体系，全局强制深色模式。

### 角色与用途

| 令牌 | 深色值 | 用途 |
|---|---|---|
| `--background` | `oklch(12% 0.005 285.823)` | 页面主背景 |
| `--foreground` | `var(--snow)` | 主文本色 |
| `--surface` | `oklch(21% 0.006 285.89)` | 卡片、容器背景 |
| `--muted` | `oklch(70.5% 0.015 286.067)` | 次要文本、占位符 |
| `--accent` | `oklch(0.6204 0.195 253.83)` | 蓝色强调色，主操作 |
| `--danger` | `oklch(0.594 0.1967 24.63)` | 删除、错误、危险操作 |
| `--warning` | `oklch(0.7819 0.1585 72.33)` | 精选标记、警告 |
| `--success` | `oklch(0.7329 0.1935 150.81)` | 成功状态 |
| `--overlay` | `oklch(21% 0.006 285.89)` | 模态框、弹出层背景 |
| `--border` | `oklch(28% 0.006 286.033)` | 边框色 |
| `--field-background` | `var(--surface)` | 输入框背景 |

### 使用规范

- 背景色用 `bg-background`、`bg-surface`、`bg-overlay`，**避免**使用具体色值
- 文本色用 `text-foreground`、`text-muted`，避免直接使用白色或灰色
- 状态色用 `text-danger`、`text-warning`、`text-success`、`text-accent`
- 边框用 `border-border`

---

## 排版

### 字重层级

| 层级 | Class | 使用场景 |
|---|---|---|
| 标题 | `text-2xl font-bold` | Logo、页面标题、弹窗标题 |
| 副标题 | `text-sm font-bold` | 表单分区标题 |
| 正文 | `text-sm` | 按钮、输入框、标签、卡片内容 |
| 辅助 | `text-xs` | 次要信息、邮箱、设置描述 |
| 大号 | `font-light` | 位置标签、部分说明文本 |

### 行高与字间距

- 图像容器：`leading-none` 消除图片底部间隙
- 默认行高：HeroUI 标准（`leading-5` ~ `leading-6`）
- 大段文字：自然继承 `leading-normal`

---

## 间距与布局

### 固定标题高度

```
MOBILE_HEADER_HEIGHT  = 56px   // 移动端
BROWSER_HEADER_HEIGHT = 64px   // 桌面端
```

标题 `fixed top-0 z-40`，各页面的 `layout.tsx` 通过 `padding-top` 或 `margin-top` 补偿。

### 留白节奏

| 层级 | 尺寸 | 场景 |
|---|---|---|
| 页面级 | `p-8` | 登录/注册卡片内边距 |
| 区块级 | `p-4` ~ `p-6` | 编辑面板、设置页面 |
| 项目级 | `gap-4`, `my-2` | 表单行间距、列表项间距 |
| 紧凑级 | `p-1`, `p-2` | 工具栏、表格单元格 |

### 布局模式

- **表单行**：`flex flex-nowrap items-center`，标签固定宽度（`w-12`/`w-14`/`w-24`）+ 输入框
- **照片网格**：`flex flex-wrap` + 内联样式 `gap` 动态控制间距
- **居中卡片**：`inline-block p-8` + 父容器 `text-center`
- **全屏覆盖**：`fixed inset-0` + `h-screen w-screen`

### 最大/最小宽度

| Class | 场景 |
|---|---|
| `w-200` (800px) | 导航栏容器 |
| `min-w-60` | 输入框 |
| `w-44` | 下拉选择框 |
| `sm:max-w-100` | 警告对话框 |
| `max-w-[1200px]` | 后台布局容器 |

---

## 圆角体系

| 等级 | Class | 实际值 | 场景 |
|---|---|---|---|
| 药丸 | `rounded-full` | 9999px | 按钮、工具栏、筛选标签 |
| 大圆角 | `rounded-3xl` | 24px | 卡片、区块容器、导航按钮 |
| 中圆角 | `rounded-2xl` | 16px | 编辑面板、信息卡片、列表卡片 |
| 小圆角 | `rounded-lg` | 8px | 上传区域、预览图 |
| 字段圆角 | `rounded-field` | 12px | 输入框（HeroUI 定义） |

---

## 阴影与层级

### 阴影体系

| 令牌 | 深色模式值 |
|---|---|
| `shadow-surface` | `0 0 0 0 transparent inset` |
| `shadow-overlay` | `0 0 1px 0 rgba(255,255,255,0.3) inset` |
| `shadow-field` | `0 0 0 0 transparent inset` |
| `shadow-sm` | Tailwind 标准（卡片 hover 时 `hover:shadow-lg`） |

深色模式下阴影以内发光（inset）为主，而非外投影。卡片 hover 时使用 `hover:-translate-y-0.5 hover:shadow-lg` 产生上浮效果。

### Z-Index 层级

| 层级 | 值 | 组件 |
|---|---|---|
| 基础页面 | 0 | 内容区、表格、卡片 |
| 固定标题 | 40 | 导航栏 header |
| 覆盖层 | 50 | Modal、Toast、Dropdown Popover |
| 照片详情模态框 | 50 | 画廊照片全屏模态框 |
| 底部 Tab Bar | 30 | 移动端后台导航 |

---

## 组件设计

### 按钮

| 属性 | 值 |
|---|---|
| 高度 | `h-10` |
| 圆角 | `rounded-3xl`（药丸形）或 `rounded-2xl`（卡片内） |
| 字体 | `text-sm` |
| 变体 | `primary` / `secondary` / `danger` / `ghost` |
| 图标按钮 | `isIconOnly`，`size="sm"`（`w-8 h-8`） |

### 输入框

HeroUI `Input` 组件默认：
- 圆角 `rounded-field`（12px）
- 背景 `bg-field`
- 聚焦时 `ring-2 ring-focus`
- 验证错误时 `border-danger`

### 卡片

| 属性 | 值 |
|---|---|
| 圆角 | `rounded-3xl` |
| 背景 | `bg-surface` |
| 边框 | `border border-border` |
| 阴影 | `shadow-sm` |
| 内边距 | `p-4` ~ `p-6` |
| 悬停 | `hover:-translate-y-0.5 hover:shadow-lg` |

### 模态框

HeroUI `Modal` 组件封装为 `app/components/modal.tsx`：

- 遮罩：HeroUI Backdrop（`variant="blur"`, `bg-background/25`）
- 容器：`border border-border`
- 尺寸：`full` / `cover` / `md`

### Confirm 确认对话框

`app/components/confirm.tsx` — 使用 HeroUI 的 AlertDialog 封装，用于删除确认等危险操作。

### Navbar 导航栏

`app/components/navbar.tsx` — 自动区分桌面端/移动端渲染：

- 桌面端：Logo + 水平链接 + 用户头像下拉菜单
- 移动端：头像 + 汉堡菜单下拉
- 未登录：头像区域显示"登录"链接

### Toast 通知

使用 HeroUI `Toast.Provider`，全局在 `app/layout.tsx` 中注册。通过 `toast.promise` / `toast.success` / `toast.danger` 调用。

---

## 交互模式

### 过渡动画

| 场景 | 时长 | 缓动 |
|---|---|---|
| 按钮点击 | 250ms | `ease-out` |
| 输入框聚焦 | 150ms | `ease-smooth` |
| 悬停效果 | 200ms ~ 300ms | `ease` |
| 图片淡入 | 1000ms | `opacity` 过渡 |
| 首页 CTA 按钮 | 300ms | `transition-all duration-300` |
| 模态框 | HeroUI 默认 | 淡入 + 缩放 |

### 主页 CTA

- 随机精选横屏照片作为全屏封面
- 悬停：`scale(105%)`, `bg-white/10`, `shadow-2xl`
- 箭头：`group-hover:w-7` 从 0 展开
- 底部显示照片位置信息

### 画廊工具栏

- 底部居中固定，毛玻璃背景
- 三个视图切换：精选 / 最新 / 随览
- 滑块指示当前选中项

---

## 测试策略

### 测试框架

- **Vitest 3** + jsdom 环境
- 全局 setup 文件：`test/setup.ts`
- 路径别名 `@/` 匹配 tsconfig

### 测试文件结构

```
test/
├── setup.ts            ← 测试环境初始化
├── utils.test.ts       ← 工具函数测试
├── database.test.ts    ← 数据库服务测试
├── api.test.ts         ← API 函数测试
├── components.test.tsx ← 组件测试
└── integration.test.ts ← 集成测试
```

### 测试覆盖

- 工具函数：坐标转换、EXIF 解析、图片处理
- 数据库服务：PhotoService、UserService 的 CRUD 操作
- API 层：`_fetch`、`genSrc`、各 API 函数的单元测试
- 组件：Modal、Confirm 等通用组件

---

## 项目约定

### 命名规范

- **文件命名**：React 组件使用 kebab-case (`upload-cloud.tsx`)，页面文件遵循 Next.js 约定 (`page.tsx`, `layout.tsx`)
- **类型定义**：集中定义在 `app/typings.ts`，不散落在各组件中
- **API 函数**：`app/api/index.ts` 统一导出，函数命名 `getXxx`, `createXxx`, `updateXxx`, `deleteXxx`
- **Jotai atoms**：`app/store.ts` 集中定义
- **CSS**：极少量自定义样式，主要依赖 Tailwind 和 HeroUI 令牌

### 代码风格

- ESLint: `next/core-web-vitals` + TypeScript 规则
- 所有组件使用 `"use client"` 指令（目前无 Server Component）
- TypeScript 严格模式 (`strict: true`)
- HeroUI v3 beta API（新的 slot 化 API 模式）

### 环境变量

```
# 必需
DATABASE_URL=postgresql://user:password@host:5432/galerie
JWT_SECRET=...
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=465
EMAIL_USER=...
EMAIL_PASS=...

# 可选（腾讯云 COS）
TENCENT_COS_SECRET_ID=...
TENCENT_COS_SECRET_KEY=...
TENCENT_COS_BUCKET=...
TENCENT_COS_REGION=ap-nanjing
NEXT_PUBLIC_TENCENT_COS_BUCKET=...
NEXT_PUBLIC_TENCENT_COS_REGION=...
```

### Git 规范

- `.gitignore` 排除：`public/upload/`、`node_modules`、`.next/`、`.env`、`*.tsbuildinfo`
- 无 pre-commit hooks 或 formatter 配置

### 命令速查

| 命令 | 说明 |
|---|---|
| `bun run dev` | 启动开发服务器 (端口 9999) |
| `bun run build` | 生产构建 |
| `bun run start` | 启动生产服务器 (端口 9999) |
| `bun test` | 运行全部 Vitest 测试 |
| `bun test test/<file>.test.ts` | 运行单个测试文件 |
| `bunx prisma migrate dev` | 应用开发数据库迁移 |
| `bunx prisma generate` | 重新生成 Prisma Client |
| `bunx tsx scripts/createSuperuser.ts` | 创建超级用户 |
| `bun run lint` | ESLint 检查 |

---

## 版本记录

| 日期 | 版本 | 变更 |
|---|---|---|
| 2026-05-24 | 2.0 | 全面重构：整合架构、数据流、路由、API、认证、上传、地图、测试等内容 |
| 2026-05-23 | 1.0 | 初始设计文档（仅视觉设计） |
