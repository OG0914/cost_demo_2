# API接口文档

> 本文档详细说明成本分析管理系统的API接口，用于指导新架构的接口开发。

---

## 一、接口规范

### 1.1 基础信息

- **基础URL**：`/api`
- **协议**：HTTPS
- **数据格式**：JSON
- **字符编码**：UTF-8
- **认证方式**：Bearer Token (JWT)

### 1.2 请求规范

**请求头**：
```
Content-Type: application/json
Authorization: Bearer {token}
```

**请求方法**：
- GET：获取资源
- POST：创建资源
- PUT：更新资源
- DELETE：删除资源

### 1.3 响应规范

**成功响应**：
```json
{
  "success": true,
  "data": { },
  "message": "操作成功"
}
```

**失败响应**：
```json
{
  "success": false,
  "message": "错误信息",
  "code": "ERROR_CODE"
}
```

**分页响应**：
```json
{
  "success": true,
  "data": {
    "list": [ ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### 1.4 错误码

| 错误码 | 说明 | HTTP状态码 |
|--------|------|------------|
| E0000 | 未知错误 | 500 |
| E0001 | 参数验证错误 | 400 |
| E0002 | 资源不存在 | 404 |
| E0003 | 未授权 | 401 |
| E0004 | 无权限 | 403 |
| E1001 | 用户不存在 | 404 |
| E1002 | 密码错误 | 400 |
| E1003 | 数据已存在 | 409 |
| E1004 | 关联数据不存在 | 400 |
| E1005 | 表不存在 | 500 |
| E2001 | 成本分析不存在 | 404 |
| E2002 | 状态不允许操作 | 400 |
| E2003 | 不能审核自己的成本分析 | 403 |
| E2004 | 成本分析已被处理 | 409 |

---

## 二、认证模块

### 2.1 用户登录

**接口信息**：
- 方法：POST
- URL：`/api/auth/login`
- 权限：公开

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应数据**：
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "admin",
      "realName": "管理员",
      "roleCode": "admin",
      "avatar": ""
    }
  }
}
```

### 2.2 获取当前用户

**接口信息**：
- 方法：GET
- URL：`/api/auth/me`
- 权限：需要登录

**响应数据**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "realName": "管理员",
    "roleCode": "admin",
    "roleName": "管理员",
    "permissions": ["cost:view", "cost:create", ...]
  }
}
```

### 2.3 修改密码

**接口信息**：
- 方法：PUT
- URL：`/api/auth/password`
- 权限：需要登录

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| oldPassword | string | 是 | 旧密码 |
| newPassword | string | 是 | 新密码 |

---

## 三、成本分析模块

### 3.1 获取成本分析列表

**接口信息**：
- 方法：GET
- URL：`/api/cost/quotations`
- 权限：cost:view

**查询参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认10 |
| keyword | string | 否 | 搜索关键词（编号/客户/型号）|
| status | string | 否 | 状态筛选 |
| salesType | string | 否 | 销售类型筛选 |

**响应数据**：
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "quotationNo": "QT202403001",
        "status": "approved",
        "salesType": "domestic",
        "customerName": "ABC公司",
        "modelName": "KN95-001",
        "quantity": 10000,
        "finalPrice": 15.50,
        "creatorName": "张三",
        "createdAt": "2024-03-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100
    }
  }
}
```

### 3.2 获取成本分析详情

**接口信息**：
- 方法：GET
- URL：`/api/cost/quotations/{id}`
- 权限：cost:view

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 成本分析ID |

**响应数据**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "quotationNo": "QT202403001",
    "status": "approved",
    "salesType": "domestic",
    "customerId": 1,
    "customerName": "ABC公司",
    "customerRegion": "广东",
    "modelId": 1,
    "modelName": "KN95-001",
    "regulationId": 1,
    "regulationName": "GB2626-2019",
    "packagingConfigId": 1,
    "packagingConfigName": "标准彩盒配置A",
    "quantity": 10000,
    "unit": "piece",
    "baseCost": 10.50,
    "overheadRate": 20.00,
    "overheadPrice": 13.125,
    "finalPrice": 15.50,
    "vatRate": 13.00,
    "creatorId": 1,
    "creatorName": "张三",
    "createdAt": "2024-03-01T10:00:00Z",
    "items": {
      "materials": [...],
      "processes": [...],
      "packaging": [...]
    },
    "customFees": [...],
    "profitTiers": [...]
  }
}
```

### 3.3 创建成本分析

**接口信息**：
- 方法：POST
- URL：`/api/cost/quotations`
- 权限：cost:create

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| salesType | string | 是 | 销售类型：domestic/export |
| customerId | number | 是 | 客户ID |
| customerName | string | 是 | 客户名称 |
| modelId | number | 是 | 型号ID |
| packagingConfigId | number | 是 | 包装配置ID |
| quantity | number | 是 | 数量 |
| unit | string | 是 | 单位 |
| items | array | 是 | 明细项 |
| customFees | array | 否 | 自定义费用 |
| profitTiers | array | 否 | 利润档位 |

**响应数据**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "quotationNo": "QT202403001",
    "status": "draft"
  },
  "message": "创建成功"
}
```

### 3.4 更新成本分析

**接口信息**：
- 方法：PUT
- URL：`/api/cost/quotations/{id}`
- 权限：cost:edit

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 成本分析ID |

**请求参数**：同创建接口

### 3.5 删除成本分析

**接口信息**：
- 方法：DELETE
- URL：`/api/cost/quotations/{id}`
- 权限：cost:delete

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 成本分析ID |

### 3.6 提交审核

**接口信息**：
- 方法：POST
- URL：`/api/cost/quotations/{id}/submit`
- 权限：cost:submit

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 成本分析ID |

### 3.7 计算成本

**接口信息**：
- 方法：POST
- URL：`/api/cost/calculate`
- 权限：需要登录

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| salesType | string | 是 | 销售类型 |
| quantity | number | 是 | 数量 |
| items | array | 是 | 明细项 |
| customFees | array | 否 | 自定义费用 |

**响应数据**：
```json
{
  "success": true,
  "data": {
    "baseCost": 10.50,
    "overheadPrice": 13.125,
    "finalPrice": 15.50,
    "materialTotal": 5.00,
    "processTotal": 3.00,
    "packagingTotal": 2.00,
    "freightCost": 0.50
  }
}
```

### 3.8 获取包装配置列表

**接口信息**：
- 方法：GET
- URL：`/api/cost/packaging-configs`
- 权限：需要登录

**查询参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| modelId | number | 否 | 型号ID |

### 3.9 获取包装配置详情

**接口信息**：
- 方法：GET
- URL：`/api/cost/packaging-configs/{id}/details`
- 权限：需要登录

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 包装配置ID |

**响应数据**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "标准彩盒配置A",
    "packagingType": "standard_box",
    "layer1Qty": 10,
    "layer2Qty": 10,
    "layer3Qty": 50,
    "cbm": 0.0456,
    "processes": [...],
    "materials": [...]
  }
}
```

### 3.10 获取计算规则

**接口信息**：
- 方法：GET
- URL：`/api/cost/calculation-rules`
- 权限：需要登录

**响应数据**：
```json
{
  "success": true,
  "data": {
    "maskCoefficient": 0.97,
    "halfMaskCoefficient": 0.99,
    "laborCoefficient": 1.56,
    "overheadRate": 0.20,
    "vatRate": 0.13,
    "exchangeRate": 7.2,
    "insuranceRate": 0.003,
    "rules": [
      {
        "modelCategory": "mask",
        "calculationType": "body",
        "formula": "multiply",
        "coefficient": 0.97
      }
    ]
  }
}
```

---

## 四、审核模块

### 4.1 获取待审核列表

**接口信息**：
- 方法：GET
- URL：`/api/review/pending`
- 权限：review:view

**查询参数**：同成本分析列表

### 4.2 获取已审核列表

**接口信息**：
- 方法：GET
- URL：`/api/review/approved`
- 权限：review:view

**查询参数**：同成本分析列表

### 4.3 获取审核详情

**接口信息**：
- 方法：GET
- URL：`/api/review/{id}/detail`
- 权限：review:view

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 成本分析ID |

**响应数据**：
```json
{
  "success": true,
  "data": {
    "quotation": { },
    "history": [
      {
        "action": "submitted",
        "operatorName": "张三",
        "comment": "",
        "createdAt": "2024-03-01T10:00:00Z"
      }
    ]
  }
}
```

### 4.4 审核通过

**接口信息**：
- 方法：POST
- URL：`/api/review/{id}/approve`
- 权限：review:approve

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 成本分析ID |

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| comment | string | 否 | 批注 |

### 4.5 审核退回

**接口信息**：
- 方法：POST
- URL：`/api/review/{id}/reject`
- 权限：review:reject

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 成本分析ID |

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| reason | string | 是 | 退回原因 |
| comment | string | 否 | 批注 |

### 4.6 重新提交

**接口信息**：
- 方法：POST
- URL：`/api/review/{id}/resubmit`
- 权限：cost:submit

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 成本分析ID |

---

## 五、基础数据模块

### 5.1 原料管理

#### 5.1.1 获取原料列表

**接口信息**：
- 方法：GET
- URL：`/api/materials`
- 权限：需要登录

**查询参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| keyword | string | 否 | 搜索关键词 |
| category | string | 否 | 分类筛选 |
| materialType | string | 否 | 类型筛选 |

#### 5.1.2 获取原料详情

**接口信息**：
- 方法：GET
- URL：`/api/materials/{id}`
- 权限：需要登录

#### 5.1.3 创建原料

**接口信息**：
- 方法：POST
- URL：`/api/materials`
- 权限：master:material:manage

#### 5.1.4 更新原料

**接口信息**：
- 方法：PUT
- URL：`/api/materials/{id}`
- 权限：master:material:manage

#### 5.1.5 删除原料

**接口信息**：
- 方法：DELETE
- URL：`/api/materials/{id}`
- 权限：master:material:manage

#### 5.1.6 导入原料

**接口信息**：
- 方法：POST
- URL：`/api/materials/import`
- 权限：master:material:manage
- Content-Type：multipart/form-data

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | file | 是 | Excel文件 |

#### 5.1.7 导出原料

**接口信息**：
- 方法：POST
- URL：`/api/materials/export/excel`
- 权限：master:material:manage

### 5.2 型号管理

#### 5.2.1 获取型号列表

**接口信息**：
- 方法：GET
- URL：`/api/models`
- 权限：需要登录

#### 5.2.2 创建型号

**接口信息**：
- 方法：POST
- URL：`/api/models`
- 权限：master:model:manage

#### 5.2.3 更新型号

**接口信息**：
- 方法：PUT
- URL：`/api/models/{id}`
- 权限：master:model:manage

#### 5.2.4 删除型号

**接口信息**：
- 方法：DELETE
- URL：`/api/models/{id}`
- 权限：master:model:manage

#### 5.2.5 配置BOM

**接口信息**：
- 方法：PUT
- URL：`/api/models/{id}/bom`
- 权限：master:bom:manage

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| items | array | 是 | BOM明细 |

### 5.3 包装配置管理

#### 5.3.1 获取包装配置列表

**接口信息**：
- 方法：GET
- URL：`/api/packaging-configs`
- 权限：需要登录

#### 5.3.2 创建包装配置

**接口信息**：
- 方法：POST
- URL：`/api/packaging-configs`
- 权限：master:packaging:manage

#### 5.3.3 更新包装配置

**接口信息**：
- 方法：PUT
- URL：`/api/packaging-configs/{id}`
- 权限：master:packaging:manage

#### 5.3.4 删除包装配置

**接口信息**：
- 方法：DELETE
- URL：`/api/packaging-configs/{id}`
- 权限：master:packaging:manage

### 5.4 客户管理

#### 5.4.1 获取客户列表

**接口信息**：
- 方法：GET
- URL：`/api/customers`
- 权限：需要登录

#### 5.4.2 创建客户

**接口信息**：
- 方法：POST
- URL：`/api/customers`
- 权限：master:customer:manage

#### 5.4.3 更新客户

**接口信息**：
- 方法：PUT
- URL：`/api/customers/{id}`
- 权限：master:customer:manage

#### 5.4.4 删除客户

**接口信息**：
- 方法：DELETE
- URL：`/api/customers/{id}`
- 权限：master:customer:manage

### 5.5 法规管理

#### 5.5.1 获取法规列表

**接口信息**：
- 方法：GET
- URL：`/api/regulations`
- 权限：需要登录

#### 5.5.2 创建法规

**接口信息**：
- 方法：POST
- URL：`/api/regulations`
- 权限：master:regulation:manage

#### 5.5.3 更新法规

**接口信息**：
- 方法：PUT
- URL：`/api/regulations/{id}`
- 权限：master:regulation:manage

#### 5.5.4 删除法规

**接口信息**：
- 方法：DELETE
- URL：`/api/regulations/{id}`
- 权限：master:regulation:manage

---

## 六、系统配置模块

### 6.1 获取系统配置

**接口信息**：
- 方法：GET
- URL：`/api/configs`
- 权限：需要登录

**响应数据**：
```json
{
  "success": true,
  "data": {
    "maskCoefficient": 0.97,
    "halfMaskCoefficient": 0.99,
    "laborCoefficient": 1.56,
    "overheadRate": 0.20,
    "vatRate": 0.13,
    "exchangeRate": 7.2,
    "insuranceRate": 0.003
  }
}
```

### 6.2 更新系统配置

**接口信息**：
- 方法：PUT
- URL：`/api/configs`
- 权限：system:config:manage

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| maskCoefficient | number | 否 | 口罩类系数 |
| halfMaskCoefficient | number | 否 | 半面罩类系数 |
| laborCoefficient | number | 否 | 工价系数 |
| overheadRate | number | 否 | 管销率 |
| vatRate | number | 否 | 增值税率 |
| exchangeRate | number | 否 | 汇率 |
| insuranceRate | number | 否 | 保险率 |

---

## 七、通知模块

### 7.1 获取通知列表

**接口信息**：
- 方法：GET
- URL：`/api/notifications`
- 权限：需要登录

**查询参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| isRead | boolean | 否 | 是否已读 |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |

### 7.2 标记通知已读

**接口信息**：
- 方法：PUT
- URL：`/api/notifications/{id}/read`
- 权限：需要登录

### 7.3 标记全部已读

**接口信息**：
- 方法：PUT
- URL：`/api/notifications/read-all`
- 权限：需要登录

### 7.4 删除通知

**接口信息**：
- 方法：DELETE
- URL：`/api/notifications/{id}`
- 权限：需要登录

---

## 八、仪表盘模块

### 8.1 获取统计数据

**接口信息**：
- 方法：GET
- URL：`/api/dashboard/statistics`
- 权限：需要登录

**响应数据**：
```json
{
  "success": true,
  "data": {
    "pendingReviewCount": 10,
    "monthlyQuotationCount": 50,
    "monthlyTotalAmount": 500000,
    "comparisonData": {
      "labels": ["1月", "2月", "3月"],
      "data": [100, 120, 150]
    }
  }
}
```

### 8.2 获取待办事项

**接口信息**：
- 方法：GET
- URL：`/api/dashboard/todos`
- 权限：需要登录

**响应数据**：
```json
{
  "success": true,
  "data": {
    "pendingReviews": [...],
    "recentQuotations": [...]
  }
}
```

---

## 九、权限模块

### 9.1 获取权限列表

**接口信息**：
- 方法：GET
- URL：`/api/permissions`
- 权限：system:permission:view

### 9.2 获取角色列表

**接口信息**：
- 方法：GET
- URL：`/api/roles`
- 权限：system:role:view

### 9.3 获取角色权限

**接口信息**：
- 方法：GET
- URL：`/api/roles/{code}/permissions`
- 权限：system:role:view

### 9.4 更新角色权限

**接口信息**：
- 方法：PUT
- URL：`/api/roles/{code}/permissions`
- 权限：system:permission:manage

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| permissions | array | 是 | 权限代码数组 |

---

*文档版本: 1.0*
*最后更新: 2026-03-09*
