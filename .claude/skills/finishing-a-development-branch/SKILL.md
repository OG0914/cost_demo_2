---
name: finishing-a-development-branch
description: Use when completing development work to properly finish a branch - verify state, present keep/remove options, execute chosen path with safety checks
---

# Finishing a Development Branch

## 概述

在功能开发或任务完成后，执行系统化的分支收尾流程。确保代码质量、测试通过，并根据情况选择保留 worktree、删除 worktree 或创建 PR。

**核心原则：** 验证优先 → 清晰选项 → 安全执行。

**启动时声明：** "我正在使用 finishing-a-development-branch skill 来完成此工作。"

---

## 使用场景

### 何时使用

- **计划执行完成后** - `executing-plans` skill 的第 5 步（Complete Development）
- **子代理任务完成后** - `subagent-driven-development` 的最后一步
- **功能开发完成后** - 手动开发任务结束
- **Bug 修复完成后** - 修复验证通过
- **Worktree 工作收尾** - 需要退出 worktree 时
- **用户说** - "完成"、"done"、"收尾"、"结束分支"

### 前置条件

- 所有代码变更已完成
- 本地测试已运行（建议）
- 处于 git worktree 或功能分支上

---

## 决策流程

```
                    开始
                      │
                      ▼
            执行状态诊断
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
    测试失败      有未提交更改      全部干净
        │             │                │
        ▼             ▼                ▼
    报告失败      显示选项          显示选项
    询问修复      (含提交选项)      (简单选项)
        │             │                │
        └─────────────┴────────────────┘
                      │
                      ▼
            用户选择操作
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
      保留          删除          提交+保留
        │             │             │
        ▼             ▼             ▼
    按需推送      安全检查        提交
                  退出/删除       推送
                      │          保留退出
                      ▼
                报告结果
```

---

## 具体操作步骤

### Step 1: 验证分支状态

运行诊断命令了解当前状态：

```bash
# 检查当前分支
git branch --show-current

# 检查未提交更改
git status --porcelain

# 检查未推送提交
git log @{u}..HEAD --oneline 2>/dev/null || echo "无上游分支"

# 检查是否在 worktree 中
git worktree list --porcelain | grep -A1 "$(pwd)" || echo "不在 worktree 中"
```

**状态分类：**

| 状态 | 未提交更改 | 未推送提交 | 需要操作 |
|------|-----------|-----------|---------|
| 干净 | 无 | 无 | 显示选项 |
| 脏 | 有 | 任意 | 先提交或暂存 |
| 超前 | 无 | 有 | 推送或备注 |

### Step 2: 运行最终验证

**完成声明前必须执行：**

```bash
# 运行测试
pnpm test

# 运行类型检查
pnpm typecheck

# 运行构建
pnpm build
```

**如果验证失败：**
- 停止收尾流程
- 报告失败及证据
- 询问："验证失败。是否在完成分支前修复问题？"

### Step 3: 提供选项

根据状态向 Lucas 展示清晰选项：

#### 选项 A: 保留分支 (Keep)

**适用场景：**
- 工作完成但未合并
- 需要保留更改供审查
- 多个功能并行开发

**操作：**
1. 推送未推送提交：`git push -u origin <branch>`
2. 如果在 worktree 中：使用 `keep` 退出
3. 报告："分支保留在 `<remote>/<branch>`，worktree 已保留"

#### 选项 B: 删除分支 (Remove)

**适用场景：**
- 工作已合并到 main
- 不再需要更改
- 清理已完成的工作

**操作：**
1. 验证分支已合并：`git branch --merged main`
2. 如未合并：警告并确认
3. 如果在 worktree 中：使用 `remove` 退出
4. 如为普通分支：`git branch -d <branch>`（或 `-D` 如强制）

#### 选项 C: 提交并保留 (Commit + Keep)

**适用场景：**
- 存在未提交更改
- 想保留当前状态
- 尚未准备合并

**操作：**
1. 暂存更改：`git add -A`
2. 使用 conventional message 创建提交
3. 推送：`git push -u origin <branch>`
4. 如果在 worktree 中：使用 `keep` 退出

#### 选项 D: 暂存并删除 (Stash + Remove)

**适用场景：**
- 存在未提交更改
- 不需要分支但想保存更改
- 临时工作稍后回顾

**操作：**
1. 暂存更改：`git stash push -m "WIP: <branch>"`
2. 如果在 worktree 中：使用 `remove` 退出
3. 报告："更改已暂存，分支已删除"

### Step 4: 执行选择

**任何破坏性操作前的安全检查：**

```bash
# 验证无未提交更改（如删除）
git diff --quiet && git diff --cached --quiet

# 验证分支已合并（如删除）
git branch --merged main | grep "<branch>"

# 确认 worktree 路径（如删除 worktree）
pwd | grep ".worktrees"
```

**退出 worktree：**

```
ExitWorktree action="keep"    # 保留 worktree
ExitWorktree action="remove"  # 删除 worktree
```

**删除普通分支：**

```bash
# 安全删除（未合并则失败）
git branch -d <branch>

# 强制删除（仅明确确认后）
git branch -D <branch>
```

---

## 与现有 Skill 集成

### 被以下 Skill 调用

- **executing-plans** - 第 5 步：Complete Development
- **subagent-driven-development** - 所有任务完成后的最后一步

### 调用以下 Skill

- **verification-before-completion** - 完成声明前必须验证
- **git-commit** - 提交未提交更改时使用
- **requesting-code-review** - 创建 PR 时代码审查

---

## Lucas 的 Commit 规范

**⚠️ 重要：每次 commit 前必须经过 Lucas 同意！**

执行流程：
1. 展示即将提交的文件列表 (`git diff --cached --name-only`)
2. 说明 commit 的类型和内容
3. 获得 Lucas 明确确认后方可执行

**禁止行为：**
- 未经同意直接执行 commit
- 使用 `--no-verify` 跳过 hooks
- 强制推送 (`--force`) 到 main 分支

---

## 完整示例

### Worktree 会话完成

```
我：正在使用 finishing-a-development-branch skill 来完成此工作。

[Step 1: 运行诊断]
分支: feature/new-api
未提交: 无
未推送: 3 个提交
Worktree: 是 (.worktrees/feature-new-api)

[Step 2: 运行验证]
测试: 45/45 通过 ✓
类型检查: 干净 ✓
构建: 成功 ✓

所有验证通过。选项：

A) 保留 - 推送提交并保留 worktree
B) 删除 - 推送提交并删除 worktree
C) 仅退出 - 保持现状并退出 worktree

Lucas: B

[推送提交]
git push -u origin feature/new-api

[退出 worktree]
ExitWorktree action="remove"

结果: 工作已完成，推送到 origin/feature/new-api，worktree 已删除。
```

### 普通分支完成

```
我：正在使用 finishing-a-development-branch skill 来完成此工作。

[Step 1: 运行诊断]
分支: fix/login-bug
未提交: 2 个文件
未推送: 1 个提交
Worktree: 否

[Step 2: 运行验证]
测试: 12/12 通过 ✓

检测到未提交更改。选项：

A) 提交并保留 - 提交更改，推送，保留分支
B) 暂存并删除 - 暂存更改，删除分支
C) 查看更改 - 先显示 diff 供审查

Lucas: A

[提交并推送]
git add -A
git commit -m "fix: resolve login redirect issue"
git push -u origin fix/login-bug

结果: 更改已提交并推送，分支保留。
```

---

## 安全规则

### 绝不：

- 未经明确确认删除有未提交更改的分支
- 未验证更改已保存时强制删除 (`-D`)
- 未检查分支是否合并时删除 worktree
- 跳过验证直接声明完成
- 未经用户批准对 git 命令使用 `--force`

### 总是：

- 完成前运行完整测试套件
- 展示带后果的清晰选项
- 确认破坏性操作
- 报告完成后的确切状态
- 默认保留工作（保留优于删除）

---

## 输出格式

**完成报告：**

```
分支完成摘要
========================
分支: <name>
位置: <worktree-path> 或 <repo-path>
提交: <count> (<pushed-status>)
更改: <clean|staged|unstaged>

验证:
- 测试: <result>
- 类型检查: <result>
- 构建: <result>

执行操作: <description>
最终状态: <state>
```

---

## 危险信号

**STOP 并询问用户当：**

- 未提交更改 + 用户想要删除
- 分支未合并 + 用户想要删除
- 测试失败 + 用户想要完成
- Worktree 有 tmux 会话（删除前检查）
- 任何无明确用户意图的破坏性操作

**澄清意图：**

- "您有未提交更改。删除前丢弃还是提交？"
- "分支未合并到 main。强制删除还是保留？"
- "Worktree 中检测到 tmux 会话。终止还是保持运行？"
