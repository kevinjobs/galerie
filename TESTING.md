# 测试文档

## 测试策略

我们为 Galerie 应用设计了全面的测试策略，包括以下几个层次：

### 1. 单元测试
- **测试文件位置**: `test/` 目录
- **测试工具**: Vitest, React Testing Library
- **覆盖范围**: 工具函数、API 函数、数据库服务

### 2. 集成测试 (计划中)
- 测试组件间的交互
- 测试完整用户流程
- 测试 API 端点

### 3. E2E 测试 (计划中)
- 使用 Playwright 进行端到端测试
- 模拟真实用户操作

## 已实现的测试

### 工具函数测试 (`test/utils.test.ts`)
- `wgs84ToGcj02` - 坐标转换
- `convertImgFormat` - 图像格式转换
- `parseExif` - EXIF 数据解析
- 文件操作相关函数

### API 函数测试 (`test/api.test.ts`)
- `genSrc` - 照片源 URL 生成

### 数据库服务测试 (`test/database.test.ts`)
- UserService - 用户服务
- PhotoService - 照片服务
- 密码哈希与验证

## 运行测试

### 基本命令

```bash
# 安装依赖
bun install

# 运行测试
bun test

# 运行测试并启动 UI 界面
bun test:ui

# 运行测试并生成覆盖率报告
bun test:coverage

# 运行单个测试文件
bun test test/utils.test.ts
```

### 测试运行器选项

Vitest 提供了一些有用的 CLI 选项：

```bash
# 监听文件变更，自动重新运行测试
bun test --watch

# 运行指定名称的测试
bun test -t "wgs84ToGcj02"

# 只运行失败的测试
bun test --re-run

# 不使用缓存
bun test --no-cache
```

## 测试覆盖范围

### 目标覆盖领域
1. **工具函数** - 100%
2. **服务层** - 100%
3. **组件逻辑** - 90%+
4. **API 端点** - 90%+

### 当前覆盖重点
- 坐标转换算法
- EXIF 数据解析
- 用户认证流程
- 照片管理操作
- 密码安全处理

## 测试最佳实践

### 1. 独立和可重复的测试
- 每个测试应该独立运行
- 使用 beforeEach/afterEach 进行清理
- Mock 外部依赖

### 2. 清晰的测试描述
- 使用描述性的测试名称
- "应该..." 格式的描述
- 说明测试的前置条件和预期结果

### 3. Mock 策略
- Mock 数据库操作
- Mock API 调用
- Mock 外部服务
- 避免外部网络请求

### 4. 测试数据
- 使用有意义的测试数据
- 测试边界情况
- 测试错误场景

## 常见测试场景

### 认证流程测试
```typescript
describe('Authentication', () => {
  it('应该成功登录', async () => {
    // 测试登录功能
  })
  
  it('应该拒绝无效的验证码', async () => {
    // 测试验证码错误处理
  })
})
```

### 照片管理测试
```typescript
describe('Photo Management', () => {
  it('应该创建新照片', async () => {
    // 测试照片创建
  })
  
  it('应该解析照片 EXIF 数据', async () => {
    // 测试 EXIF 解析
  })
  
  it('应该正确转换坐标', async () => {
    // 测试坐标转换
  })
})
```

### 用户权限测试
```typescript
describe('User Permissions', () => {
  it('应该检查用户权限', async () => {
    // 测试权限检查
  })
  
  it('超级用户应该有所有权限', async () => {
    // 测试超级用户权限
  })
})
```

## 未来扩展计划

### 1. 添加更多测试
- [ ] 组件集成测试
- [ ] API 路由集成测试
- [ ] E2E 测试
- [ ] 性能测试
- [ ] 安全性测试

### 2. 测试覆盖率目标
- [ ] 达到 80% 测试覆盖率
- [ ] 持续监控覆盖率变化
- [ ] 关键模块达到 100% 覆盖率

### 3. CI/CD 集成
- [ ] 在 GitHub Actions 中运行测试
- [ ] 在 PR 中检查测试通过
- [ ] 发布前确保测试通过

## 调试测试

### 调试技巧

1. 使用 `console.log` 打印中间结果
2. 使用浏览器调试器：
   ```bash
   bun test --inspect
   ```
3. 使用 Vitest UI 查看详细结果

### 常见问题解决

**测试超时**:
- 检查异步代码是否正确处理
- 增加超时时间
- 检查 Promise 是否正确解决

**Mock 问题**:
- 确认正确 Mock 了依赖
- 检查 Mock 实现
- 测试前重置所有 Mocks

**覆盖率不准确**:
- 确保所有代码路径都有测试
- 检查分支覆盖率
- 验证测试完整性

## 贡献测试代码

### 添加新测试的流程
1. 在 `test/` 目录下创建相应的测试文件
2. 使用描述性的文件名
3. 遵循现有测试的模式
4. 确保测试独立且可重复运行

### 测试文件命名规范
- 对于工具函数: `*.test.ts`
- 对于组件: `*.test.tsx`
- 对于 API: `*.api.test.ts`

### 提交前检查
- [ ] 所有测试通过
- [ ] 添加了必要的新测试
- [ ] 测试覆盖了变更的功能
- [ ] 没有破坏现有功能

## 参考资料

- [Vitest 文档](https://vitest.dev/)
- [React Testing Library 文档](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest 文档](https://jestjs.io/) (许多概念同样适用于 Vitest)

## 总结

测试是保证软件质量的重要环节。我们的测试策略注重代码质量和用户体验，确保每一个功能都能正确且安全地运行。欢迎加入我们，一起完善测试覆盖！
