#!/usr/bin/env python3
"""
Skill自动触发Hook (项目级)
功能：分析用户输入，推荐应调用的项目级Skills
"""

import sys
import json
import re
import os

# 项目级触发词映射 - 针对成本管理系统优化
TRIGGER_MAP = {
    # ===== 计划类 =====
    r"计划|规划|怎么|方案|思路|设计.*实现": ["brainstorming", "writing-plans"],
    r"复杂.*任务|多.*步骤|长.*计划|分.*阶段|大.*功能": ["subagent-driven-development"],

    # ===== 开发类 =====
    r"写.*代码|实现.*功能|开发|创建.*组件|添加.*功能": ["test-driven-development"],
    r"bug|错误|报错|失败|fix|debug|不工作|出问题|崩溃|异常": ["systematic-debugging"],
    r"typescript|类型安全|类型定义|type\s+\w+|interface\s+\w+|类型.*错误": ["type-safety"],

    # ===== 审查类 =====
    r"完成|好了|done|结束|搞定|做完": ["verification-before-completion"],
    r"review|审查|检查|优化|重构|改进|代码.*质量": ["code-review", "requesting-code-review"],

    # ===== 成本核算专项 =====
    r"成本.*计算|报价.*计算|价格.*核算|material.*cost|process.*cost": ["cost-calculation"],
    r"原料.*成本|工序.*成本|包装.*成本|运费.*计算": ["cost-calculation"],
    r"管销价|内销价|外销价|保险.*费": ["cost-calculation"],

    # ===== 专项技术 =====
    r"组件|component|react.*组件": ["component-development"],
    r"API|接口|rest|endpoint|路由": ["api-design-principles"],
    r"登录|认证|权限|jwt|session|鉴权": ["auth-implementation-patterns"],
    r"数据库|表|sql|postgres|prisma|schema|字段": ["postgresql-table-design"],
    r"慢|性能|优化|索引|慢查询|查询.*慢|加速": ["sql-optimization-patterns"],
    r"迁移|migration|schema.*变更|升级.*数据库": ["database-migration"],
    r"异常|错误处理|try.*catch|错误.*码|捕获.*异常": ["error-handling-patterns"],

    # ===== 前端 =====
    r"react|next\.?js": ["react-best-practices"],
    r"tailwind|样式|css|样式.*系统": ["tailwind-design-system"],
    r"shadcn|ui.*组件|组件.*库": ["shadcn-ui"],

    # ===== Node.js后端 =====
    r"fastify|后端.*api|rest.*api|中间件": ["nodejs-backend-patterns"],

    # ===== Git工作流 =====
    r"提交|commit|git.*提交": ["git-commit"],
    r"总结.*修改|总结.*变更|修改.*内容|改了.*什么|准备.*提交": ["git-commit"],
    r"发布|版本|tag|release|发版": ["version-release"],

    # ===== 构建检查 =====
    r"构建|build|检查|类型.*检查|编译.*错误": ["build-check"],

    # ===== 测试 =====
    r"测试.*页面|e2e.*测试|playwright|截图.*验证|自动化.*测试": ["webapp-testing"],

    # ===== 执行规划 =====
    r"执行.*计划|实施.*方案|开发.*计划|执行.*方案": ["executing-plans"],
    r"子代理|多代理|并行.*任务": ["subagent-driven-development"],
}

def analyze_input(text):
    """分析输入文本，返回推荐的Skills"""
    recommendations = []

    for pattern, skills in TRIGGER_MAP.items():
        if re.search(pattern, text, re.IGNORECASE):
            recommendations.extend(skills)

    # 去重保持顺序
    seen = set()
    unique = []
    for skill in recommendations:
        if skill not in seen:
            seen.add(skill)
            unique.append(skill)

    return unique

def get_project_skills():
    """获取项目级可用skills列表"""
    skills_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "skills")
    if os.path.exists(skills_dir):
        return [d for d in os.listdir(skills_dir) if os.path.isdir(os.path.join(skills_dir, d))]
    return []

def main():
    # 读取输入（JSON格式）
    try:
        input_data = json.load(sys.stdin)
        user_input = input_data.get("prompt", "")
    except:
        user_input = sys.stdin.read()

    # 分析
    skills = analyze_input(user_input)

    # 过滤只保留项目级skills
    project_skills = get_project_skills()
    available_skills = [s for s in skills if s in project_skills]

    # 输出结果
    result = {
        "triggered": len(available_skills) > 0,
        "skills": available_skills,
        "all_matched": skills,
        "message": f"检测到以下项目级Skills可能适用: {', '.join(available_skills)}" if available_skills else "未触发特定Skill"
    }

    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()
