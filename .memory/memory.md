# 项目记忆 - cost_demo_2

> 成本分析管理系统 v2 - 项目级记忆档案
> **最后更新**: 2026-03-13
> **当前状态**: 🟡 数据库迁移完成，前端待对接真实API

---

## 项目概览

- **项目名称**: 成本分析管理系统 v2
- **项目路径**: `E:\desktop\cost_demo_2`
- **架构类型**: Turborepo Monorepo
- **创建时间**: 2026-03
- **当前状态**: 🟡 **数据层完成** - 核心数据已迁移，前端使用硬编码演示数据

---

## 项目规范

| 文件类型 | 存放位置 |
|---------|----------|
| 交接文档 | `docs/HANDOFF.md` |
| 项目记忆 | `.memory/memory.md` |
| 计划文档 | `docs/plans/` |
| 总结文档 | `docs/summary/` |

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js + React | 16 + 19 |
| 前端样式 | Tailwind CSS | 4.x |
| 后端框架 | Fastify | 5.x |
| ORM | Prisma | 6.x |
| 数据库 | PostgreSQL | 16 |
| 状态管理 | Zustand | 5.x |
| 数据获取 | TanStack Query | 5.x |
| 构建工具 | Turborepo | 2.x |
| 包管理 | pnpm | 9.x |

---

## 数据库状态

### 三个数据库

| 数据库 | 用途 | 状态 |
|--------|------|------|
| `cost_analysis` | 旧库（真实业务数据） | 源数据，保留只读 |
| `cost_analysis_v2` | 原目标库（演示数据） | 已清空 |
| `cost_analysis_new` | 新目标库（迁移后的真实数据） | ✅ **当前使用** |

### 迁移结果

```
源: cost_analysis → 目标: cost_analysis_new
总记录: 731 → 成功: 699 (95.6%)
```

| 表名 | 旧库 | 新库 | 状态 |
|------|------|------|------|
| users | 8 | 8 | ✅ 完整 |
| regulations | 3 | 3 | ✅ 完整 |
| materials | 50 | 50 | ✅ 完整 |
| customers | 16 | 16 | ✅ 完整 |
| models | 23 | 23 | ✅ 完整 |
| bom_materials | 90 | 90 | ✅ 完整 |
| packaging_configs | 63 | 63 | ✅ 完整 |
| process_configs | 322 | 322 | ✅ 完整 |
| packaging_materials | 92 | 92 | ✅ 完整 |
| standard_costs | 1 | 1 | ✅ 完整 |
| system_config | 34 | 31 | ⚠️ 3条JSON格式问题 |
| **quotations** | **29** | **0** | ❌ 未迁移(外键约束) |

### 后端数据库配置

```
apps/api/.env:
DATABASE_URL="postgresql://postgres:1998@localhost:5432/cost_analysis_new"
```

---

## 已知问题

### P1: 前端使用硬编码演示数据

**位置**: `apps/web/lib/data.ts`

**问题**: 成本记录页面(`app/(app)/cost/records/page.tsx`)第46行导入硬编码数据：
```typescript
import { quotations, regulations, getQuotationWithDetails } from '@/lib/data'
```

**解决方案**: 改为使用 `useQuotations` hook：
```typescript
import { useQuotations } from '@/hooks/api/use-quotations'
```

### P1: 登录密码验证失败

**症状**: admin/admin123 登录返回 "用户名或密码错误"

**可能原因**:
- bcrypt 版本不兼容
- 后端连接的数据库不正确
- 需要重启后端服务

**验证**: 后端配置正确连接 `cost_analysis_new`

### P2: quotations 表迁移失败

**原因**:
- 旧库 customer_id 为 NULL
- shipping_type 为 NULL
- 外键约束违反

**解决方案**: 运行修复脚本 `scripts/fix-quotations-customer.ts`

---

## 待完成任务

| 优先级 | 任务 | 说明 |
|--------|------|------|
| P0 | 前端API对接 | 替换 lib/data.ts 硬编码为真实API调用 |
| P1 | 登录问题修复 | 验证后端数据库连接和密码验证 |
| P2 | quotations 迁移 | 修复29条报价单记录的空值问题 |
| P3 | 测试修复 | 8个控制器测试失败 |

---

## 迁移脚本清单

| 脚本 | 用途 | 状态 |
|------|------|------|
| `scripts/migrate-data.ts` | 主迁移脚本 | ✅ 已运行 |
| `scripts/migration-config.ts` | 字段映射配置 | ✅ |
| `scripts/analyze-quotations.ts` | 分析旧库数据质量 | ✅ |
| `scripts/fix-quotations-customer.ts` | 修复quotations空值 | ⏳ 待运行 |
| `scripts/adapt-schema.sql` | Schema适配 | ⏳ |
| `scripts/validate-migration.ts` | 迁移验证 | ✅ |

---

## 默认账号

迁移后的真实用户：
- **admin** / ? (密码需修复)
- **KEN** (E50491)
- **winky** (E50494)
- **Heidi** (E50490)
- 等共8个用户

---

## 关键文件

```
后端配置: apps/api/.env
前端数据: apps/web/lib/data.ts  ← 硬编码演示数据
API Hooks: apps/web/hooks/api/use-quotations.ts
迁移脚本: scripts/migrate-data.ts
```

---

## 历史记录

### 2026-03-13 - 数据库迁移完成

**进展**:
1. ✅ 创建 `cost_analysis_new` 数据库
2. ✅ 从旧库迁移 699/731 条记录
3. ✅ 后端配置连接新数据库
4. ⏳ 前端待对接真实API

**发现问题**:
- 页面显示演示数据（QT-2026-0001等）
- 实际数据库有真实数据（QSS SAFETY, PHOL DHANY等客户）
- 前端使用 lib/data.ts 硬编码数据而非API

### 2026-03-12 - 迁移脚本完成

- 创建完整迁移脚本
- 实现UUID转换机制
- 处理字段映射和枚举转换

---

*最后更新: 2026-03-13*
*状态: 🟡 数据层完成，前端待对接*
