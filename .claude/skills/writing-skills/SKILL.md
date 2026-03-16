---
name: writing-skills
description: 标准化 skill 开发规范，统一 skill 文件结构、命名和内容组织
---

# Writing Skills

## Overview

创建高质量、风格统一的 skill 文件。Skill 是 Claude Code 的扩展能力单元，良好的 skill 设计能确保行为一致、易于维护。

**核心原则：** 简洁、可执行、风格统一。

## Skill 文件结构

```
.claude/skills/<skill-name>/
├── SKILL.md              # 主文件（必须）
├── assets/               # 附件资源（图片、示例代码）
├── references/           # 参考资料（外部链接、文档）
└── resources/            # 实现指南（模板、检查清单）
```

## SKILL.md 模板

```markdown
---
name: skill-name
description: 简洁描述 skill 的用途和触发时机
trigger: 可选，触发条件描述
---

# Skill 标题

## Overview

一句话概括 skill 的核心目的。

**核心原则：** 最重要的原则或约束。

**声明语：** 执行时必须说出的提示语（如"我将使用 TDD 开发此功能"）

## When to Use

**必须使用：**
- 场景 1
- 场景 2

**可选使用：**
- 场景 3

**例外（需人工确认）：**
- 场景 4

## The Process

### Step 1: 步骤名称

具体执行内容：
1. 子步骤 A
2. 子步骤 B

### Step 2: 步骤名称

...

## Examples

<Good>
```语言
// 正确示例代码
```
说明为什么好
</Good>

<Bad>
```语言
// 错误示例代码
```
说明为什么不好
</Bad>

## Verification Checklist

- [ ] 检查项 1
- [ ] 检查项 2
```

## 命名规范

### 目录名
- 使用 kebab-case
- 小写字母，单词用连字符分隔
- 示例：`test-driven-development`, `api-design-principles`

### name 字段
- 与目录名一致
- 全局唯一
- 示例：`name: test-driven-development`

### description 字段
- 简洁明了，一句话说明
- 包含触发时机
- 示例：`description: 在实现任何功能或修复 bug 前使用，先写测试`

## 内容组织

### 标题层级
- 一级标题：`#` - Skill 名称（仅一个）
- 二级标题：`##` - 主要章节（Overview, When to Use, The Process）
- 三级标题：`###` - 步骤或子章节
- 四级标题：`####` - 极少使用

### 代码块
- 使用正确的语言标识
- 关键代码加注释说明
- 示例标记 `<Good>` / `<Bad>` 单独成行

### 列表
- 无序列表用 `-`
- 有序列表用 `1.` `2.` `3.`
- 保持层级一致

## 风格指南

### 语言
- **全部使用中文**
- 技术术语可保留英文（如 TDD、API、JSON）

### 简洁原则
- 每句话传递一个信息
- 删除冗余词汇
- 步骤清晰可执行

### 强调方式
- **加粗** - 关键概念、警告
- `代码` - 文件名、命令、变量
- > 引用 - 重要原则、规则

### 表格使用
- 对比场景使用表格
- 保持列宽一致
- 示例：

| 场景 | 操作 |
|------|------|
| 测试通过 | 继续下一步 |
| 测试失败 | 修复代码 |

## 常见模式

### 步骤描述模式
```markdown
### Step N: 步骤名称

具体动作：
1. 动作 1
2. 动作 2

验证：
- 验证点 1
- 验证点 2
```

### 检查清单模式
```markdown
## Verification Checklist

- [ ] 检查项 1
- [ ] 检查项 2
- [ ] 检查项 3

无法全部勾选？说明未按 skill 执行。
```

### 反模式警示
```markdown
## Red Flags

**立即停止，重新开始：**
- 警示信号 1
- 警示信号 2
```

## 创建流程

1. **确定需求** - skill 解决什么问题
2. **设计结构** - 参考本规范选择章节
3. **编写内容** - 遵循风格指南
4. **自我审查** - 对照检查清单
5. **放置文件** - 放入 `.claude/skills/<name>/SKILL.md`

## 审查检查清单

创建 skill 后确认：

- [ ] 目录名使用 kebab-case
- [ ] Frontmatter 包含 name 和 description
- [ ] 有 Overview 章节说明核心目的
- [ ] 有 When to Use 章节说明触发时机
- [ ] 步骤使用 ### Step N: 格式
- [ ] 代码块有语言标识
- [ ] 全部使用中文（技术术语除外）
- [ ] 有 Verification Checklist 或类似验证机制
- [ ] 无冗余内容，每段都有价值

## 示例参考

参考项目中的优秀 skill：
- `brainstorming` - 简洁的对话式流程
- `test-driven-development` - 严格的步骤和检查点
- `executing-plans` - 清晰的批次执行模式
