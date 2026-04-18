# Galerie 项目说明

## 技术栈

### 前端
- **运行时**: Bun
- **框架**: Next.js 16.1.6 (React 19.2.3)
- **样式**: Tailwind CSS
- **UI 组件**: HeroUI
- **状态管理**: Jotai + React Query
- **数据库 ORM**: Prisma

### 后端（已迁移到前端）
- **运行时**: Bun
- **框架**: Next.js API Routes (替代原 Elysia.js)
- **数据库**: PostgreSQL
- **认证**: JWT

## 运行命令

### 前端开发
```bash
cd front_next
bun install
bun run dev
```

### 数据库迁移
```bash
cd front_next
bunx prisma migrate dev
```

### 创建超级用户
```bash
cd front_next
bunx tsx scripts/createSuperuser.ts <email> <password>
```

### 构建生产版本
```bash
cd front_next
bun run build
```

## 环境变量

需要在 `front_next/.env` 中配置：

```env
DATABASE_URL=postgresql://user:password@host:port/db
JWT_SECRET=your_jwt_secret_key
EMAIL_HOST=smtp.example.com
EMAIL_PORT=465
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

## 权限说明

### 超级用户权限 (ALL_PERMISSIONS)
- `photo.create` - 创建照片
- `photo.get` - 查看照片
- `photo.update` - 更新照片
- `photo.delete` - 删除照片
- `photo.upload` - 上传照片
- `user.create` - 创建用户
- `user.get` - 查看用户
- `user.update` - 更新用户
- `user.delete` - 删除用户

## API 端点

### 认证 API
- `POST /api/auth/sign-token` - 用户登录
- `POST /api/auth/verify-token` - 验证 Token
- `GET /api/auth/send-verify-code` - 发送验证码

### 照片 API
- `GET /api/photo/lists` - 获取照片列表
- `GET /api/photo?uid=xxx` - 获取单张照片
- `POST /api/photo` - 创建照片（需认证）
- `PUT /api/photo?uid=xxx` - 更新照片（需认证）
- `DELETE /api/photo?uid=xxx` - 删除照片（需认证）

### 用户 API
- `POST /api/user/register` - 用户注册
- `GET /api/user/lists` - 获取用户列表（需认证）
- `GET /api/user?uid=xxx` - 获取用户信息（需认证）
- `POST /api/user` - 创建用户（需认证）
- `PUT /api/user?uid=xxx` - 更新用户（需认证）
- `DELETE /api/user?uid=xxx` - 删除用户（需认证）
