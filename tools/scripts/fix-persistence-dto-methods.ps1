# PersistenceDTO 方法中的字段访问修复脚本
# 修复 fromPersistenceDTO/toPersistenceDTO 方法中访问 PersistenceDTO 字段的代码

$ErrorActionPreference = "Stop"

Write-Host "开始修复 PersistenceDTO 方法中的字段访问..." -ForegroundColor Green

# 只处理 domain-server 目录
$directories = @(
    "packages\domain-server\src"
)

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
    'failed_attempts' = 'failedAttempts'
    
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
    'total_tasks' = 'totalTasks'
    'active_tasks' = 'activeTasks'
    'paused_tasks' = 'pausedTasks'
    'completed_tasks' = 'completedTasks'
    'cancelled_tasks' = 'cancelledTasks'
    'failed_tasks' = 'failedTasks'
    'total_executions' = 'totalExecutions'
    'successful_executions' = 'successfulExecutions'
    'failed_executions' = 'failedExecutions'
    'skipped_executions' = 'skippedExecutions'
    'timeout_executions' = 'timeoutExecutions'
    'send_attempts' = 'sendAttempts'
    'retry_count' = 'retryCount'
    'execution_count' = 'executionCount'
    'max_retries' = 'maxRetries'
    'max_executions' = 'maxExecutions'
    'total_goals' = 'totalGoals'
    'active_goals' = 'activeGoals'
    'completed_goals' = 'completedGoals'
    'archived_goals' = 'archivedGoals'
    'overdue_goals' = 'overdueGoals'
    'total_key_results' = 'totalKeyResults'
    'completed_key_results' = 'completedKeyResults'
    'average_progress' = 'averageProgress'
    'goals_by_importance' = 'goalsByImportance'
    'goals_by_urgency' = 'goalsByUrgency'
    'goals_by_category' = 'goalsByCategory'
    'goals_by_status' = 'goalsByStatus'
    'goals_created_this_week' = 'goalsCreatedThisWeek'
    'goals_completed_this_week' = 'goalsCompletedThisWeek'
    'goals_created_this_month' = 'goalsCreatedThisMonth'
    'goals_completed_this_month' = 'goalsCompletedThisMonth'
    'total_reviews' = 'totalReviews'
    'average_rating' = 'averageRating'
    
    # 状态相关
    'sync_status' = 'syncStatus'
    'last_execution_status' = 'lastExecutionStatus'
    'is_read' = 'isRead'
    'is_accessible' = 'isAccessible'
    'is_system_folder' = 'isSystemFolder'
    'is_encrypted' = 'isEncrypted'
    'is_read_only' = 'isReadOnly'
    'is_system_setting' = 'isSystemSetting'
    'is_system_group' = 'isSystemGroup'
    'is_collapsed' = 'isCollapsed'
    'is_visible' = 'isVisible'
    
    # 类型相关
    'folder_type' = 'folderType'
    'content_type' = 'contentType'
    'channel_type' = 'channelType'
    'reference_type' = 'referenceType'
    'value_type' = 'valueType'
    'time_type' = 'timeType'
    'source_module' = 'sourceModule'
    'operator_type' = 'operatorType'
    
    # 其他字段
    'sort_order' = 'sortOrder'
    'current_path' = 'currentPath'
    'pinned_paths' = 'pinnedPaths'
    'recent_paths' = 'recentPaths'
    'related_entity_type' = 'relatedEntityType'
    'related_entity_uuid' = 'relatedEntityUuid'
    'source_entity_id' = 'sourceEntityId'
    'default_value' = 'defaultValue'
    'setting_key' = 'settingKey'
    'device_id' = 'deviceId'
    'help_text' = 'helpText'
    'input_type' = 'inputType'
    'completion_record' = 'completionRecord'
    'skip_record' = 'skipRecord'
    'actual_start_time' = 'actualStartTime'
    'actual_end_time' = 'actualEndTime'
    'days_of_week' = 'daysOfWeek'
    'start_time' = 'startTime'
    'end_time' = 'endTime'
    'message_id' = 'messageId'
    'status_code' = 'statusCode'
    'email_template' = 'emailTemplate'
    'push_template' = 'pushTemplate'
    'max_per_hour' = 'maxPerHour'
    'max_per_day' = 'maxPerDay'
    'increment_value' = 'incrementValue'
    'time_point' = 'timePoint'
    'time_range' = 'timeRange'
    'cron_expression' = 'cronExpression'
    'module_statistics' = 'moduleStatistics'
    'avg_execution_duration' = 'avgExecutionDuration'
    'min_execution_duration' = 'minExecutionDuration'
    'max_execution_duration' = 'maxExecutionDuration'
    'sync_to_cloud' = 'syncToCloud'
    'sync_to_devices' = 'syncToDevices'
    'module_name' = 'moduleName'
    'avg_duration' = 'avgDuration'
}

$totalFiles = 0
$totalReplacements = 0

foreach ($dir in $directories) {
    $fullPath = Join-Path $PSScriptRoot "..\..\$dir"
    
    if (-not (Test-Path $fullPath)) {
        Write-Host "警告: 目录不存在: $fullPath" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "`n处理目录: $dir" -ForegroundColor Cyan
    
    # 获取所有 TypeScript 文件
    $files = Get-ChildItem -Path $fullPath -Filter "*.ts" -Recurse | 
             Where-Object { 
                 $_.FullName -notmatch '\\node_modules\\' -and 
                 $_.FullName -notmatch '\\.nx\\' -and
                 $_.FullName -notmatch '\\dist\\' -and
                 $_.FullName -notmatch '\.test\.ts$' -and
                 $_.FullName -notmatch '\.spec\.ts$'
             }
    
    foreach ($file in $files) {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $fileChanged = $false
        $fileReplacements = 0
        
        # 应用所有字段映射
        foreach ($mapping in $fieldMappings.GetEnumerator()) {
            $snakeCase = $mapping.Key
            $camelCase = $mapping.Value
            
            # Pattern 1: dto.field_name 或 data.field_name
            $pattern1 = "(\w+\.)$snakeCase\b"
            if ($content -match $pattern1) {
                $content = $content -replace $pattern1, "`$1$camelCase"
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
}

Write-Host "`n" -NoNewline
Write-Host "===============================================" -ForegroundColor Green
Write-Host "修复完成！" -ForegroundColor Green
Write-Host "  修改文件数: $totalFiles" -ForegroundColor Cyan
Write-Host "  总替换次数: $totalReplacements" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Green
