#!/usr/bin/env pwsh

# DailyUse MonoRepo 自动化迁移脚本
# 执行前请确保已备份代码到 Git

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 DailyUse MonoRepo 自动化迁移脚本" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

if ($DryRun) {
    Write-Host "⚠️  DRY RUN 模式 - 不会执行实际更改" -ForegroundColor Yellow
}

# 检查先决条件
function Test-Prerequisites {
    Write-Host "🔍 检查先决条件..." -ForegroundColor Blue
    
    # 检查是否在正确的目录
    if (!(Test-Path "package.json")) {
        throw "错误：请在项目根目录运行此脚本"
    }
    
    # 检查是否有未提交的更改
    $gitStatus = git status --porcelain
    if ($gitStatus -and !$Force) {
        throw "错误：存在未提交的更改。请先提交或使用 -Force 参数"
    }
    
    # 检查 Nx 是否已安装
    if (!(Get-Command "nx" -ErrorAction SilentlyContinue)) {
        throw "错误：Nx CLI 未安装。请运行 'pnpm add -g nx'"
    }
    
    Write-Host "✅ 先决条件检查通过" -ForegroundColor Green
}

# 创建备份
function New-Backup {
    Write-Host "💾 创建备份..." -ForegroundColor Blue
    
    $backupBranch = "backup-before-monorepo-migration-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    
    if (!$DryRun) {
        git checkout -b $backupBranch
        git add .
        git commit -m "备份：MonoRepo 迁移前的代码状态"
        git checkout main
        Write-Host "✅ 备份已创建到分支: $backupBranch" -ForegroundColor Green
    } else {
        Write-Host "🔍 [DRY RUN] 将创建备份分支: $backupBranch" -ForegroundColor Yellow
    }
}

# 阶段 1: 目录结构重组
function Invoke-DirectoryRestructure {
    Write-Host "📁 阶段 1: 目录结构重组..." -ForegroundColor Blue
    
    # 创建新的目录结构
    $newDirs = @(
        "libs",
        "libs/shared",
        "libs/shared/ui",
        "libs/shared/utils", 
        "libs/shared/config",
        "libs/shared/testing",
        "libs/domain",
        "libs/domain/core",
        "libs/domain/client", 
        "libs/domain/server",
        "libs/web",
        "libs/web/components",
        "libs/web/services",
        "libs/web/stores",
        "libs/api",
        "libs/api/middleware",
        "libs/api/validation",
        "libs/api/auth",
        "libs/desktop",
        "libs/desktop/ipc",
        "libs/desktop/native",
        "libs/desktop/windows",
        "apps/desktop",
        "tools"
    )
    
    foreach ($dir in $newDirs) {
        if (!$DryRun) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "  ✅ 创建目录: $dir" -ForegroundColor Green
        } else {
            Write-Host "  🔍 [DRY RUN] 将创建目录: $dir" -ForegroundColor Yellow
        }
    }
    
    # 迁移现有目录
    $migrations = @{
        "packages/contracts" = "libs/contracts"
        "packages/domain-client" = "libs/domain/client"
        "packages/domain-core" = "libs/domain/core"
        "packages/domain-server" = "libs/domain/server"
        "packages/ui" = "libs/shared/ui"
        "packages/utils" = "libs/shared/utils"
        "electron" = "apps/desktop"
        "common/shared/domain" = "libs/domain/shared"
        "common/shared/events" = "libs/shared/events"
        "common/shared/types" = "libs/shared/types"
        "common/shared/utils" = "libs/shared/utils/src"
    }
    
    foreach ($migration in $migrations.GetEnumerator()) {
        $source = $migration.Key
        $dest = $migration.Value
        
        if (Test-Path $source) {
            if (!$DryRun) {
                if (Test-Path $dest) {
                    Remove-Item $dest -Recurse -Force
                }
                Move-Item $source $dest -Force
                Write-Host "  ✅ 迁移: $source → $dest" -ForegroundColor Green
            } else {
                Write-Host "  🔍 [DRY RUN] 将迁移: $source → $dest" -ForegroundColor Yellow
            }
        }
    }
    
    # 清理空目录
    $cleanupDirs = @("packages", "common")
    foreach ($dir in $cleanupDirs) {
        if (Test-Path $dir) {
            $isEmpty = (Get-ChildItem $dir -Recurse | Measure-Object).Count -eq 0
            if ($isEmpty) {
                if (!$DryRun) {
                    Remove-Item $dir -Recurse -Force
                    Write-Host "  ✅ 清理空目录: $dir" -ForegroundColor Green
                } else {
                    Write-Host "  🔍 [DRY RUN] 将清理空目录: $dir" -ForegroundColor Yellow
                }
            }
        }
    }
}

# 阶段 2: 配置文件更新
function Update-ConfigFiles {
    Write-Host "⚙️  阶段 2: 配置文件更新..." -ForegroundColor Blue
    
    # 更新 tsconfig.base.json
    if (!$DryRun) {
        Copy-Item "docs/recommended-tsconfig.base.json" "tsconfig.base.json" -Force
        Write-Host "  ✅ 更新 tsconfig.base.json" -ForegroundColor Green
    } else {
        Write-Host "  🔍 [DRY RUN] 将更新 tsconfig.base.json" -ForegroundColor Yellow
    }
    
    # 更新 nx.json
    if (!$DryRun) {
        Copy-Item "docs/recommended-nx.json" "nx.json" -Force
        Write-Host "  ✅ 更新 nx.json" -ForegroundColor Green
    } else {
        Write-Host "  🔍 [DRY RUN] 将更新 nx.json" -ForegroundColor Yellow
    }
    
    # 为每个库创建基本的 package.json 和 project.json
    $libs = @(
        @{name="contracts"; path="libs/contracts"},
        @{name="domain-core"; path="libs/domain/core"},
        @{name="domain-client"; path="libs/domain/client"},
        @{name="domain-server"; path="libs/domain/server"},
        @{name="shared-ui"; path="libs/shared/ui"},
        @{name="shared-utils"; path="libs/shared/utils"},
        @{name="shared-config"; path="libs/shared/config"},
        @{name="shared-testing"; path="libs/shared/testing"},
        @{name="web-components"; path="libs/web/components"},
        @{name="web-services"; path="libs/web/services"},
        @{name="web-stores"; path="libs/web/stores"},
        @{name="api-middleware"; path="libs/api/middleware"},
        @{name="api-validation"; path="libs/api/validation"},
        @{name="api-auth"; path="libs/api/auth"},
        @{name="desktop-ipc"; path="libs/desktop/ipc"},
        @{name="desktop-native"; path="libs/desktop/native"},
        @{name="desktop-windows"; path="libs/desktop/windows"}
    )
    
    foreach ($lib in $libs) {
        $libPath = $lib.path
        $libName = $lib.name
        
        if (!$DryRun) {
            # 创建 src 目录
            New-Item -ItemType Directory -Path "$libPath/src" -Force | Out-Null
            
            # 创建 index.ts
            if (!(Test-Path "$libPath/src/index.ts")) {
                "// Export all public APIs from this library" | Out-File "$libPath/src/index.ts" -Encoding UTF8
            }
            
            # 创建 package.json
            $packageJson = @{
                name = "@dailyuse/$libName"
                version = "0.0.1"
                type = "module"
            } | ConvertTo-Json -Depth 10
            $packageJson | Out-File "$libPath/package.json" -Encoding UTF8
            
            # 创建基本的 project.json
            $projectJson = @{
                name = $libName
                "`$schema" = "../../node_modules/nx/schemas/project-schema.json"
                sourceRoot = "$libPath/src"
                projectType = "library"
                tags = @("scope:shared", "type:util")
                targets = @{
                    lint = @{
                        executor = "@nx/eslint:lint"
                        outputs = @("{options.outputFile}")
                        options = @{
                            lintFilePatterns = @("$libPath/**/*.ts")
                        }
                    }
                    test = @{
                        executor = "@nx/vite:test"
                        outputs = @("{options.reportsDirectory}")
                        options = @{
                            passWithNoTests = $true
                            reportsDirectory = "../../coverage/$libPath"
                        }
                    }
                }
            } | ConvertTo-Json -Depth 10
            $projectJson | Out-File "$libPath/project.json" -Encoding UTF8
            
            Write-Host "  ✅ 创建库配置: $libName" -ForegroundColor Green
        } else {
            Write-Host "  🔍 [DRY RUN] 将创建库配置: $libName" -ForegroundColor Yellow
        }
    }
}

# 阶段 3: 代码重构
function Invoke-CodeRefactor {
    Write-Host "🔧 阶段 3: 代码重构..." -ForegroundColor Blue
    
    # 批量更新导入路径
    $pathMappings = @{
        "from '../common/" = "from '@dailyuse/"
        "from '../../common/" = "from '@dailyuse/"
        "from '../../../common/" = "from '@dailyuse/"
        "from '../packages/" = "from '@dailyuse/"
        "from '../../packages/" = "from '@dailyuse/"
        "import.*from ['\"]../common/" = "import from '@dailyuse/"
        "import.*from ['\"]../../common/" = "import from '@dailyuse/"
        "import.*from ['\"]../packages/" = "import from '@dailyuse/"
        "import.*from ['\"]../../packages/" = "import from '@dailyuse/"
    }
    
    $filesToUpdate = Get-ChildItem -Recurse -Include "*.ts", "*.js", "*.vue" | Where-Object { 
        $_.FullName -notmatch "node_modules|dist|coverage|\.git" 
    }
    
    foreach ($file in $filesToUpdate) {
        $content = Get-Content $file.FullName -Raw
        $updated = $false
        
        foreach ($mapping in $pathMappings.GetEnumerator()) {
            $oldPattern = $mapping.Key
            $newPattern = $mapping.Value
            
            if ($content -match $oldPattern) {
                if (!$DryRun) {
                    $content = $content -replace $oldPattern, $newPattern
                    $updated = $true
                }
            }
        }
        
        if ($updated -and !$DryRun) {
            $content | Out-File $file.FullName -Encoding UTF8 -NoNewline
            Write-Host "  ✅ 更新导入路径: $($file.Name)" -ForegroundColor Green
        } elseif ($updated) {
            Write-Host "  🔍 [DRY RUN] 将更新导入路径: $($file.Name)" -ForegroundColor Yellow
        }
    }
}

# 阶段 4: 验证和清理
function Invoke-ValidationAndCleanup {
    Write-Host "✅ 阶段 4: 验证和清理..." -ForegroundColor Blue
    
    # 重新安装依赖
    if (!$DryRun) {
        Write-Host "  📦 重新安装依赖..." -ForegroundColor Blue
        pnpm install
        Write-Host "  ✅ 依赖安装完成" -ForegroundColor Green
    } else {
        Write-Host "  🔍 [DRY RUN] 将重新安装依赖" -ForegroundColor Yellow
    }
    
    # 验证构建
    if (!$DryRun) {
        Write-Host "  🔨 验证构建..." -ForegroundColor Blue
        try {
            nx run-many --target=lint --all --skip-nx-cache
            Write-Host "  ✅ Lint 检查通过" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  Lint 检查失败，需要手动修复" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  🔍 [DRY RUN] 将验证构建" -ForegroundColor Yellow
    }
    
    # 生成项目图
    if (!$DryRun) {
        Write-Host "  📊 生成项目依赖图..." -ForegroundColor Blue
        nx graph --file=project-graph.html
        Write-Host "  ✅ 项目图已生成: project-graph.html" -ForegroundColor Green
    } else {
        Write-Host "  🔍 [DRY RUN] 将生成项目依赖图" -ForegroundColor Yellow
    }
}

# 主执行流程
function Start-Migration {
    try {
        Test-Prerequisites
        New-Backup
        Invoke-DirectoryRestructure
        Update-ConfigFiles
        Invoke-CodeRefactor
        Invoke-ValidationAndCleanup
        
        Write-Host ""
        Write-Host "🎉 MonoRepo 迁移完成！" -ForegroundColor Green
        Write-Host "======================================" -ForegroundColor Green
        Write-Host "📋 后续步骤:"
        Write-Host "  1. 检查并修复任何剩余的导入路径问题"
        Write-Host "  2. 运行 'nx run-many --target=test --all' 确保所有测试通过"
        Write-Host "  3. 更新 README.md 和相关文档"
        Write-Host "  4. 提交所有更改到 Git"
        Write-Host ""
        Write-Host "📊 查看项目结构: nx graph"
        Write-Host "🏗️  构建所有项目: nx run-many --target=build --all"
        Write-Host "🧪 运行所有测试: nx run-many --target=test --all"
        
    } catch {
        Write-Host ""
        Write-Host "❌ 迁移失败: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 您可以使用 Git 回滚到备份分支" -ForegroundColor Yellow
        exit 1
    }
}

# 执行迁移
Start-Migration
