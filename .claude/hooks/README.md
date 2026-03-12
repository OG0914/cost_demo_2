# 项目级 Hooks

本项目 hooks 目录包含针对成本管理系统的自动化工具。

## Hooks 列表

### 1. skill-activation.py
**功能**: 分析用户输入，自动推荐项目级 Skills

**用法**:
```bash
echo '{"prompt": "帮我设计报价单API"}' | python hooks/skill-activation.py
```

**特点**:
- 针对成本管理系统优化了触发词
- 包含成本计算相关关键词 (`cost-calculation`)
- 只推荐项目 `skills/` 目录中存在的 skills

### 2. insight-capture.js
**功能**: 记录项目级经验教训

**用法**:
```bash
# 创建新经验
node hooks/insight-capture.js create "场景描述" "问题" "解决方案" "关键词1" "关键词2"

# 列出所有经验
node hooks/insight-capture.js list
```

**示例**:
```bash
node hooks/insight-capture.js create "报价单成本计算错误" "小数精度丢失" "使用Prisma.Decimal进行计算" "prisma" "decimal"
```

**经验存储位置**: `memory/experiences/`

### 3. experience-promoter.js
**功能**: 自动晋升经验级别 (P2 → P1 → P0)

**用法**:
```bash
# 运行晋升检查
node hooks/experience-promoter.js promote

# 记录一次经验匹配
node hooks/experience-promoter.js match EXP-001
```

**晋升规则**:
- P2 → P1: 匹配 3 次以上
- P1 → P0: 匹配 10 次以上

### 4. pre-commit-check.sh
**功能**: Git 提交前检查

**检查项**:
- TypeScript 类型检查
- 后端单元测试

**用法**:
```bash
# 手动运行
bash hooks/pre-commit-check.sh

# 安装到 Git hooks
 cp hooks/pre-commit-check.sh .git/hooks/pre-commit
```

## 与全局 Hooks 的区别

| 特性 | 全局 Hooks (~/.claude/hooks/) | 项目 Hooks (./hooks/) |
|------|------------------------------|----------------------|
| 作用范围 | 所有项目 | 仅当前项目 |
| Skills 来源 | 全局 skills | 项目 `skills/` 目录 |
| 经验存储 | ~/.claude/memory/ | 项目 `memory/` 目录 |
| 触发词 | 通用 | 针对成本管理系统优化 |

## 快速开始

```bash
# 1. 记录一个经验
node hooks/insight-capture.js create "Prisma Decimal问题" "精度丢失" "使用toString()转换"

# 2. 测试 skill 触发
echo '{"prompt": "帮我debug报价单计算错误"}' | python hooks/skill-activation.py

# 3. 运行晋升检查
node hooks/experience-promoter.js promote
```
