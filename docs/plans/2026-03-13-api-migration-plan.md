# 真实API编写和调用实施方案

> **项目**: cost_demo_2 - 成本核算管理系统
> **目标**: 将前端硬编码数据迁移到真实API调用
> **日期**: 2026-03-13
> **状态**: ✅ 全部完成 (2026-03-13)

---

## 🔴 关键问题：端口配置不一致

### 问题描述

**前端配置** (`apps/web/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3003/api/v1
```

**后端配置** (`apps/api/.env`):
```bash
PORT=3000
```

**结果**: 前端请求3003端口，后端运行在3000端口，API调用失败。

### 修复方案

**文件**: `apps/web/.env.local`

```bash
# 修改前
NEXT_PUBLIC_API_URL=http://localhost:3003/api/v1

# 修改后
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### 端口配置全景

| 服务 | 端口 | 配置位置 |
|------|------|----------|
| 前端 | 5174 | `apps/web/package.json` 中固定 |
| 后端 | 3000 | `apps/api/.env` 中 PORT=3000 |
| API地址 | http://localhost:3000/api/v1 | 修复后的 `.env.local` |

---

## 项目真实情况分析

### 最终状态

| 组件 | 状态 | 说明 |
|------|------|------|
| 后端API | ✅ 已运行 | 端口3000，Swagger文档 http://localhost:3000/documentation |
| API客户端 | ✅ 已配置 | `lib/api.ts` 完整配置，CRUD工厂模式 |
| 前端页面 | ✅ 已迁移 | 14/15 页面使用真实API |
| quotations表 | ✅ 有数据 | 29条记录从旧库迁移 |
| 其他表 | ✅ 有数据 | users/customers/materials/models等均有真实数据 |

### 迁移统计

| 类别 | 数量 | 状态 |
|------|------|------|
| 迁移的页面 | 14 | ✅ |
| 创建的Hooks | 9 | ✅ |
| 数据迁移记录 | 29 | ✅ |
| 保留硬编码 | 1 (system) | ⚠️ 缺后端API |

### 硬编码数据 vs API对比

```typescript
// ❌ 当前做法（apps/web/app/(app)/cost/records/page.tsx:46）
import { quotations, regulations, getQuotationWithDetails } from '@/lib/data'
const allQuotations = quotations.map(getQuotationWithDetails)  // 静态数据

// ✅ 正确做法（已存在，只需切换）
import { useQuotations } from '@/hooks/api/use-quotations'
const { quotations, isLoading, error } = useQuotations()  // 真实API
```

---

## 实施方案（渐进式迁移）

### Phase 1: 修复端口配置 + API层就绪 ✅

#### 步骤1: 修复端口配置
**文件**: `apps/web/.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

#### 步骤2: 将前端页面从硬编码切换到API调用

**目标文件**: `apps/web/app/(app)/cost/records/page.tsx`

##### 变更内容

```typescript
// 1. 替换导入
// 删除：
import { quotations, regulations, getQuotationWithDetails } from '@/lib/data'

// 添加：
import { useQuotations } from '@/hooks/api/use-quotations'
import { useRegulations } from '@/hooks/api/use-regulations'
import { Skeleton } from '@/components/ui/skeleton'

// 2. 替换数据获取
// 删除：
const allQuotations = quotations.map(getQuotationWithDetails)

// 添加：
const { quotations, isLoading } = useQuotations()
const { regulations } = useRegulations()

// 3. 添加loading状态
if (isLoading) {
  return <Skeleton className="h-96 w-full" />
}
```

##### 需要创建的文件

**文件**: `apps/web/hooks/api/use-regulations.ts`

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { regulationApi } from '@/lib/api'

export function useRegulations() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['regulations'],
    queryFn: async () => {
      const response = await regulationApi.getList()
      return response.data?.data ?? []
    },
  })

  return {
    regulations: data,
    isLoading,
    error,
  }
}
```

#### 影响评估

| 方面 | 影响 |
|------|------|
| **功能** | 页面将显示"暂无数据"（因为quotations表为空） |
| **体验** | 增加Loading状态，体验更完整 |
| **风险** | 极低，API层已完整，可随时回滚 |
| **工作量** | 约30分钟 |

---

### Phase 2: 数据修复 ✅

如果需要在页面上看到真实报价单数据，需要先修复 quotations 表数据。

#### 问题分析

迁移失败的29条记录原因：
- `customer_id` 为 NULL
- `shipping_type` 为 NULL

#### 修复方案

**文件**: `scripts/migrate-quotations.ts`

修复步骤：
1. 检查默认客户是否存在，不存在则创建
2. 通过 customer_name 匹配已有客户
3. 剩余空值使用默认客户填充
4. 填充 shipping_type 默认值 fcl20
5. 处理 packaging_config_id 外键关联

**执行命令**:
```bash
npx tsx scripts/migrate-quotations.ts
```

#### 迁移结果

| 指标 | 数值 |
|------|------|
| 源记录数 | 29 条 |
| 成功迁移 | 29 条 |
| 失败 | 0 条 |

---

### Phase 3: 其他页面迁移 ✅

使用相同模式迁移其他硬编码页面：

#### 基础数据页面 ✅

| 页面 | 状态 | Hook |
|------|------|------|
| `master/customers/page.tsx` | ✅ 已迁移 | useCustomers |
| `master/materials/page.tsx` | ✅ 已迁移 | useMaterials |
| `master/regulations/page.tsx` | ✅ 已迁移 | useRegulations |
| `master/models/page.tsx` | ✅ 已迁移 | useModels, useRegulations |

#### 业务功能页面 ✅

| 页面 | 状态 | Hook |
|------|------|------|
| `cost/[id]/page.tsx` | ✅ 已迁移 | useQuotation |
| `cost/new/page.tsx` | ✅ 已迁移 | useRegulations, useCustomers, useModels, useQuotations |
| `cost/standard/page.tsx` | ✅ 已迁移 | useStandardCosts |
| `cost/compare/page.tsx` | ✅ 已迁移 | useQuotations |
| `review/pending/page.tsx` | ✅ 已迁移 | useQuotations (status: submitted) |
| `review/completed/page.tsx` | ✅ 已迁移 | useQuotations (status: approved/rejected) |
| `notifications/page.tsx` | ✅ 已迁移 | useNotifications |

#### 系统页面

| 页面 | 状态 | 说明 |
|------|------|------|
| `system/page.tsx` | ⚠️ 保留硬编码 | 后端缺少 /system-config API |

#### 复杂数据页面 ✅

| 页面 | 状态 | Hook |
|------|------|------|
| `master/bom/page.tsx` | ✅ 已迁移 | useBom |
| `master/processes/page.tsx` | ✅ 已迁移 | usePackaging |
| `master/packaging/page.tsx` | ✅ 已迁移 | usePackaging |

---

## 迁移完成汇总

### 创建的 Hooks (9个)

```
apps/web/hooks/api/
├── use-customers.ts        # 客户数据
├── use-materials.ts        # 原料数据
├── use-models.ts           # 型号数据
├── use-regulations.ts      # 法规数据
├── use-quotations.ts       # 报价单数据
├── use-standard-costs.ts   # 标准成本数据
├── use-notifications.ts    # 通知数据
├── use-bom.ts              # BOM数据
├── use-packaging.ts        # 包装配置数据
└── index.ts                # 统一导出
```

### 迁移的页面 (14个)

| 类别 | 页面 |
|------|------|
| **基础数据** | customers, materials, regulations, models |
| **成本分析** | cost/records, cost/[id], cost/new, cost/standard, cost/compare |
| **审核流程** | review/pending, review/completed |
| **其他** | notifications, bom, processes, packaging |

### 数据迁移

| 表 | 记录数 | 来源 |
|----|-------|------|
| quotations | 29 | cost_analysis (旧库) |
| customers | 17 | 原有 + 默认客户 |
| users | 8 | 原有 |
| materials | N | 原有 |
| models | 23 | 原有 |

---

## 迁移模式

每个页面的迁移遵循以下模式：

### 1. 创建对应的 Hook（如不存在）

```typescript
// hooks/api/use-{resource}.ts
export function useCustomers() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await customerApi.getList()
      return response.data?.data ?? []
    },
  })
  return { customers: data, isLoading, error }
}
```

### 2. 修改页面组件

```typescript
// 1. 替换导入
- import { customers } from '@/lib/data'
+ import { useCustomers } from '@/hooks/api/use-customers'
+ import { Skeleton } from '@/components/ui/skeleton'

// 2. 在组件中使用
export default function Page() {
-  // 直接使用静态数据
-  const data = customers

+  // 使用API数据
+  const { customers, isLoading } = useCustomers()
+
+  if (isLoading) {
+    return <Skeleton className="h-96 w-full" />
+  }

  return (...)
}
```

---

## API 层状态

### 已配置的 API

| API | 端点 | 状态 |
|-----|------|------|
| authApi | /auth | ✅ |
| userApi | /users | ✅ |
| customerApi | /customers | ✅ |
| materialApi | /materials | ✅ |
| modelApi | /models | ✅ |
| regulationApi | /regulations | ✅ |
| bomApi | /bom | ✅ |
| packagingApi | /packaging-configs | ✅ |
| quotationApi | /quotations | ✅ |
| standardCostApi | /standard-costs | ✅ |
| notificationApi | /notifications | ✅ |
| dashboardApi | /dashboard | ✅ |

---

## 旧架构文档价值（docs/summary/）

| 文档 | 内容 | 对接API的帮助 |
|------|------|--------------|
| `api-endpoints.md` | 完整API端点列表 | 确认每个页面需要调用的API |
| `database-schema.md` | 数据库模型关系 | 理解数据关联，正确展示关联数据 |
| `cost-analysis.md` | 成本分析业务流程 | 理解quotations数据结构 |
| `master-data.md` | 基础数据模块 | customers/materials/models等 |
| `review-workflow.md` | 审核流程 | 理解状态流转（draft→submitted→approved） |

这些文档确认了系统有完整的**成本分析→提交审核→审核通过→标准成本**的业务流程。

---

## 执行后项目状态对比

### 执行前
```
┌──────────────────────────────────────┐
│ 前端页面 (硬编码数据)                  │
│   - 显示演示数据 QT-2026-0001         │
│   - 无Loading状态                    │
│   - 无错误处理                       │
└──────────────────────────────────────┘
           │
           ❌ 不连接 (端口不匹配+硬编码)
           │
┌──────────────────────────────────────┐
│ 后端API (运行中)                      │
│   - 端口3000                         │
│   - 连接 cost_analysis_new           │
└──────────────────────────────────────┘
```

### Phase 1 执行后
```
┌──────────────────────────────────────┐
│ 前端页面 (API调用)                    │
│   - 调用 http://localhost:3000/api/v1│
│   - 显示Loading骨架屏                │
│   - 显示"暂无数据"（因表为空）        │
└──────────────────────────────────────┘
           │
           ✅ 连接
           │
┌──────────────────────────────────────┐
│ 后端API (运行中)                      │
│   - 端口3000                         │
│   - 返回空数组 (quotations表为空)     │
│   - 其他端点正常                      │
└──────────────────────────────────────┘
```

### Phase 2 执行后
```
┌──────────────────────────────────────┐
│ 前端页面 (API调用)                    │
│   - 显示真实报价单数据                │
│   - 支持分页/筛选                     │
│   - 支持提交/审核操作                 │
└──────────────────────────────────────┘
           │
           ✅ 连接
           │
┌──────────────────────────────────────┐
│ 后端API (运行中)                      │
│   - 端口3000                         │
│   - 返回真实数据                      │
│   - 完整CRUD支持                     │
└──────────────────────────────────────┘
```

---

## 文件清单

### Phase 1 已修改的文件

| 文件 | 变更 | 说明 |
|------|------|------|
| `apps/web/.env.local` | 修改 | 端口3003→3000 |
| `apps/web/app/(app)/cost/records/page.tsx` | 修改 | 替换硬编码为API调用 |

### Phase 1 已创建的文件

| 文件 | 用途 |
|------|------|
| `apps/web/hooks/api/use-regulations.ts` | 法规数据API hook |

### Phase 2 创建的文件

| 文件 | 用途 |
|------|------|
| `scripts/migrate-quotations.ts` | 数据迁移脚本 |

### Phase 3 已修改的页面

| 文件 | Hook | 状态 |
|------|------|------|
| `master/customers/page.tsx` | useCustomers | ✅ |
| `master/materials/page.tsx` | useMaterials | ✅ |
| `master/regulations/page.tsx` | useRegulations | ✅ |
| `master/models/page.tsx` | useModels, useRegulations | ✅ |
| `cost/[id]/page.tsx` | useQuotation | ✅ |
| `cost/new/page.tsx` | useRegulations, useCustomers, useModels, useQuotations | ✅ |
| `cost/standard/page.tsx` | useStandardCosts | ✅ |
| `cost/compare/page.tsx` | useQuotations | ✅ |
| `review/pending/page.tsx` | useQuotations | ✅ |
| `review/completed/page.tsx` | useQuotations | ✅ |
| `notifications/page.tsx` | useNotifications | ✅ |
| `system/page.tsx` | - | ⚠️ 缺API |
| `master/bom/page.tsx` | useBom | ✅ |
| `master/processes/page.tsx` | usePackaging | ✅ |
| `master/packaging/page.tsx` | usePackaging | ✅ |

### Phase 3 创建的 Hooks

| 文件 | 说明 |
|------|------|
| `hooks/api/use-customers.ts` | 客户数据API hook |
| `hooks/api/use-materials.ts` | 原料数据API hook |
| `hooks/api/use-models.ts` | 型号数据API hook |
| `hooks/api/use-standard-costs.ts` | 标准成本API hook |
| `hooks/api/use-notifications.ts` | 通知数据API hook |
| `hooks/api/use-bom.ts` | BOM数据API hook |
| `hooks/api/use-packaging.ts` | 包装配置API hook |

---

## 验证方法

### 验证端口修复成功

```bash
# 1. 启动前后端
pnpm dev

# 2. 检查后端健康
curl http://localhost:3000/health
# 预期: { "status": "ok", ... }

# 3. 登录获取token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 4. 访问报价单列表
curl http://localhost:3000/api/v1/quotations \
  -H "Authorization: Bearer <token>"
# 预期返回: { "data": [...], "meta": {...} }

# 5. 访问前端页面
open http://localhost:5174/cost/records
# 预期: 显示Loading后显示真实数据
```

---

## 总结

### 执行顺序

| 顺序 | 任务 | 目的 | 工作量 | 状态 |
|------|------|------|--------|------|
| 1 | 修复端口配置 | 让前后端能通信 | 1分钟 | ✅ |
| 2 | Phase 1: API对接 | 建立正确架构 | 30分钟 | ✅ |
| 3 | Phase 2: 数据修复 | 查看真实数据 | 1-2小时 | ✅ |
| 4 | Phase 3: 迁移其他页面 | 全面对接API | 14/15页面 | ✅ |

### 关键建议

- **立即修复端口配置**：这是前提，否则一切API调用都会失败
- **立即执行Phase 1**：让代码架构正确，即使数据为空也是正确的空状态
- **保留lib/data.ts**：不要删除，作为备份和开发测试数据使用
- **参考docs/summary/**：这些文档完整记录了业务规则和API设计

---

**最后更新**: 2026-03-13 - Phase 1/2/3 全部完成
