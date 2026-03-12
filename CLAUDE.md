# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

这是一个基于 Turborepo Monorepo 架构的制造业成本核算与报价管理系统。采用前后端分离设计，使用 Fastify 5 后端和 Next.js 16 前端。

## Tech Stack

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16 + React 19 + TypeScript |
| 后端 | Fastify 5 + TypeScript |
| ORM | Prisma 6 |
| 数据库 | PostgreSQL 16 |
| 状态管理 | Zustand |
| 数据获取 | TanStack Query |
| UI 组件 | Radix UI + Tailwind CSS 4 |

## Monorepo Structure

```
cost-management-system/
├── apps/
│   ├── web/              # Next.js 前端 (端口 3002)
│   └── api/              # Fastify 后端 (端口 3003)
├── packages/
│   ├── database/         # Prisma schema (@cost/database)
│   └── shared-types/     # 共享类型 (@cost/shared-types)
├── turbo.json            # Monorepo 配置
└── pnpm-workspace.yaml   # pnpm workspace
```

## Development Commands

### Root Level Commands (pnpm)

```bash
# 开发 - 启动所有服务
pnpm dev              # 同时启动前后端
pnpm dev:api          # 仅后端 http://localhost:3003
pnpm dev:web          # 仅前端 http://localhost:3002

# 数据库操作
pnpm db:generate      # 生成 Prisma Client
pnpm db:migrate       # 创建/运行迁移
pnpm db:seed          # 运行种子数据
pnpm db:studio        # 打开 Prisma Studio

# 构建与检查
pnpm build            # 构建所有应用
pnpm typecheck        # 类型检查
pnpm lint             # 代码检查
```

### Backend Commands (apps/api)

```bash
cd apps/api

# 开发
pnpm dev              # 开发模式 (tsx watch)
pnpm start            # 生产模式 (node dist)

# 测试
pnpm test             # 运行所有测试
pnpm test:watch       # 监听模式
pnpm test:coverage    # 覆盖率报告

# 单个测试文件
pnpm vitest run src/controllers/user.controller.test.ts
pnpm vitest run -t "should create user"  # 按名称运行
```

### Frontend Commands (apps/web)

```bash
cd apps/web

# 开发
pnpm dev              # Next.js 开发服务器 (端口 3002)

# 测试
pnpm test             # 运行所有测试
pnpm test:watch       # 监听模式
```

## Architecture

### Backend Architecture (apps/api)

采用分层架构模式：

```
routes/ → controllers/ → services/ → repositories/
```

**依赖规则**: 上层可调用下层，下层不可调用上层。

#### Route Structure

Routes 在 `src/routes/index.ts` 中统一注册，使用 Fastify plugin 模式：

```typescript
// routes/users.routes.ts
export const userRoutes = async (app: FastifyInstance) => {
  app.get('/', userController.getList)
  app.get('/:id', userController.getById)
  app.post('/', userController.create)
}
```

#### Controller Pattern

Controllers 处理 HTTP 请求/响应，使用统一的响应工具函数：

```typescript
// utils/http-response.ts
sendSuccess(reply, data, meta?)     // 200 成功
sendError(reply, 400, code, errors?) // 错误响应
sendNotFound(reply, resourceName)    // 404
```

#### Service Pattern

Services 继承 `BaseService`，通过 `this.prisma` 访问数据库：

```typescript
export class UserService extends BaseService {
  async getList(pagination: PaginationParams) {
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ ... }),
      this.prisma.user.count({ ... })
    ])
    return { data, meta: { total, page, pageSize } }
  }
}
```

#### Validation

使用 Zod 进行输入验证，schema 定义在 `src/lib/schemas.ts`：

```typescript
const createUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
})
```

### Frontend Architecture (apps/web)

使用 Next.js App Router 模式：

```
app/
├── (app)/                # 分组路由 (受保护)
│   ├── dashboard/
│   ├── quotations/
│   └── ...
├── login/                # 登录页面
├── layout.tsx            # 根布局
└── globals.css           # 全局样式
```

#### State Management

- **Server State**: TanStack Query (`hooks/use-query-*`)
- **Client State**: Zustand (`stores/*.ts`)

#### API Client

使用 Axios，配置在 `lib/axios.ts`，自动处理 token 和错误。

### Database Schema (packages/database)

核心模型关系：

```
Model ──┬── BomMaterial ── Material
      ├── PackagingConfig ──┬── ProcessConfig
      │                     └── PackagingMaterial
      └── Quotation

Quotation ──┬── Customer
           ├── Regulation
           └── PackagingConfig
```

#### Key Models

- **User**: 用户 (roles: admin/purchaser/producer/reviewer/salesperson/readonly)
- **Quotation**: 报价单 (status: draft/submitted/approved/rejected)
- **Material**: 原材料 (支持 multiply/divide 计算类型)
- **Model**: 产品型号 (category: mask/half_mask)
- **PackagingConfig**: 包装配置 (关联 ProcessConfig, PackagingMaterial)
- **StandardCost**: 标准成本 (版本控制)

## Environment Setup

### Required Environment Variables

```bash
# .env (root)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cost_management
JWT_SECRET=your-jwt-secret

# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3003/api/v1
```

### Initial Setup

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 配置数据库连接

# 3. 数据库初始化
pnpm db:migrate
pnpm db:seed

# 4. 启动开发
pnpm dev
```

## Testing

### Backend Testing (Vitest)

- **Unit Tests**: `src/**/*.test.ts`
- **Test Environment**: Node.js
- **Mocking**: 使用 `vi.fn()` 对 services 和 repositories 进行 mock

**Test Patterns**:

```typescript
// Controller 测试
vi.mock('../services/user.service.js', () => ({
  userService: {
    getList: vi.fn(),
    getById: vi.fn(),
  }
}))

// 验证响应
expect(mockReply.send).toHaveBeenCalledWith(
  expect.objectContaining({ success: true })
)
```

### Test Accounts

- 管理员: `admin` / `admin123`
- 采购员: `purchaser` / `purchaser123`
- 审核员: `reviewer` / `reviewer123`

## Key Conventions

### Commit Rules

**⚠️ 重要：每次 commit 前必须经过 Lucas 同意！**

执行 `git commit` 前必须：
1. 向 Lucas 展示即将提交的文件列表 (`git diff --cached --name-only`)
2. 说明 commit 的类型和内容
3. 获得 Lucas 明确确认后方可执行

**禁止行为：**
- 未经同意直接执行 commit
- 使用 `--no-verify` 跳过 hooks
- 强制推送 (`--force`) 到 main 分支

---

### Response Format

统一 API 响应格式：

```typescript
// 成功
{ success: true, data: {...}, meta: {...} }

// 错误
{ success: false, message: '...', code: 'ERROR_CODE', errors: {...} }
```

### Error Codes

在 `src/utils/error-codes.ts` 中定义，包括：
- `VALIDATION_ERROR`: 400
- `NOT_FOUND`: 404
- `CONFLICT`: 409 (重复数据)
- `INVALID_STATUS`: 400 (状态转换错误)

### Status Code Rules

- `GET` 成功: 200
- `POST` 创建成功: 201
- `PUT/PATCH` 成功: 200
- `DELETE` 成功: 200
- 重复数据: 409
- 验证错误: 400

## Project-Level Skills & Hooks

项目根目录包含本地 skills 和 hooks：

```
skills/          # 25个本地化 Skills
├── brainstorming/
├── test-driven-development/
├── react-best-practices/
├── api-design-principles/
├── postgresql-table-design/
└── ...

hooks/           # 自动化工具
├── skill-activation.py      # 自动推荐项目级 Skills
├── insight-capture.js       # 记录项目经验教训
├── experience-promoter.js   # 经验级别自动晋升
└── pre-commit-check.sh      # 提交前检查
```

**使用示例**:
```bash
# 记录项目经验
node hooks/insight-capture.js create "场景" "问题" "解决方案"

# 测试 skill 触发
echo '{"prompt": "帮我debug报价单"}' | python hooks/skill-activation.py
```

## Known Issues

### Windows + Turbopack

在 Windows 上使用 Turbopack 可能导致 `exit code: 0xc0000142`。已禁用 Turbopack (`--turbopack=false`)。

### Database Compatibility

新架构使用 Prisma ORM（camelCase + `@map` 映射），与旧架构（snake_case）不兼容。迁移旧数据需要转换。

## API Endpoints

主要端点前缀: `/api/v1`

- `POST /auth/login` - 登录
- `GET /auth/me` - 当前用户
- `GET /dashboard/stats` - 仪表盘
- `GET|POST /quotations` - 报价单
- `POST /quotations/:id/submit` - 提交审核
- `POST /quotations/:id/approve` - 审核通过
- `POST /quotations/:id/reject` - 审核拒绝

Swagger 文档: http://localhost:3003/documentation
