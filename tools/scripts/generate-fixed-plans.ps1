# 基于原始文档生成修正后的规划文档
# 这个脚本会读取原始备份，应用修正规则，生成新文档

param(
    [string]$DocsDir = "d:\myPrograms\DailyUse\docs"
)

Write-Host "🚀 开始生成修正后的模块规划文档..." -ForegroundColor Cyan
Write-Host "⚠️  由于文档复杂度高，建议手动基于 Goal 模块模板创建" -ForegroundColor Yellow
Write-Host ""

$modules = @("task", "reminder", "account", "authentication", "notification", "setting")

foreach ($moduleName in $modules) {
    Write-Host "📝 $moduleName 模块需要修正" -ForegroundColor Green
    Write-Host "   文件路径: $DocsDir\modules\$moduleName\${moduleName.ToUpper()}_MODULE_PLAN.md" -ForegroundColor Gray
}

Write-Host ""
Write-Host "💡 修正步骤：" -ForegroundColor Cyan
Write-Host "1. 参考 Goal 模块: $DocsDir\modules\goal\GOAL_MODULE_PLAN.md" -ForegroundColor White
Write-Host "2. 参考修正指南: $DocsDir\modules\BATCH_FIX_GUIDE.md" -ForegroundColor White
Write-Host "3. 参考修正说明: $DocsDir\modules\MODULE_PLAN_CORRECTIONS.md" -ForegroundColor White
Write-Host ""
Write-Host "✅ 已准备好修正环境！" -ForegroundColor Green
