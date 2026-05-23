# Galerie 设计文档

> 基于 HeroUI v3 + Tailwind CSS v4 构建的自托管相册管理系统

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
| 区块级 | `p-4` | 编辑面板、上传区域 |
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
| `w-24` | 设置标签宽度 |
| `sm:max-w-100` | 警告对话框 |

---

## 圆角体系

| 等级 | Class | 实际值 | 场景 |
|---|---|---|---|
| 药丸 | `rounded-full` | 9999px | 按钮、工具栏、表格表头 |
| 大圆角 | `rounded-3xl` | 24px | 卡片、组件容器 |
| 中圆角 | `rounded-2xl` | 16px | 编辑面板、信息面板 |
| 小圆角 | `rounded-lg` | 8px | 上传区域、预览图 |
| 字段圆角 | `rounded-field` | 12px | 输入框 |

---

## 阴影与层级

### 阴影体系

| 令牌 | 深色模式值 |
|---|---|
| `shadow-surface` | `0 0 0 0 transparent inset` |
| `shadow-overlay` | `0 0 1px 0 rgba(255,255,255,0.3) inset` |
| `shadow-field` | `0 0 0 0 transparent inset` |

深色模式下阴影以内发光（inset）为主，而非外投影。

### Z-Index 层级

| 层级 | 值 | 组件 |
|---|---|---|
| 基础页面 | 0 | 内容区、表格、卡片 |
| 固定标题 | 40 | 导航栏 header |
| 覆盖层 | 50 | Modal、Toast、AlertDialog、Dropdown Popover |
| 最上层 | 999 | **不使用**（已弃用 `z-999`） |

---

## 组件设计

### 按钮

| 属性 | 值 |
|---|---|
| 高度 | `h-10`（移动端 `md:h-9`） |
| 圆角 | `rounded-3xl`（药丸形） |
| 字体 | `text-sm font-medium` |
| 内边距 | `px-4` |
| 点击反馈 | `scale(0.97)`，`250ms ease-out` |
| 变体 | `primary` / `secondary` / `danger` / `ghost` / `tertiary` |
| 图标按钮 | `isIconOnly`，`w-8 h-8` |

### 输入框

| 属性 | 值 |
|---|---|
| 圆角 | `rounded-field`（12px） |
| 背景 | `bg-field` |
| 默认边框 | 透明（`border-width: 0`） |
| 悬停 | 背景加深，边框出现 |
| 聚焦 | `ring-2 ring-focus` |
| 无效 | `outline-1 outline-danger` |
| 最小宽度 | `min-w-60` |

### 卡片

| 属性 | 值 |
|---|---|
| 圆角 | `rounded-3xl` |
| 背景 | `bg-surface` |
| 阴影 | `shadow-surface` |
| 内边距 | `p-4`（默认）或 `p-8`（登录/注册） |
| 布局 | `flex flex-col` |

### 模态框

| 属性 | 值 |
|---|---|
| 遮罩 | `fixed inset-0 z-50 bg-background/25 backdrop-blur` |
| 容器 | `border border-border` |
| 对话框 | `bg-black` |
| 尺寸 | `full` / `cover` / `md` |

### 表格

- 表头：`bg-surface`，`rounded-full`，`text-sm font-bold`
- 表行：`border-b border-border`
- 操作列：`w-20`，图标按钮

---

## 交互模式

### 过渡动画

| 场景 | 时长 | 缓动 |
|---|---|---|
| 按钮点击 | 250ms | `ease-out-quart` |
| 输入框聚焦 | 150ms | `ease-smooth` |
| 悬停效果 | 300ms | `ease` |
| 图片淡入 | 1000ms | `opacity` 过渡 |
| 模态框 | HeroUI 默认 | 淡入 + 缩放 |

### 主页 CTA

- 悬停：`scale(105%)`, `bg-white/10`, `shadow-2xl`
- 箭头：`group-hover:w-7` 从 0 展开
- `backdrop-blur-md` 玻璃拟态

### 工具栏

- 桌面端：固定在 gallery 页面顶部，`sticky` 定位，`backdrop-blur-lg`
- 移动端：底部导航，`fixed bottom-4 left-1/2 -translate-x-1/2`

---

## 响应式设计

项目不依赖 CSS 媒体查询，而是通过 `react-device-detect` 的 `isMobile`、`BrowserView`、`MobileView` 在 React 层分流。

### 桌面端

- 导航栏：水平 Logo + 链接 + 头像下拉
- 照片列表：表格（hinter/photo）
- 相册：flex-wrap 网格
- 编辑面板：双栏（表单 + 预览）

### 移动端

- 导航栏：汉堡菜单 + 头像
- 照片列表：卡片式列表（封面 + 标题 + 操作）
- 编辑：全屏弹窗
- 相册：同上 flex-wrap，但减少列数

---

## 设计令牌参考

所有设计令牌由 HeroUI 的 CSS 自定义属性驱动，在 `@import "@heroui/styles"` 时自动注入。项目本身不定义额外的 CSS 变量或 Tailwind 主题配置。

### 缓动函数

| 变量 | 值 |
|---|---|
| `--ease-smooth` | `ease` |
| `--ease-out-fluid` | `cubic-bezier(0.32, 0.72, 0, 1)` |

### 焦点环

| Class | 值 |
|---|---|
| `focus-ring` | `ring-2 ring-focus ring-offset-0 ring-offset-background` |
| `focus-field-ring` | `ring-2 ring-focus ring-offset-0` |
| `invalid-field-ring` | `outline-1 outline-danger` + `ring-2 ring-danger` |

---

## 文件结构

```
app/
├── globals.css          # @import "tailwindcss"; @import "@heroui/styles"
├── layout.tsx           # 根布局：header + QueryClientProvider + @modal
├── config.ts            # MOBILE_HEADER_HEIGHT, BROWSER_HEADER_HEIGHT
├── store.ts             # Jotai atoms (user, token, setting)
├── typings.ts           # Photo, Exif, Setting, UserPlain 等接口
└── components/          # Modal, Confirm, Navbar
```

---

## 版本记录

| 日期 | 版本 | 变更 |
|---|---|---|
| 2026-05-23 | 1.0 | 初始设计文档 |
