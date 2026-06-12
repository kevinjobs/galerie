# Galerie 全面改进计划

基于完整代码库审计（55+ 文件）和设计文档（DESIGN.md），识别出以下改进领域：

---

## A. 功能缺陷与边界错误（优先级：🔴 高）

### A1. 登录页错误处理吞噬真实错误
- **文件**: `app/login/page.tsx:52-55`
- **问题**: `.catch()` 中 `throw new Error()` 会导致 unhandled rejection（无意义），且没有区分错误类型
- **修复**: 移除不必要的 `throw`，使用 `error.message` 展示具体错误

### A2. 注册页 `registerUser` 不传 `name` 导致用户名为空
- **文件**: `app/register/page.tsx:35` → `app/api/user/register/route.ts:27`
- **问题**: 注册时只传 `email/password/verifyCode`，但 `UserService.add` 要求 `name`，传了空字符串。用户创建后 `name` 为空，无法登录（`sign-token` 用 email 查没关系，但无法通过 name 登录）
- **修复**: 注册时自动用 email 前缀生成 `name`

### A3. 注册页"重新发送邮件"按钮无功能
- **文件**: `app/register/page.tsx:123`
- **问题**: 按钮有 UI 但没有绑定 onClick handler
- **修复**: 绑定 `sendVerifyCode` 调用

### A4. UploadCloud `onClear` 回调不重置 form 的 `src` 字段
- **文件**: `app/hinter/photo/upload-cloud.tsx` + `app/hinter/photo/edit.tsx:188`
- **问题**: `onClear={reset}` 传入的是 `reset()` 函数，但 upload 的清除不重置 form 中的 `src` 值，导致用户删除预览后提交仍用旧 src
- **修复**: 在 `onClear` 中显式 `setValue("src", "")`

### A5. Gallary 详情页无 loading/error state
- **文件**: `app/gallery/[uid]/page.tsx`
- **问题**: `photo` 为 null 时只渲染空白容器，没有 loading 指示或错误提示
- **修复**: 添加 loading spinner 和 error 处理

### A6. 用户删除按钮无确认弹窗
- **文件**: `app/hinter/user/page.tsx:130-132`
- **问题**: 删除按钮没有绑定 `Confirm` 组件，点击直接触发无操作
- **修复**: 包裹 `Confirm` 组件并实现 `handleDelete` 函数

### A7. `PhotoInfo` 中的 `Location` 组件 `getAddress` 异常处理
- **文件**: `app/@modal/(.)gallery/[uid]/info.tsx:238-264`
- **问题**: 没有处理 EXIF 为 null/undefined 的情况（`JSON.parse(exif || "{}")` 但 `exif` 为 undefined 时不报错，但之后的 `longitude.split` 会崩溃）
- **修复**: 添加防御性检查

### A8. `uploadToCOS` 的 `onFileFinish` 回调类型问题
- **文件**: `app/hinter/utils.ts:121-123`
- **问题**: `onFileFinish` 是在分片上传完成时调用，如果 `data` 是 `null` 或 `err` 存在时不应该调用 `onDone`
- **修复**: 添加 null/error 检查

### A9. `UserService.update` 更新后不清除 `password` 字段
- **文件**: `app/hinter/user/edit.tsx:77`
- **问题**: `updateUser` 将整个 `UserPlain` 对象（含 `password`）发送到 API，服务端虽会 hash，但 API 在 `PUT /api/user` 时没有过滤掉空 password
- **修复**: API 端过滤空字符串 password

### A10. `POST /api/photo` 创建照片时不处理 `uid` 字段重复
- **问题**: Prisma schema 中 `title` 是 `@unique`，但 `POST /api/photo` 不处理 `Prisma.PrismaClientKnownRequestError` (P2002)，导致向用户暴露原始错误
- **修复**: catch Prisma unique constraint error 并返回友好的错误消息

### A11. 地图页面无 no-geo-data 空状态
- **文件**: `app/map/page.tsx`
- **问题**: 当 `data` 返回空或全无定位信息时，只显示空白地图。虽然有用 `toast.info` 提示，但不够直观
- **修复**: 添加覆盖层提示

### A12. `send-verify-code` 接口返回了完整的验证码记录（含 code 本身）
- **文件**: `app/api/auth/send-verify-code/route.ts:33`
- **问题**: 返回 `db.verifyCode.create` 的结果，这包含 `code` 字段（明文验证码），泄露了验证码
- **修复**: 返回 `{ success: true, message: "..." }` 而非数据库记录

---

## B. UI 一致性改进（优先级：🟡 中）

### B1. 登录/注册页使用 HeroUI 原生 Card 组件
- **文件**: `app/login/page.tsx`, `app/register/page.tsx`
- **问题**: 登录/注册页使用 `<Card className="inline-block p-8">`，但 HeroUI v3 的 Card 组件已经改变 API（不再支持 `inline-block`）。与后台管理页的卡片风格不一致
- **修复**: 统一使用 HeroUI 新版 Card API 或自定义 div（与 hinter 风格匹配的 `rounded-3xl border border-border bg-surface p-6 shadow-sm`）

### B2. HeroUI 组件 API 兼容性问题
- **多个文件**: 多处使用了 HeroUI v3 beta 的旧版 API
  - `Input` 缺少 `isInvalid`/`errorMessage` 属性（新版 HeroUI 使用 `isInvalid` + `errorMessage` 替代手动渲染错误文本）
  - `Select`/`ListBox` 使用旧版嵌套模式（HeroUI v3 beta 可能使用不同的 API）
  - `Switch` 使用 `value`/`onChange` 但 HeroUI v3 beta 的 Switch 使用 `isSelected`/`onValueChange`
- **修复**: 统一使用新版 HeroUI API

### B3. 导航栏 Navbar 与整体设计风格不同
- **文件**: `app/components/navbar.tsx`
- **问题**: Navbar 基于 old HeroUI 组件（Avatar, Dropdown），整体样式与后台管理页的新 UI 风格不同。移动端 header 中的 Avatar 用 `<Link>` 包裹在一个 Fallback 内，不合理
- **修复**: 统一 Navbar 的视觉风格

### B4. 编辑页面表单布局不一致
- **文件**: `app/hinter/photo/edit.tsx`
- **问题**: `FormItem` 使用 `flex items-center h-9` + 固定宽度 label（`w-14`），而用户编辑页 `UserEdit` 使用 `grid grid-cols-[4rem_1fr]`。两种不同的表单布局模式
- **修复**: 统一使用 `grid` 布局

### B5. 主页不确定中英文混用
- **文件**: `app/page.tsx:62` 使用中文"加载中..."，"进入图库"
- **问题**: 大部分 UI 是中文，但设计文档说 `language: "en"` 是默认，且设置页支持语言切换但未实现 i18n
- **注意**: 这是一个已知的未实现功能，不应现在修复，仅记录

### B6. 管理后台 sidebar 在移动端不显示当前页面标记
- **文件**: `app/hinter/layout.tsx`
- **问题**: 移动端底部导航只通过颜色区分 active，没有左侧指示条（桌面端有）
- **修复**: 移动端导航增加被选中的视觉强化

### B7. 模态框（`@modal/(.)gallery/[uid]`）z-index 使用 `z-999`
- **文件**: `app/@modal/(.)gallery/[uid]/page.tsx:32`
- **问题**: 设计文档说 z-999 已弃用
- **修复**: 使用 HeroUI Modal 组件或合适的 z-index

---

## C. 代码质量改进（优先级：🟢 低）

### C1. `_fetch` 中 `localStorage.getItem` 在 SSR 时会崩溃
- **文件**: `app/api/index.ts:31`
- **问题**: 所有 API 调用在客户端组件执行没问题，但如果有任何 SSR 场景会崩溃。所有页面目前已标记 `"use client"`，但仍是潜在风险
- **修复**: 添加 `typeof window !== 'undefined'` 检查

### C2. `Album` 组件无 key 使用 index
- **文件**: `app/gallery/album.tsx:35`
- **问题**: `key={index}` 可能导致 React reconciliation 问题
- **修复**: 使用 item 中唯一标识

### C3. EditPanel `useEffect` 地址获取依赖问题
- **文件**: `app/hinter/photo/edit.tsx:168-178`
- **问题**: useEffect 依赖 `[exifs]`，但内部使用了 `setValue("location", ...)`，当用户手动编辑 location 后重新触发地址获取会覆盖用户输入
- **修复**: 仅在首次获取地址时填充，或只在 location 为空时自动填充

### C4. `checkVerifyCode` 不检查过期时间
- **文件**: `prisma/lib/userService.ts:106-115`
- **问题**: 只检查是否存在匹配的验证码记录，不检查 `createTime` 是否在有效期内
- **修复**: 添加 10 分钟过期检查

### C5. 测试文件修复：`genSrc` 测试未同步代码变更
- **文件**: `test/api.test.ts`
- **问题**: 测试断言 `genSrc('tencent:...')` 返回不带 `!origin` 后缀的 URL，但实际代码已在 `genSrc` 中添加了 append `!origin`
- **修复**: 更新测试断言

### C6. Photo 列表的 `order: "random"` 在服务端使用 `orderByClause.id = "asc"`
- **文件**: `prisma/lib/photoService.ts:78-79`
- **问题**: "random" 排序实际是按 id asc，没有真正的随机化
- **修复**: 使用数据库随机排序（PostgreSQL: `$queryRawUnsafe` 或 Prisma 的 `orderBy: Prisma.sql\`RANDOM()\``）或客户端洗牌

---

## 执行计划

### 第一阶段（🔴 高优先级）
A1-A12 功能缺陷修复（12 项）

### 第二阶段（🟡 中优先级）
B1-B7 UI 一致性改进（7 项）

### 第三阶段（🟢 低优先级 + 测试修复）
C1-C6 代码质量改进（6 项）
