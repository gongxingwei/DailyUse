# Windows PowerShell 文件操作命令指南

## 🎯 为什么使用命令行移动文件？

### VS Code 文件资源管理器的局限性
- **性能问题**: 大量文件移动时界面卡顿
- **失败风险**: 网络中断或权限问题导致操作失败
- **进度不可见**: 无法实时查看移动进度
- **错误恢复**: 失败后难以确定哪些文件已移动

### PowerShell 优势
- ✅ **高性能**: 直接调用 Windows API
- ✅ **可靠**: 原子操作，失败时可回滚
- ✅ **进度显示**: 可显示详细进度
- ✅ **错误处理**: 完善的错误处理机制
- ✅ **批量操作**: 支持复杂的批量操作

## 📋 PowerShell 文件操作命令

### 基本文件操作

#### 1. 移动文件夹 (Move-Item)
```powershell
# 基本移动
Move-Item -Path "D:\myPrograms\DailyUse\electron" -Destination "D:\myPrograms\DailyUse\apps\desktop\src\main" -Force

# 移动并显示进度
Move-Item -Path "D:\myPrograms\DailyUse\electron" -Destination "D:\myPrograms\DailyUse\apps\desktop\src\main" -Force -Verbose

# 移动多个文件夹
$folders = @("electron", "src")
foreach ($folder in $folders) {
    Move-Item -Path "D:\myPrograms\DailyUse\$folder" -Destination "D:\myPrograms\DailyUse\apps\desktop\src\renderer" -Force -Verbose
}
```

#### 2. 复制文件夹 (Copy-Item)
```powershell
# 复制文件夹（保留原文件）
Copy-Item -Path "D:\myPrograms\DailyUse\electron" -Destination "D:\myPrograms\DailyUse\apps\desktop\src\main" -Recurse -Force

# 复制并显示进度
Copy-Item -Path "D:\myPrograms\DailyUse\electron" -Destination "D:\myPrograms\DailyUse\apps\desktop\src\main" -Recurse -Force -Verbose

# 移动 electron 文件夹内容到指定目录（正确方式）
# 确保目标目录存在
New-Item -Path "D:\myPrograms\DailyUse\apps\desktop\src\main" -ItemType Directory -Force
# 移动内容而不是整个文件夹
Move-Item -Path "D:\myPrograms\DailyUse\electron\*" -Destination "D:\myPrograms\DailyUse\apps\desktop\src\main" -Force
# 删除空的源文件夹
Remove-Item -Path "D:\myPrograms\DailyUse\electron" -Force
```

#### 3. 删除文件夹 (Remove-Item)
```powershell
# 删除文件夹
Remove-Item -Path "D:\myPrograms\DailyUse\electron" -Recurse -Force

# 安全删除（先确认）
Remove-Item -Path "D:\myPrograms\DailyUse\electron" -Recurse -Confirm

# 删除空文件夹
Remove-Item -Path "D:\myPrograms\DailyUse\packages" -Recurse -Force
```

#### 4. 创建文件夹 (New-Item)
```powershell
# 创建单个文件夹
New-Item -Path "D:\myPrograms\DailyUse\apps\desktop" -ItemType Directory -Force

# 创建嵌套文件夹
New-Item -Path "D:\myPrograms\DailyUse\apps\desktop\src\main" -ItemType Directory -Force

# 批量创建文件夹
$dirs = @(
    "apps/desktop/src/main",
    "apps/desktop/src/preload",
    "apps/desktop/src/renderer",
    "libs/desktop/ipc/src",
    "libs/desktop/native/src",
    "libs/desktop/windows/src"
)

foreach ($dir in $dirs) {
    New-Item -Path "D:\myPrograms\DailyUse\$dir" -ItemType Directory -Force -Verbose
}
```

#### 5. 重命名文件夹 (Rename-Item)
```powershell
# 重命名文件夹
Rename-Item -Path "D:\myPrograms\DailyUse\electron" -NewName "desktop-main"

# 批量重命名
Get-ChildItem -Path "D:\myPrograms\DailyUse\packages" -Directory | ForEach-Object {
    $newName = $_.Name -replace '^domain-', 'domain/'
    Rename-Item -Path $_.FullName -NewName $newName -Verbose
}
```

### 高级文件操作

#### 6. 条件操作
```powershell
# 只在目标不存在时移动
if (!(Test-Path "D:\myPrograms\DailyUse\apps\desktop")) {
    Move-Item -Path "D:\myPrograms\DailyUse\electron" -Destination "D:\myPrograms\DailyUse\apps\desktop\src\main" -Force
}

# 检查文件是否存在
if (Test-Path "D:\myPrograms\DailyUse\electron\main.ts") {
    Write-Host "主进程文件存在" -ForegroundColor Green
} else {
    Write-Host "主进程文件不存在" -ForegroundColor Red
}
```

#### 7. 批量操作
```powershell
# 移动多个相关文件夹
$moveMappings = @{
    "electron" = "apps/desktop/src/main"
    "src" = "apps/desktop/src/renderer"
    "packages/contracts" = "libs/contracts"
    "packages/ui" = "libs/shared/ui"
}

foreach ($mapping in $moveMappings.GetEnumerator()) {
    $source = "D:\myPrograms\DailyUse\$($mapping.Key)"
    $dest = "D:\myPrograms\DailyUse\$($mapping.Value)"

    if (Test-Path $source) {
        Move-Item -Path $source -Destination $dest -Force -Verbose
    }
}
```

#### 8. 错误处理
```powershell
# 带错误处理的移动操作
try {
    Move-Item -Path "D:\myPrograms\DailyUse\electron" -Destination "D:\myPrograms\DailyUse\apps\desktop\src\main" -Force -ErrorAction Stop
    Write-Host "移动成功！" -ForegroundColor Green
} catch {
    Write-Host "移动失败: $($_.Exception.Message)" -ForegroundColor Red
    # 可以在这里添加回滚逻辑
}
```

#### 9. 进度显示
```powershell
# 显示详细进度
$source = "D:\myPrograms\DailyUse\electron"
$dest = "D:\myPrograms\DailyUse\apps\desktop\src\main"

Write-Host "开始移动文件..." -ForegroundColor Yellow
Move-Item -Path $source -Destination $dest -Force -Verbose
Write-Host "移动完成！" -ForegroundColor Green
```

### 文件内容操作

#### 10. 读取文件内容
```powershell
# 读取文件内容
$content = Get-Content -Path "D:\myPrograms\DailyUse\package.json" -Raw
Write-Host $content
```

#### 11. 写入文件内容
```powershell
# 写入文件内容
$content | Out-File -FilePath "D:\myPrograms\DailyUse\apps\desktop\package.json" -Encoding UTF8
```

#### 12. 替换文件内容
```powershell
# 替换文件中的字符串
(Get-Content -Path "D:\myPrograms\DailyUse\vite.config.ts" -Raw) -replace 'electron/main.ts', 'apps/desktop/src/main/main.ts' |
    Out-File -FilePath "D:\myPrograms\DailyUse\vite.config.ts" -Encoding UTF8
```

## 🚀 Electron 迁移专用命令

### 阶段 1: 创建目录结构
```powershell
# 设置工作目录
Set-Location "D:\myPrograms\DailyUse"

# 创建桌面应用目录结构
$desktopDirs = @(
    "apps/desktop",
    "apps/desktop/src",
    "apps/desktop/src/main",
    "apps/desktop/src/preload",
    "apps/desktop/src/renderer",
    "apps/desktop/assets",
    "apps/desktop/build",
    "libs/desktop",
    "libs/desktop/ipc",
    "libs/desktop/ipc/src",
    "libs/desktop/native",
    "libs/desktop/native/src",
    "libs/desktop/windows",
    "libs/desktop/windows/src"
)

Write-Host "创建目录结构..." -ForegroundColor Yellow
foreach ($dir in $desktopDirs) {
    if (!(Test-Path $dir)) {
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
        Write-Host "  ✅ 创建: $dir" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️  跳过: $dir (已存在)" -ForegroundColor Gray
    }
}
```

### 阶段 2: 移动主进程代码
```powershell
Write-Host "移动主进程代码..." -ForegroundColor Yellow

# 移动主进程入口文件
if (Test-Path "electron/main.ts") {
    Move-Item -Path "electron/main.ts" -Destination "apps/desktop/src/main/main.ts" -Force -Verbose
}

# 移动主进程模块
if (Test-Path "electron/modules") {
    Move-Item -Path "electron/modules" -Destination "apps/desktop/src/main/" -Force -Verbose
}

# 移动主进程共享功能
if (Test-Path "electron/shared") {
    Move-Item -Path "electron/shared" -Destination "apps/desktop/src/main/" -Force -Verbose
}

# 移动窗口管理
if (Test-Path "electron/windows") {
    Move-Item -Path "electron/windows" -Destination "apps/desktop/src/main/" -Force -Verbose
}
```

### 阶段 3: 移动预加载脚本
```powershell
Write-Host "移动预加载脚本..." -ForegroundColor Yellow

# 移动主预加载脚本
if (Test-Path "electron/preload.ts") {
    Move-Item -Path "electron/preload.ts" -Destination "apps/desktop/src/preload/main.ts" -Force -Verbose
}

# 移动其他预加载脚本
if (Test-Path "electron/preload") {
    Get-ChildItem -Path "electron/preload" | ForEach-Object {
        Move-Item -Path $_.FullName -Destination "apps/desktop/src/preload/$($_.Name)" -Force -Verbose
    }
}
```

### 阶段 4: 移动渲染进程代码
```powershell
Write-Host "移动渲染进程代码..." -ForegroundColor Yellow

# 移动渲染进程入口
if (Test-Path "src/main.ts") {
    Move-Item -Path "src/main.ts" -Destination "apps/desktop/src/renderer/main.ts" -Force -Verbose
}

if (Test-Path "src/App.vue") {
    Move-Item -Path "src/App.vue" -Destination "apps/desktop/src/renderer/App.vue" -Force -Verbose
}

# 移动渲染进程模块
$rendererItems = @("modules", "shared", "views", "plugins", "assets", "i18n")
foreach ($item in $rendererItems) {
    if (Test-Path "src/$item") {
        Move-Item -Path "src/$item" -Destination "apps/desktop/src/renderer/$item" -Force -Verbose
    }
}
```

### 阶段 5: 移动配置文件
```powershell
Write-Host "移动配置文件..." -ForegroundColor Yellow

# 移动 HTML 入口文件
if (Test-Path "index.html") {
    Move-Item -Path "index.html" -Destination "apps/desktop/index.html" -Force -Verbose
}

# 复制 Electron Builder 配置
if (Test-Path "electron-builder.json5") {
    Copy-Item -Path "electron-builder.json5" -Destination "apps/desktop/electron-builder.json5" -Force -Verbose
}
```

### 阶段 6: 清理空目录
```powershell
Write-Host "清理空目录..." -ForegroundColor Yellow

# 删除空的 electron 目录
if (Test-Path "electron") {
    $electronItems = Get-ChildItem -Path "electron" -Recurse
    if ($electronItems.Count -eq 0) {
        Remove-Item -Path "electron" -Recurse -Force -Verbose
    } else {
        Write-Host "  ⚠️  electron 目录不为空，跳过删除" -ForegroundColor Yellow
    }
}

# 删除空的 src 目录
if (Test-Path "src") {
    $srcItems = Get-ChildItem -Path "src" -Recurse
    if ($srcItems.Count -eq 0) {
        Remove-Item -Path "src" -Recurse -Force -Verbose
    } else {
        Write-Host "  ⚠️  src 目录不为空，跳过删除" -ForegroundColor Yellow
    }
}
```

## 🛡️ 安全和最佳实践

### 备份策略
```powershell
# 创建 Git 备份
Write-Host "创建 Git 备份..." -ForegroundColor Yellow
git add .
git commit -m "备份：Electron 迁移前状态"

# 创建分支备份
$backupBranch = "backup-electron-migration-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
git checkout -b $backupBranch
git checkout main
Write-Host "✅ 备份分支已创建: $backupBranch" -ForegroundColor Green
```

### 验证操作
```powershell
# 验证文件移动结果
function Test-MigrationResult {
    $checks = @(
        @{Path = "apps/desktop/src/main/main.ts"; Description = "主进程入口"},
        @{Path = "apps/desktop/src/preload/main.ts"; Description = "主预加载脚本"},
        @{Path = "apps/desktop/src/renderer/main.ts"; Description = "渲染进程入口"},
        @{Path = "apps/desktop/index.html"; Description = "HTML 入口"}
    )

    Write-Host "验证迁移结果..." -ForegroundColor Yellow
    foreach ($check in $checks) {
        if (Test-Path $check.Path) {
            Write-Host "  ✅ $($check.Description): 存在" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $($check.Description): 缺失" -ForegroundColor Red
        }
    }
}

Test-MigrationResult
```

### 性能优化
```powershell
# 使用 robocopy 进行大文件移动（更快的替代方案）
# 注意：robocopy 在 PowerShell 中需要完整路径
$source = "D:\myPrograms\DailyUse\electron"
$dest = "D:\myPrograms\DailyUse\apps\desktop\src\main"

if (Test-Path $source) {
    Write-Host "使用 robocopy 进行快速移动..." -ForegroundColor Yellow
    robocopy $source $dest /E /MOVE /NJH /NJS /NP
    Write-Host "✅ robocopy 移动完成" -ForegroundColor Green
}
```

### 错误恢复
```powershell
# 回滚操作
function Invoke-Rollback {
    param([string]$backupBranch = "main")

    Write-Host "开始回滚操作..." -ForegroundColor Yellow

    # 恢复文件
    git reset --hard $backupBranch
    git clean -fd

    Write-Host "✅ 回滚完成" -ForegroundColor Green
}

# 使用示例
# Invoke-Rollback -backupBranch "backup-electron-migration-20250907-143000"
```

## 🎯 完整迁移脚本

创建一个完整的迁移脚本：

```powershell
# 保存为 migrate-electron.ps1
param(
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

# ... 包含上述所有命令 ...

Write-Host "🎉 Electron 迁移完成！" -ForegroundColor Green
Write-Host "请运行以下命令验证：" -ForegroundColor Yellow
Write-Host "  nx serve desktop" -ForegroundColor Cyan
```

## 📝 使用建议

1. **先备份**: 迁移前务必创建 Git 备份
2. **分阶段执行**: 不要一次性移动所有文件
3. **验证每步**: 每移动一个主要组件后进行验证
4. **使用 -Verbose**: 查看详细的移动进度
5. **权限检查**: 确保对所有文件有读写权限
6. **大文件使用 robocopy**: 对于大量文件，考虑使用 robocopy

这样可以确保迁移过程安全、高效且可控！
