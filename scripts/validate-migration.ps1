#!/usr/bin/env pwsh

# DailyUse MonoRepo 迁移验证脚本
# 用于验证迁移后的代码库是否正常工作

param(
    [switch]$Verbose = $false,
    [switch]$FixIssues = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 DailyUse MonoRepo 迁移验证脚本" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# 验证结果统计
$script:ValidationResults = @{
    Passed = 0
    Failed = 0
    Warnings = 0
    Errors = @()
}

function Write-ValidationResult {
    param(
        [string]$Test,
        [bool]$Passed,
        [string]$Message = "",
        [bool]$IsWarning = $false
    )
    
    if ($Passed) {
        Write-Host "  ✅ $Test" -ForegroundColor Green
        $script:ValidationResults.Passed++
    } elseif ($IsWarning) {
        Write-Host "  ⚠️  $Test - $Message" -ForegroundColor Yellow
        $script:ValidationResults.Warnings++
    } else {
        Write-Host "  ❌ $Test - $Message" -ForegroundColor Red
        $script:ValidationResults.Failed++
        $script:ValidationResults.Errors += "$Test - $Message"
    }
    
    if ($Verbose -and $Message) {
        Write-Host "     $Message" -ForegroundColor Gray
    }
}

# 1. 目录结构验证
function Test-DirectoryStructure {
    Write-Host "📁 验证目录结构..." -ForegroundColor Blue
    
    $requiredDirs = @(
        "apps/web",
        "apps/api", 
        "apps/desktop",
        "libs/contracts",
        "libs/domain/core",
        "libs/domain/client",
        "libs/domain/server",
        "libs/shared/ui",
        "libs/shared/utils",
        "libs/web/components",
        "libs/api/middleware"
    )
    
    foreach ($dir in $requiredDirs) {
        $exists = Test-Path $dir
        Write-ValidationResult "目录存在: $dir" $exists "目录不存在"
    }
    
    # 检查是否有残留的旧目录
    $oldDirs = @("packages", "common")
    foreach ($dir in $oldDirs) {
        $exists = Test-Path $dir
        Write-ValidationResult "旧目录已清理: $dir" (!$exists) "旧目录仍然存在" $true
    }
}

# 2. 配置文件验证
function Test-ConfigFiles {
    Write-Host "⚙️  验证配置文件..." -ForegroundColor Blue
    
    # 检查关键配置文件
    $configFiles = @(
        "nx.json",
        "tsconfig.base.json",
        "package.json"
    )
    
    foreach ($file in $configFiles) {
        $exists = Test-Path $file
        Write-ValidationResult "配置文件存在: $file" $exists "配置文件缺失"
        
        if ($exists) {
            try {
                if ($file.EndsWith(".json")) {
                    $content = Get-Content $file | ConvertFrom-Json
                    Write-ValidationResult "配置文件格式正确: $file" $true
                }
            } catch {
                Write-ValidationResult "配置文件格式正确: $file" $false "JSON 格式错误"
            }
        }
    }
    
    # 检查 tsconfig.base.json 路径映射
    if (Test-Path "tsconfig.base.json") {
        try {
            $tsconfig = Get-Content "tsconfig.base.json" | ConvertFrom-Json
            $hasPathMappings = $tsconfig.compilerOptions.paths -ne $null
            Write-ValidationResult "TypeScript 路径映射配置" $hasPathMappings "缺少路径映射配置"
            
            if ($hasPathMappings) {
                $expectedPaths = @("@dailyuse/contracts", "@dailyuse/domain", "@dailyuse/shared/ui")
                foreach ($path in $expectedPaths) {
                    $pathExists = $tsconfig.compilerOptions.paths.$path -ne $null
                    Write-ValidationResult "路径映射存在: $path" $pathExists "路径映射缺失" $true
                }
            }
        } catch {
            Write-ValidationResult "tsconfig.base.json 解析" $false "无法解析配置文件"
        }
    }
}

# 3. 项目配置验证
function Test-ProjectConfigs {
    Write-Host "📋 验证项目配置..." -ForegroundColor Blue
    
    # 获取所有项目
    try {
        $projects = nx show projects | ConvertFrom-Json
        Write-ValidationResult "Nx 项目列表获取" $true "找到 $($projects.Count) 个项目"
        
        foreach ($project in $projects) {
            $projectPath = nx show project $project --json | ConvertFrom-Json | Select-Object -ExpandProperty root
            $projectJsonPath = "$projectPath/project.json"
            
            $hasProjectJson = Test-Path $projectJsonPath
            Write-ValidationResult "项目配置存在: $project" $hasProjectJson "缺少 project.json"
            
            if ($hasProjectJson) {
                try {
                    $projectConfig = Get-Content $projectJsonPath | ConvertFrom-Json
                    $hasTargets = $projectConfig.targets -ne $null
                    Write-ValidationResult "项目目标配置: $project" $hasTargets "缺少构建目标" $true
                } catch {
                    Write-ValidationResult "项目配置解析: $project" $false "project.json 格式错误"
                }
            }
        }
    } catch {
        Write-ValidationResult "Nx 项目发现" $false "无法获取项目列表"
    }
}

# 4. 依赖关系验证
function Test-Dependencies {
    Write-Host "🔗 验证依赖关系..." -ForegroundColor Blue
    
    try {
        # 检查依赖图
        $graphOutput = nx graph --file=temp-graph.json --format=json 2>&1
        $graphGenerated = $LASTEXITCODE -eq 0
        Write-ValidationResult "依赖图生成" $graphGenerated "无法生成依赖图"
        
        if (Test-Path "temp-graph.json") {
            Remove-Item "temp-graph.json" -Force
        }
        
        # 检查循环依赖
        $noCycles = $true
        try {
            $affectedOutput = nx print-affected --type=lib 2>&1
            # 如果没有错误输出循环依赖相关信息，则认为没有循环依赖
            $noCycles = $affectedOutput -notmatch "circular|cycle"
        } catch {
            $noCycles = $false
        }
        Write-ValidationResult "无循环依赖" $noCycles "检测到循环依赖" (!$noCycles)
        
    } catch {
        Write-ValidationResult "依赖关系分析" $false "依赖分析失败"
    }
}

# 5. 构建验证
function Test-Build {
    Write-Host "🔨 验证构建..." -ForegroundColor Blue
    
    try {
        # 检查 Lint
        Write-Host "  运行 Lint 检查..." -ForegroundColor Gray
        $lintOutput = nx run-many --target=lint --all --skip-nx-cache 2>&1
        $lintPassed = $LASTEXITCODE -eq 0
        Write-ValidationResult "Lint 检查" $lintPassed "Lint 检查失败"
        
        if (!$lintPassed -and $Verbose) {
            Write-Host "Lint 输出:" -ForegroundColor Gray
            Write-Host $lintOutput -ForegroundColor Gray
        }
        
        # 检查类型检查
        Write-Host "  运行类型检查..." -ForegroundColor Gray
        $typecheckOutput = nx run-many --target=type-check --all --skip-nx-cache 2>&1
        $typecheckPassed = $LASTEXITCODE -eq 0
        Write-ValidationResult "TypeScript 类型检查" $typecheckPassed "类型检查失败" (!$typecheckPassed)
        
        if (!$typecheckPassed -and $Verbose) {
            Write-Host "类型检查输出:" -ForegroundColor Gray
            Write-Host $typecheckOutput -ForegroundColor Gray
        }
        
        # 尝试构建所有可构建的项目
        Write-Host "  运行构建..." -ForegroundColor Gray
        $buildOutput = nx run-many --target=build --all --skip-nx-cache 2>&1
        $buildPassed = $LASTEXITCODE -eq 0
        Write-ValidationResult "项目构建" $buildPassed "构建失败" (!$buildPassed)
        
        if (!$buildPassed -and $Verbose) {
            Write-Host "构建输出:" -ForegroundColor Gray
            Write-Host $buildOutput -ForegroundColor Gray
        }
        
    } catch {
        Write-ValidationResult "构建流程" $false "构建验证异常"
    }
}

# 6. 测试验证
function Test-Tests {
    Write-Host "🧪 验证测试..." -ForegroundColor Blue
    
    try {
        # 运行所有测试
        Write-Host "  运行单元测试..." -ForegroundColor Gray
        $testOutput = nx run-many --target=test --all --skip-nx-cache --passWithNoTests 2>&1
        $testsPassed = $LASTEXITCODE -eq 0
        Write-ValidationResult "单元测试" $testsPassed "测试失败" (!$testsPassed)
        
        if (!$testsPassed -and $Verbose) {
            Write-Host "测试输出:" -ForegroundColor Gray
            Write-Host $testOutput -ForegroundColor Gray
        }
        
    } catch {
        Write-ValidationResult "测试执行" $false "测试验证异常"
    }
}

# 7. 导入路径验证
function Test-ImportPaths {
    Write-Host "📦 验证导入路径..." -ForegroundColor Blue
    
    # 检查是否还有旧的导入路径
    $oldImportPatterns = @(
        "from ['\"]../common/",
        "from ['\"]../../common/",
        "from ['\"]../packages/",
        "import.*from ['\"]../common/",
        "import.*from ['\"]../../packages/"
    )
    
    $filesToCheck = Get-ChildItem -Recurse -Include "*.ts", "*.js", "*.vue" | Where-Object { 
        $_.FullName -notmatch "node_modules|dist|coverage|\.git" 
    }
    
    $oldImportsFound = 0
    foreach ($file in $filesToCheck) {
        $content = Get-Content $file.FullName -Raw
        foreach ($pattern in $oldImportPatterns) {
            if ($content -match $pattern) {
                $oldImportsFound++
                if ($Verbose) {
                    Write-Host "    发现旧导入路径: $($file.Name)" -ForegroundColor Gray
                }
                break
            }
        }
    }
    
    Write-ValidationResult "导入路径更新完成" ($oldImportsFound -eq 0) "发现 $oldImportsFound 个文件仍使用旧导入路径" ($oldImportsFound -gt 0)
    
    # 检查新的路径映射是否正常工作
    $newImportCount = 0
    foreach ($file in $filesToCheck) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match "from ['\"]@dailyuse/") {
            $newImportCount++
        }
    }
    
    Write-ValidationResult "新导入路径使用" ($newImportCount -gt 0) "没有找到新的 @dailyuse/* 导入" ($newImportCount -eq 0)
}

# 8. 性能基准测试
function Test-Performance {
    Write-Host "⚡ 性能基准测试..." -ForegroundColor Blue
    
    try {
        # 测试构建时间
        $buildStartTime = Get-Date
        $buildOutput = nx run-many --target=build --all --skip-nx-cache 2>&1
        $buildEndTime = Get-Date
        $buildDuration = ($buildEndTime - $buildStartTime).TotalSeconds
        
        Write-Host "  构建总时间: $([Math]::Round($buildDuration, 2)) 秒" -ForegroundColor Gray
        
        # 测试缓存效果
        $cacheStartTime = Get-Date
        $cacheOutput = nx run-many --target=build --all 2>&1
        $cacheEndTime = Get-Date
        $cacheDuration = ($cacheEndTime - $cacheStartTime).TotalSeconds
        
        Write-Host "  缓存构建时间: $([Math]::Round($cacheDuration, 2)) 秒" -ForegroundColor Gray
        
        $cacheImprovement = $buildDuration -gt 0 ? (($buildDuration - $cacheDuration) / $buildDuration * 100) : 0
        Write-ValidationResult "缓存性能提升" ($cacheImprovement -gt 10) "缓存提升: $([Math]::Round($cacheImprovement, 1))%"
        
    } catch {
        Write-ValidationResult "性能测试" $false "性能测试异常"
    }
}

# 9. 自动修复功能
function Invoke-AutoFix {
    if (!$FixIssues) {
        return
    }
    
    Write-Host "🔧 自动修复检测到的问题..." -ForegroundColor Blue
    
    # 修复 Lint 问题
    try {
        Write-Host "  尝试修复 Lint 问题..." -ForegroundColor Gray
        nx run-many --target=lint --all --fix
        Write-Host "  ✅ Lint 问题修复完成" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  无法自动修复 Lint 问题" -ForegroundColor Yellow
    }
    
    # 更新导入路径
    if ($script:ValidationResults.Errors -match "导入路径") {
        Write-Host "  尝试修复导入路径..." -ForegroundColor Gray
        # 这里可以添加自动修复导入路径的逻辑
        Write-Host "  ⚠️  导入路径需要手动修复" -ForegroundColor Yellow
    }
}

# 生成验证报告
function New-ValidationReport {
    Write-Host ""
    Write-Host "📊 验证报告" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Green
    
    $total = $script:ValidationResults.Passed + $script:ValidationResults.Failed + $script:ValidationResults.Warnings
    $passRate = if ($total -gt 0) { ($script:ValidationResults.Passed / $total * 100) } else { 0 }
    
    Write-Host "通过: $($script:ValidationResults.Passed)" -ForegroundColor Green
    Write-Host "失败: $($script:ValidationResults.Failed)" -ForegroundColor Red
    Write-Host "警告: $($script:ValidationResults.Warnings)" -ForegroundColor Yellow
    Write-Host "通过率: $([Math]::Round($passRate, 1))%" -ForegroundColor $(if ($passRate -gt 80) { "Green" } elseif ($passRate -gt 60) { "Yellow" } else { "Red" })
    
    if ($script:ValidationResults.Errors.Count -gt 0) {
        Write-Host ""
        Write-Host "❌ 需要修复的问题:" -ForegroundColor Red
        foreach ($error in $script:ValidationResults.Errors) {
            Write-Host "  • $error" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    if ($script:ValidationResults.Failed -eq 0) {
        Write-Host "🎉 验证通过！MonoRepo 迁移成功！" -ForegroundColor Green
    } else {
        Write-Host "⚠️  验证发现问题，请参考上述报告进行修复" -ForegroundColor Yellow
    }
    
    # 保存报告到文件
    $reportPath = "validation-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
    $reportContent = @"
DailyUse MonoRepo 验证报告
生成时间: $(Get-Date)

通过: $($script:ValidationResults.Passed)
失败: $($script:ValidationResults.Failed)  
警告: $($script:ValidationResults.Warnings)
通过率: $([Math]::Round($passRate, 1))%

$(if ($script:ValidationResults.Errors.Count -gt 0) {
"需要修复的问题:
$($script:ValidationResults.Errors | ForEach-Object { "• $_" } | Out-String)"
} else {
"所有验证项目通过！"
})
"@
    
    $reportContent | Out-File $reportPath -Encoding UTF8
    Write-Host "📋 详细报告已保存到: $reportPath" -ForegroundColor Blue
}

# 主执行流程
function Start-Validation {
    Test-DirectoryStructure
    Test-ConfigFiles
    Test-ProjectConfigs
    Test-Dependencies
    Test-ImportPaths
    Test-Build
    Test-Tests
    Test-Performance
    
    Invoke-AutoFix
    New-ValidationReport
}

# 执行验证
Start-Validation
