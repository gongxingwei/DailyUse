# 批量修正模块规划文档
# 修正内容：DTO 命名规范、完整 DTO 转换方法、PersistenceDTO 定义

param(
    [string]$ModulesDir = "d:\myPrograms\DailyUse\docs\modules"
)

$ErrorActionPreference = "Stop"

Write-Host "🔧 开始批量修正模块规划文档..." -ForegroundColor Cyan

# 需要修正的模块列表
$modules = @(
    @{ Name = "task"; File = "TASK_MODULE_PLAN.md"; HasArchived = $false },
    @{ Name = "reminder"; File = "REMINDER_MODULE_PLAN.md"; HasArchived = $true },  # 特殊处理：去掉归档状态
    @{ Name = "account"; File = "ACCOUNT_MODULE_PLAN.md"; HasArchived = $false },
    @{ Name = "authentication"; File = "AUTHENTICATION_MODULE_PLAN.md"; HasArchived = $false },
    @{ Name = "notification"; File = "NOTIFICATION_MODULE_PLAN.md"; HasArchived = $false },
    @{ Name = "setting"; File = "SETTING_MODULE_PLAN.md"; HasArchived = $false }
)

function Fix-ClientDTONaming {
    param([string]$Content, [string]$ModuleName)
    
    Write-Host "  → 修正 Client DTO 命名..." -ForegroundColor Yellow
    
    # 根据不同模块修正命名
    $patterns = @{
        "task" = @(
            @{ Old = 'export interface TaskTemplateDTO'; New = 'export interface TaskTemplateClientDTO' },
            @{ Old = 'export interface TaskInstanceDTO'; New = 'export interface TaskInstanceClientDTO' },
            @{ Old = 'export interface TaskFolderDTO'; New = 'export interface TaskFolderClientDTO' },
            @{ Old = 'export interface TaskStatisticsDTO'; New = 'export interface TaskStatisticsClientDTO' },
            @{ Old = ': TaskTemplateDTO\['; New = ': TaskTemplateClientDTO[' },
            @{ Old = ': TaskInstanceDTO\['; New = ': TaskInstanceClientDTO[' },
            @{ Old = ': TaskFolderDTO\['; New = ': TaskFolderClientDTO[' }
        )
        "reminder" = @(
            @{ Old = 'export interface ReminderTemplateDTO'; New = 'export interface ReminderTemplateClientDTO' },
            @{ Old = 'export interface ReminderInstanceDTO'; New = 'export interface ReminderInstanceClientDTO' },
            @{ Old = 'export interface ReminderFolderDTO'; New = 'export interface ReminderFolderClientDTO' },
            @{ Old = ': ReminderTemplateDTO\['; New = ': ReminderTemplateClientDTO[' },
            @{ Old = ': ReminderInstanceDTO\['; New = ': ReminderInstanceClientDTO[' }
        )
        "account" = @(
            @{ Old = 'export interface AccountDTO'; New = 'export interface AccountClientDTO' },
            @{ Old = 'export interface AccountPreferencesDTO'; New = 'export interface AccountPreferencesClientDTO' },
            @{ Old = ': AccountDTO\['; New = ': AccountClientDTO[' }
        )
        "authentication" = @(
            @{ Old = 'export interface SessionDTO'; New = 'export interface SessionClientDTO' },
            @{ Old = 'export interface AuthTokenDTO'; New = 'export interface AuthTokenClientDTO' },
            @{ Old = ': SessionDTO\['; New = ': SessionClientDTO[' }
        )
        "notification" = @(
            @{ Old = 'export interface NotificationDTO'; New = 'export interface NotificationClientDTO' },
            @{ Old = 'export interface NotificationPreferencesDTO'; New = 'export interface NotificationPreferencesClientDTO' },
            @{ Old = ': NotificationDTO\['; New = ': NotificationClientDTO[' }
        )
        "setting" = @(
            @{ Old = 'export interface UserPreferenceDTO'; New = 'export interface UserPreferenceClientDTO' },
            @{ Old = 'export interface ThemeSettingDTO'; New = 'export interface ThemeSettingClientDTO' },
            @{ Old = ': UserPreferenceDTO\['; New = ': UserPreferenceClientDTO[' }
        )
    }
    
    if ($patterns.ContainsKey($ModuleName)) {
        foreach ($pattern in $patterns[$ModuleName]) {
            $Content = $Content -replace $pattern.Old, $pattern.New
        }
    }
    
    return $Content
}

function Add-DTOConversionMethods {
    param([string]$Content)
    
    Write-Host "  → 添加 DTO 转换方法..." -ForegroundColor Yellow
    
    # 在聚合根和实体的方法列表中添加 DTO 转换方法
    
    # 模式1: 查找 "public toDTO(): " 并替换为完整的转换方法
    $Content = $Content -replace '// ===== DTO 转换 =====\s+public toDTO\(\):', @'
// ===== DTO 转换方法（Domain-Server 层）=====
  public toServerDTO(includeChildren = false):
'@
    
    # 模式2: 在聚合根类定义后添加静态方法（如果没有的话）
    $serverDTOPattern = '(public toServerDTO\([^)]*\)[^;]+;)'
    if ($Content -match $serverDTOPattern) {
        # 检查是否缺少其他转换方法
        if ($Content -notmatch 'public toPersistenceDTO\(\)') {
            $Content = $Content -replace $serverDTOPattern, @'
$1
  public toPersistenceDTO(): ${TypeName}PersistenceDTO;
  public static fromServerDTO(dto: ${TypeName}ServerDTO): ${TypeName};
  public static fromPersistenceDTO(dto: ${TypeName}PersistenceDTO): ${TypeName};
'@
        }
    }
    
    return $Content
}

function Add-PersistenceDTOSection {
    param([string]$Content, [string]$ModuleName)
    
    Write-Host "  → 添加 PersistenceDTO 定义章节..." -ForegroundColor Yellow
    
    # 在 9.3 Client DTO 后面添加 9.4 Persistence DTO
    $persistenceSection = @"

---

### 9.4 Persistence DTO

``````typescript
// ===== ${ModuleName^} Persistence DTO =====
// 注意：Persistence DTO 使用 snake_case 命名（数据库规范）
// 日期字段使用 timestamp (number)
// JSON 字段需要序列化为 string

// TODO: 根据具体的聚合根和实体补充完整的 PersistenceDTO 定义
// 参考 Goal 模块的 GoalPersistenceDTO、KeyResultPersistenceDTO 等
``````
"@
    
    # 查找 "### 9.3 Client DTO" 之后，"### 9.5" 之前插入
    if ($Content -match '(### 9\.3 Client DTO.*?)(---\s+### 9\.5)') {
        $Content = $Content -replace '(### 9\.3 Client DTO.*?)(---\s+### 9\.5)', "`$1$persistenceSection`n`n`$2"
    }
    
    return $Content
}

function Remove-ArchivedStatus {
    param([string]$Content)
    
    Write-Host "  → 移除 Archived 状态（Reminder 模块特殊处理）..." -ForegroundColor Yellow
    
    # 移除枚举中的 Archived
    $Content = $Content -replace "Archived = 'archived',\s*// [^\n]+\n", ""
    $Content = $Content -replace "Archived = 'archived',\s*\n", ""
    
    # 移除方法中的 archive()
    $Content = $Content -replace "public archive\(\): void;[^\n]*\n", ""
    $Content = $Content -replace "async archiveTemplate\([^)]*\)[^;]*;[^\n]*\n", ""
    
    # 更新生命周期图
    $Content = $Content -replace 'draft → active → completed → archived', 'draft → active → completed'
    $Content = $Content -replace '→ archived → deleted', '→ deleted'
    $Content = $Content -replace 'completed → archived', 'completed → deleted'
    
    # 移除 archivedAt 字段引用
    $Content = $Content -replace 'archivedAt: [^\n]+\n', ''
    $Content = $Content -replace 'archived_at: [^\n]+\n', ''
    
    return $Content
}

function Update-DocumentMetadata {
    param([string]$Content, [string]$ModuleName)
    
    Write-Host "  → 更新文档元数据..." -ForegroundColor Yellow
    
    # 更新版本号和修正说明
    $Content = $Content -replace '> \*\*文档版本\*\*: v1\.0', '> **文档版本**: v1.1'
    $Content = $Content -replace '> \*\*更新时间\*\*: [^\n]+', '> **更新时间**: 2025-01-13'
    
    # 添加修正内容说明（如果没有的话）
    if ($Content -notmatch '修正内容') {
        $Content = $Content -replace '(> \*\*参考模式\*\*:[^\n]+)', "`$1`n> **修正内容**: DTO 命名规范、完整 DTO 转换方法、PersistenceDTO 定义、逻辑删除"
    }
    
    return $Content
}

function Add-DomainClientMethods {
    param([string]$Content)
    
    Write-Host "  → 添加 Domain-Client 层方法说明..." -ForegroundColor Yellow
    
    # 在每个聚合根设计后添加 Domain-Client 层的说明
    $clientLayerNote = @"

**Domain-Client 层额外方法**:

``````typescript
export class ${TypeName}Client extends AggregateRoot {
  // ... 同 Domain-Server 层的业务方法
  
  // ===== DTO 转换方法（Domain-Client 层）=====
  public toServerDTO(includeChildren = false): ${TypeName}ServerDTO;
  public toClientDTO(includeChildren = false): ${TypeName}ClientDTO;
  public static fromServerDTO(dto: ${TypeName}ServerDTO): ${TypeName}Client;
  public static fromClientDTO(dto: ${TypeName}ClientDTO): ${TypeName}Client;
}
``````
"@
    
    return $Content
}

# 主处理循环
foreach ($module in $modules) {
    $moduleName = $module.Name
    $fileName = $module.File
    $filePath = Join-Path $ModulesDir "$moduleName\$fileName"
    
    if (-not (Test-Path $filePath)) {
        Write-Host "⚠️  跳过 $moduleName (文件不存在: $fileName)" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "`n📝 处理 $moduleName 模块..." -ForegroundColor Green
    
    try {
        # 读取原文件
        $content = Get-Content $filePath -Raw -Encoding UTF8
        $originalContent = $content
        
        # 1. 更新文档元数据
        $content = Update-DocumentMetadata -Content $content -ModuleName $moduleName
        
        # 2. 修正 Client DTO 命名
        $content = Fix-ClientDTONaming -Content $content -ModuleName $moduleName
        
        # 3. 特殊处理：Reminder 模块去掉归档状态
        if ($module.HasArchived) {
            $content = Remove-ArchivedStatus -Content $content
        }
        
        # 4. 添加 PersistenceDTO 章节
        $content = Add-PersistenceDTOSection -Content $content -ModuleName $moduleName
        
        # 5. 添加完整的 DTO 转换方法说明
        # 注意：这部分需要手动检查和调整，因为每个模块的结构可能不同
        
        # 创建备份
        $backupPath = $filePath + ".backup"
        Copy-Item $filePath $backupPath -Force
        
        # 保存修正后的文件
        $content | Out-File $filePath -Encoding UTF8 -NoNewline
        
        Write-Host "  ✅ $moduleName 模块修正完成" -ForegroundColor Green
        
        # 显示变更统计
        $changes = ($content.Length - $originalContent.Length)
        Write-Host "  📊 文件大小变化: $changes 字符" -ForegroundColor Cyan
        
    } catch {
        Write-Host "  ❌ 处理 $moduleName 时出错: $_" -ForegroundColor Red
        # 恢复备份
        if (Test-Path $backupPath) {
            Copy-Item $backupPath $filePath -Force
            Remove-Item $backupPath -Force
        }
    }
}

Write-Host "`n✨ 批量修正完成！" -ForegroundColor Green
Write-Host "⚠️  建议手动检查每个文件，确保 DTO 转换方法的完整性" -ForegroundColor Yellow
Write-Host "📁 备份文件已保存为 .backup 后缀" -ForegroundColor Cyan
