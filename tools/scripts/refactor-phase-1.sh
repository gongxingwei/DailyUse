#!/bin/bash
# 项目重构脚本 - 第一阶段：结构清理

echo "🚀 开始 DailyUse 项目重构..."

# 1. 创建新的目录结构
mkdir -p {libs,tools,docs}
mkdir -p libs/{domain,shared,web,api,desktop}
mkdir -p libs/shared/{ui,utils,config,testing}
mkdir -p tools/{scripts,generators,eslint-rules}

# 2. 移动现有文件
echo "📁 重组目录结构..."

# 将 packages 重命名为 libs
if [ -d "packages" ]; then
    mv packages/* libs/ 2>/dev/null || true
    rmdir packages 2>/dev/null || true
fi

# 移动 electron 相关文件到 apps/desktop
if [ -d "electron" ]; then
    mkdir -p apps/desktop
    mv electron/* apps/desktop/ 2>/dev/null || true
    mv src/* apps/desktop/src/ 2>/dev/null || true
    rmdir electron src 2>/dev/null || true
fi

# 3. 清理配置文件
echo "⚙️ 整理配置文件..."

# 移动文档到 docs
mv *.md docs/ 2>/dev/null || true
mv docs/*.md docs/ 2>/dev/null || true

echo "✅ 第一阶段重构完成！"
echo "📋 下一步："
echo "   1. 更新 nx.json 中的项目配置"
echo "   2. 更新各个 project.json 文件"
echo "   3. 修复导入路径"
echo "   4. 更新 tsconfig.json 路径映射"
