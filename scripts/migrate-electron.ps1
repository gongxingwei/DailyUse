#!/usr/bin/env pwsh

# DailyUse Electron 迁移到 apps/desktop 脚本
# 使用 PowerShell 进行高效的文件操作

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false,
    [switch]$SkipBackup = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 DailyUse Electron 迁移脚本" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

if ($DryRun) {
    Write-Host "⚠️  DRY RUN 模式 - 不会执行实际操作" -ForegroundColor Yellow
}

# 设置工作目录
$projectRoot = "D:\myPrograms\DailyUse"
Set-Location $projectRoot

# 验证先决条件
function Test-Prerequisites {
    Write-Host "🔍 检查先决条件..." -ForegroundColor Blue

    # 检查是否在正确的目录
    if (!(Test-Path "package.json")) {
        throw "错误：请在项目根目录运行此脚本"
    }

    # 检查 Git 状态
    if (!$SkipBackup) {
        $gitStatus = git status --porcelain 2>$null
        if ($gitStatus -and !$Force) {
            throw "错误：存在未提交的更改。请先提交或使用 -Force 参数"
        }
    }

    # 检查目标目录是否已存在
    if ((Test-Path "apps/desktop") -and !$Force) {
        throw "错误：apps/desktop 已存在。使用 -Force 参数覆盖或手动删除"
    }

    Write-Host "✅ 先决条件检查通过" -ForegroundColor Green
}

# 创建备份
function New-Backup {
    if ($SkipBackup) {
        Write-Host "⏭️  跳过备份步骤" -ForegroundColor Gray
        return
    }

    Write-Host "💾 创建备份..." -ForegroundColor Blue

    $backupBranch = "backup-electron-migration-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

    if (!$DryRun) {
        git add .
        git commit -m "备份：Electron 迁移前状态" 2>$null
        git checkout -b $backupBranch 2>$null
        git checkout main 2>$null
        Write-Host "✅ 备份分支已创建: $backupBranch" -ForegroundColor Green
    }
    else {
        Write-Host "🔍 [DRY RUN] 将创建备份分支: $backupBranch" -ForegroundColor Yellow
    }
}

# 阶段 1: 创建目录结构
function New-DirectoryStructure {
    Write-Host "📁 阶段 1: 创建目录结构..." -ForegroundColor Blue

    $dirs = @(
        # 桌面应用目录
        "apps/desktop",
        "apps/desktop/src",
        "apps/desktop/src/main",
        "apps/desktop/src/preload",
        "apps/desktop/src/renderer",
        "apps/desktop/assets",
        "apps/desktop/build",

        # 桌面专用库
        "libs/desktop",
        "libs/desktop/ipc",
        "libs/desktop/ipc/src",
        "libs/desktop/native",
        "libs/desktop/native/src",
        "libs/desktop/windows",
        "libs/desktop/windows/src"
    )

    foreach ($dir in $dirs) {
        if (!$DryRun) {
            if (!(Test-Path $dir)) {
                New-Item -Path $dir -ItemType Directory -Force | Out-Null
                Write-Host "  ✅ 创建: $dir" -ForegroundColor Green
            }
            else {
                Write-Host "  ⏭️  跳过: $dir (已存在)" -ForegroundColor Gray
            }
        }
        else {
            Write-Host "  🔍 [DRY RUN] 将创建: $dir" -ForegroundColor Yellow
        }
    }
}

# 阶段 2: 移动主进程代码
function Move-MainProcess {
    Write-Host "⚙️  阶段 2: 移动主进程代码..." -ForegroundColor Blue

    $mainMappings = @(
        @{Source = "electron/main.ts"; Dest = "apps/desktop/src/main/main.ts" },
        @{Source = "electron/modules"; Dest = "apps/desktop/src/main/modules" },
        @{Source = "electron/shared"; Dest = "apps/desktop/src/main/shared" },
        @{Source = "electron/windows"; Dest = "apps/desktop/src/main/windows" }
    )

    foreach ($mapping in $mainMappings) {
        $source = $mapping.Source
        $dest = $mapping.Dest

        if (Test-Path $source) {
            if (!$DryRun) {
                # 确保目标父目录存在
                $destParent = Split-Path $dest -Parent
                if (!(Test-Path $destParent)) {
                    New-Item -Path $destParent -ItemType Directory -Force | Out-Null
                }

                Move-Item -Path $source -Destination $dest -Force -Verbose
                Write-Host "  ✅ 移动: $source → $dest" -ForegroundColor Green
            }
            else {
                Write-Host "  🔍 [DRY RUN] 将移动: $source → $dest" -ForegroundColor Yellow
            }
        }
        else {
            Write-Host "  ⏭️  跳过: $source (不存在)" -ForegroundColor Gray
        }
    }
}

# 阶段 3: 移动预加载脚本
function Move-PreloadScripts {
    Write-Host "🔌 阶段 3: 移动预加载脚本..." -ForegroundColor Blue

    # 移动主预加载脚本
    if (Test-Path "electron/preload.ts") {
        if (!$DryRun) {
            Move-Item -Path "electron/preload.ts" -Destination "apps/desktop/src/preload/main.ts" -Force -Verbose
            Write-Host "  ✅ 移动: electron/preload.ts → apps/desktop/src/preload/main.ts" -ForegroundColor Green
        }
        else {
            Write-Host "  🔍 [DRY RUN] 将移动: electron/preload.ts → apps/desktop/src/preload/main.ts" -ForegroundColor Yellow
        }
    }

    # 移动其他预加载脚本
    if (Test-Path "electron/preload") {
        if (!$DryRun) {
            Get-ChildItem -Path "electron/preload" | ForEach-Object {
                $dest = "apps/desktop/src/preload/$($_.Name)"
                Move-Item -Path $_.FullName -Destination $dest -Force -Verbose
                Write-Host "  ✅ 移动: $($_.FullName) → $dest" -ForegroundColor Green
            }
        }
        else {
            Write-Host "  🔍 [DRY RUN] 将移动预加载脚本目录" -ForegroundColor Yellow
        }
    }
}

# 阶段 4: 移动渲染进程代码
function Move-RendererProcess {
    Write-Host "🎨 阶段 4: 移动渲染进程代码..." -ForegroundColor Blue

    $rendererMappings = @(
        @{Source = "src/main.ts"; Dest = "apps/desktop/src/renderer/main.ts" },
        @{Source = "src/App.vue"; Dest = "apps/desktop/src/renderer/App.vue" },
        @{Source = "src/modules"; Dest = "apps/desktop/src/renderer/modules" },
        @{Source = "src/shared"; Dest = "apps/desktop/src/renderer/shared" },
        @{Source = "src/views"; Dest = "apps/desktop/src/renderer/views" },
        @{Source = "src/plugins"; Dest = "apps/desktop/src/renderer/plugins" },
        @{Source = "src/assets"; Dest = "apps/desktop/src/renderer/assets" },
        @{Source = "src/i18n"; Dest = "apps/desktop/src/renderer/i18n" }
    )

    foreach ($mapping in $rendererMappings) {
        $source = $mapping.Source
        $dest = $mapping.Dest

        if (Test-Path $source) {
            if (!$DryRun) {
                Move-Item -Path $source -Destination $dest -Force -Verbose
                Write-Host "  ✅ 移动: $source → $dest" -ForegroundColor Green
            }
            else {
                Write-Host "  🔍 [DRY RUN] 将移动: $source → $dest" -ForegroundColor Yellow
            }
        }
        else {
            Write-Host "  ⏭️  跳过: $source (不存在)" -ForegroundColor Gray
        }
    }
}

# 阶段 5: 移动配置文件
function Move-ConfigFiles {
    Write-Host "⚙️  阶段 5: 移动配置文件..." -ForegroundColor Blue

    $configMappings = @(
        @{Source = "index.html"; Dest = "apps/desktop/index.html" },
        @{Source = "electron-builder.json5"; Dest = "apps/desktop/electron-builder.json5"; Copy = $true }
    )

    foreach ($mapping in $configMappings) {
        $source = $mapping.Source
        $dest = $mapping.Dest
        $isCopy = $mapping.Copy

        if (Test-Path $source) {
            if (!$DryRun) {
                if ($isCopy) {
                    Copy-Item -Path $source -Destination $dest -Force -Verbose
                    Write-Host "  ✅ 复制: $source → $dest" -ForegroundColor Green
                }
                else {
                    Move-Item -Path $source -Destination $dest -Force -Verbose
                    Write-Host "  ✅ 移动: $source → $dest" -ForegroundColor Green
                }
            }
            else {
                $action = if ($isCopy) { "复制" } else { "移动" }
                Write-Host "  🔍 [DRY RUN] 将$action`: $source → $dest" -ForegroundColor Yellow
            }
        }
        else {
            Write-Host "  ⏭️  跳过: $source (不存在)" -ForegroundColor Gray
        }
    }
}

# 阶段 6: 清理空目录
function Clear-EmptyDirectories {
    Write-Host "🧹 阶段 6: 清理空目录..." -ForegroundColor Blue

    $dirsToClean = @("electron", "src")

    foreach ($dir in $dirsToClean) {
        if (Test-Path $dir) {
            $items = Get-ChildItem -Path $dir -Recurse 2>$null
            if ($items.Count -eq 0) {
                if (!$DryRun) {
                    Remove-Item -Path $dir -Recurse -Force -Verbose
                    Write-Host "  ✅ 删除空目录: $dir" -ForegroundColor Green
                }
                else {
                    Write-Host "  🔍 [DRY RUN] 将删除空目录: $dir" -ForegroundColor Yellow
                }
            }
            else {
                Write-Host "  ⚠️  目录不为空，跳过删除: $dir" -ForegroundColor Yellow
                Write-Host "    剩余文件数: $($items.Count)" -ForegroundColor Gray
            }
        }
    }
}

# 验证迁移结果
function Test-MigrationResult {
    Write-Host "✅ 验证迁移结果..." -ForegroundColor Blue

    $checks = @(
        @{Path = "apps/desktop/src/main/main.ts"; Description = "主进程入口" },
        @{Path = "apps/desktop/src/preload/main.ts"; Description = "主预加载脚本" },
        @{Path = "apps/desktop/src/renderer/main.ts"; Description = "渲染进程入口" },
        @{Path = "apps/desktop/index.html"; Description = "HTML 入口" },
        @{Path = "apps/desktop/electron-builder.json5"; Description = "Electron Builder 配置" }
    )

    $allPassed = $true
    foreach ($check in $checks) {
        if (Test-Path $check.Path) {
            Write-Host "  ✅ $($check.Description): 存在" -ForegroundColor Green
        }
        else {
            Write-Host "  ❌ $($check.Description): 缺失" -ForegroundColor Red
            $allPassed = $false
        }
    }

    return $allPassed
}

# 生成配置文件
function New-ConfigFiles {
    Write-Host "📝 生成配置文件..." -ForegroundColor Blue

    # 创建 package.json
    $packageJson = @{
        name            = "@dailyuse/desktop"
        version         = "0.1.10"
        type            = "module"
        main            = "dist/main/main.js"
        scripts         = @{
            dev         = "vite"
            build       = "vite build"
            "build:dev" = "vite build"
            start       = "electron dist/main/main.js"
            pack        = "electron-builder --dir"
            dist        = "electron-builder"
        }
        dependencies    = @{
            "@dailyuse/contracts"       = "workspace:*"
            "@dailyuse/domain-client"   = "workspace:*"
            "@dailyuse/shared/ui"       = "workspace:*"
            "@dailyuse/shared/utils"    = "workspace:*"
            "@dailyuse/desktop/ipc"     = "workspace:*"
            "@dailyuse/desktop/native"  = "workspace:*"
            "@dailyuse/desktop/windows" = "workspace:*"
            electron                    = "^32.0.0"
            "better-sqlite3"            = "^11.10.0"
            "electron-log"              = "^5.4.2"
        }
        devDependencies = @{
            "electron-builder"     = "^25.0.0"
            "vite-plugin-electron" = "^0.28.0"
        }
    }

    if (!$DryRun) {
        $packageJson | ConvertTo-Json -Depth 10 | Out-File "apps/desktop/package.json" -Encoding UTF8
        Write-Host "  ✅ 创建: apps/desktop/package.json" -ForegroundColor Green
    }
    else {
        Write-Host "  🔍 [DRY RUN] 将创建: apps/desktop/package.json" -ForegroundColor Yellow
    }

    # 创建 project.json (Nx 配置)
    $projectJson = @{
        name        = "desktop"
        "`$schema"  = "../../node_modules/nx/schemas/project-schema.json"
        projectType = "application"
        sourceRoot  = "apps/desktop/src"
        tags        = @("scope:desktop", "type:app", "platform:electron")
        targets     = @{
            build   = @{
                executor = "nx:run-commands"
                options  = @{
                    command = "vite build"
                    cwd     = "apps/desktop"
                }
            }
            serve   = @{
                executor = "nx:run-commands"
                options  = @{
                    command = "vite"
                    cwd     = "apps/desktop"
                }
            }
            package = @{
                executor = "nx:run-commands"
                options  = @{
                    command = "electron-builder --dir"
                    cwd     = "apps/desktop"
                }
            }
            dist    = @{
                executor = "nx:run-commands"
                options  = @{
                    command = "electron-builder"
                    cwd     = "apps/desktop"
                }
            }
            lint    = @{
                executor = "@nx/eslint:lint"
                outputs  = @("{options.outputFile}")
                options  = @{
                    lintFilePatterns = @("apps/desktop/**/*.{ts,tsx,js,jsx,vue}")
                }
            }
            test    = @{
                executor = "@nx/vite:test"
                outputs  = @("{options.reportsDirectory}")
                options  = @{
                    passWithNoTests  = $true
                    reportsDirectory = "../../coverage/apps/desktop"
                }
            }
        }
    }

    if (!$DryRun) {
        $projectJson | ConvertTo-Json -Depth 10 | Out-File "apps/desktop/project.json" -Encoding UTF8
        Write-Host "  ✅ 创建: apps/desktop/project.json" -ForegroundColor Green
    }
    else {
        Write-Host "  🔍 [DRY RUN] 将创建: apps/desktop/project.json" -ForegroundColor Yellow
    }
}

# 主执行流程
function Start-Migration {
    try {
        Test-Prerequisites
        New-Backup
        New-DirectoryStructure
        Move-MainProcess
        Move-PreloadScripts
        Move-RendererProcess
        Move-ConfigFiles
        Clear-EmptyDirectories
        New-ConfigFiles

        $validationPassed = Test-MigrationResult

        Write-Host ""
        Write-Host "🎉 Electron 迁移完成！" -ForegroundColor Green
        Write-Host "============================" -ForegroundColor Green

        if ($validationPassed) {
            Write-Host "✅ 所有验证项目通过" -ForegroundColor Green
        }
        else {
            Write-Host "⚠️  部分验证项目失败，请手动检查" -ForegroundColor Yellow
        }

        Write-Host ""
        Write-Host "📋 后续步骤:" -ForegroundColor Yellow
        Write-Host "  1. 检查并修复任何导入路径问题"
        Write-Host "  2. 更新根目录的 vite.config.ts，移除 Electron 配置"
        Write-Host "  3. 运行 'nx serve desktop' 测试桌面应用"
        Write-Host "  4. 运行 'nx build desktop' 验证构建"
        Write-Host "  5. 提交所有更改到 Git"

        Write-Host ""
        Write-Host "🔧 常用命令:" -ForegroundColor Cyan
        Write-Host "  nx serve desktop          # 开发模式启动"
        Write-Host "  nx build desktop          # 构建桌面应用"
        Write-Host "  nx package desktop        # 打包应用"
        Write-Host "  nx dist desktop           # 完整构建分发包"

    }
    catch {
        Write-Host ""
        Write-Host "❌ 迁移失败: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 您可以使用 Git 回滚到备份分支" -ForegroundColor Yellow
        exit 1
    }
}

# 执行迁移
Start-Migration
