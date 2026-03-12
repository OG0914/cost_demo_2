#!/bin/bash
# 提交前检查脚本
# 用法: 在 .git/hooks/pre-commit 中调用此脚本

echo "🔍 运行提交前检查..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查类型
pnpm typecheck
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 类型检查失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 类型检查通过${NC}"

# 运行测试 (仅后端)
cd apps/api
pnpm test
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 测试失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 测试通过${NC}"

echo -e "${GREEN}✅ 所有检查通过，准备提交${NC}"
exit 0
