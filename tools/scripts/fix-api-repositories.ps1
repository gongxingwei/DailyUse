# API Repository 层 PersistenceDTO 字段访问修复脚本
# 修复 apps/api 中 repository 文件访问 PersistenceDTO 字段的代码

$ErrorActionPreference = "Stop"

Write-Host "开始修复 API Repository 层的 PersistenceDTO 字段访问..." -ForegroundColor Green

# 只处理 api 目录
$directory = "apps\api\src"

# 定义字段映射（snake_case -> camelCase）
$fieldMappings = @{
    # UUID 相关
    'account_uuid' = 'accountUuid'
    'repository_uuid' = 'repositoryUuid'
    'goal_uuid' = 'goalUuid'
    'key_result_uuid' = 'keyResultUuid'
    'folder_uuid' = 'folderUuid'
    'parent_goal_uuid' = 'parentGoalUuid'
    'parent_folder_uuid' = 'parentFolderUuid'
    'template_uuid' = 'templateUuid'
    'notification_uuid' = 'notificationUuid'
    'resource_uuid' = 'resourceUuid'
    'source_resource_uuid' = 'sourceResourceUuid'
    'target_resource_uuid' = 'targetResourceUuid'
    'setting_uuid' = 'settingUuid'
    'group_uuid' = 'groupUuid'
    'parent_group_uuid' = 'parentGroupUuid'
    'task_uuid' = 'taskUuid'
    'operator_uuid' = 'operatorUuid'
    
    # 时间戳相关
    'created_at' = 'createdAt'
    'updated_at' = 'updatedAt'
    'deleted_at' = 'deletedAt'
    'completed_at' = 'completedAt'
    'archived_at' = 'archivedAt'
    'reviewed_at' = 'reviewedAt'
    'recorded_at' = 'recordedAt'
    'modified_at' = 'modifiedAt'
    'last_accessed_at' = 'lastAccessedAt'
    'last_calculated_at' = 'lastCalculatedAt'
    'last_scan_at' = 'lastScanAt'
    'last_verified_at' = 'lastVerifiedAt'
    'last_checked_at' = 'lastCheckedAt'
    'last_run_at' = 'lastRunAt'
    'last_updated_at' = 'lastUpdatedAt'
    'last_used_at' = 'lastUsedAt'
    'next_run_at' = 'nextRunAt'
    'cached_at' = 'cachedAt'
    'published_at' = 'publishedAt'
    'sent_at' = 'sentAt'
    'delivered_at' = 'deliveredAt'
    'failed_at' = 'failedAt'
    'read_at' = 'readAt'
    'skipped_at' = 'skippedAt'
    'execution_time' = 'executionTime'
    'expires_at' = 'expiresAt'
    'revoked_at' = 'revokedAt'
    'trigger_time' = 'triggerTime'
    
    # 日期相关
    'start_date' = 'startDate'
    'target_date' = 'targetDate'
    'end_date' = 'endDate'
    'instance_date' = 'instanceDate'
    
    # 配置相关
    'reminder_config' = 'reminderConfig'
    'time_config' = 'timeConfig'
    'view_config' = 'viewConfig'
    'sync_config' = 'syncConfig'
    'do_not_disturb' = 'doNotDisturb'
    'rate_limit' = 'rateLimit'
    
    # 统计相关
    'goal_count' = 'goalCount'
    'completed_goal_count' = 'completedGoalCount'
    'key_result_snapshots' = 'keyResultSnapshots'
    'previous_value' = 'previousValue'
    'new_value' = 'newValue'
    'old_value' = 'oldValue'
    'change_amount' = 'changeAmount'
    'related_goals' = 'relatedGoals'
    'send_attempts' = 'sendAttempts'
    'retry_count' = 'retryCount'
    'execution_count' = 'executionCount'
    'max_retries' = 'maxRetries'
    'max_executions' = 'maxExecutions'
    
    # 状态相关
    'sync_status' = 'syncStatus'
    'last_execution_status' = 'lastExecutionStatus'
    'is_read' = 'isRead'
    'is_accessible' = 'isAccessible'
    'is_system_folder' = 'isSystemFolder'
    
    # 类型相关
    'folder_type' = 'folderType'
    'content_type' = 'contentType'
    'channel_type' = 'channelType'
    'reference_type' = 'referenceType'
    'value_type' = 'valueType'
    'time_type' = 'timeType'
    
    # 其他字段
    'sort_order' = 'sortOrder'
    'current_path' = 'currentPath'
    'pinned_paths' = 'pinnedPaths'
    'recent_paths' = 'recentPaths'
    'related_entity_type' = 'relatedEntityType'
    'related_entity_uuid' = 'relatedEntityUuid'
    'completion_record' = 'completionRecord'
    'skip_record' = 'skipRecord'
    'actual_start_time' = 'actualStartTime'
    'actual_end_time' = 'actualEndTime'
}

$fullPath = Join-Path $PSScriptRoot "..\..\$directory"

if (-not (Test-Path $fullPath)) {
    Write-Host "错误: 目录不存在: $fullPath" -ForegroundColor Red
    exit 1
}

Write-Host "`n处理目录: $directory" -ForegroundColor Cyan

# 获取所有 TypeScript 文件
$files = Get-ChildItem -Path $fullPath -Filter "*.ts" -Recurse | 
         Where-Object { 
             $_.FullName -notmatch '\\node_modules\\' -and 
             $_.FullName -notmatch '\\.nx\\' -and
             $_.FullName -notmatch '\\dist\\' -and
             $_.FullName -notmatch '\.test\.ts$' -and
             $_.FullName -notmatch '\.spec\.ts$'
         }

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $fileChanged = $false
    $fileReplacements = 0
    
    # 应用所有字段映射
    foreach ($mapping in $fieldMappings.GetEnumerator()) {
        $snakeCase = $mapping.Key
        $camelCase = $mapping.Value
        
        # Pattern: dto.field_name 或 data.field_name 或 entity.field_name
        $pattern = "(\w+\.)$snakeCase\b"
        if ($content -match $pattern) {
            $content = $content -replace $pattern, "`$1$camelCase"
            $fileChanged = $true
            $fileReplacements++
        }
    }
    
    if ($fileChanged) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $totalFiles++
        $totalReplacements += $fileReplacements
        Write-Host "  ✓ $($file.Name) - 替换了 $fileReplacements 次" -ForegroundColor Green
    }
}

Write-Host "`n" -NoNewline
Write-Host "===============================================" -ForegroundColor Green
Write-Host "修复完成！" -ForegroundColor Green
Write-Host "  修改文件数: $totalFiles" -ForegroundColor Cyan
Write-Host "  总替换次数: $totalReplacements" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Green

Write-Host "`n提示: 某些 Prisma 查询条件（如 where、orderBy）需要使用 snake_case" -ForegroundColor Yellow
Write-Host "这些需要手动检查和修复。" -ForegroundColor Yellow
