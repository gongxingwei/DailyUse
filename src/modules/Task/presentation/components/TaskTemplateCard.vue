<!-- filepath: d:\myPrograms\DailyUse\src\modules\Task\presentation\components\TaskTemplateCard.vue -->
<template>
    <v-card class="template-card" elevation="2" hover>
        <!-- 卡片头部 -->
        <v-card-title class="template-header">
            <div class="header-content">
                <h3 class="template-title">{{ template.title }}</h3>
                <div class="header-meta">
                    <v-chip :color="getTemplateStatusColor(template)" variant="tonal" size="small" class="status-chip">
                        <v-icon start size="small">
                            {{ getTemplateStatusIcon(template) }}
                        </v-icon>
                        {{ getTemplateStatusText(template) }}
                    </v-chip>
                    <v-chip v-if="template.metadata.priority" :color="getPriorityColor(template.metadata.priority)" 
                        variant="outlined" size="small" class="priority-chip ml-2">
                        <v-icon start size="small">mdi-flag</v-icon>
                        P{{ template.metadata.priority }}
                    </v-chip>
                </div>
            </div>

            <!-- 操作按钮 -->
            <div class="template-actions">
                <v-btn icon variant="text" size="small" @click="handleEdit"
                    class="action-btn">
                    <v-icon>mdi-pencil</v-icon>
                    <v-tooltip activator="parent" location="bottom">编辑模板</v-tooltip>
                </v-btn>
                <v-btn icon variant="text" size="small" color="error" @click="handleDelete"
                    class="action-btn">
                    <v-icon>mdi-delete</v-icon>
                    <v-tooltip activator="parent" location="bottom">删除模板</v-tooltip>
                </v-btn>
            </div>
        </v-card-title>

        <!-- 卡片内容 -->
        <v-card-text class="template-content">
            <!-- 描述 -->
            <p v-if="template.description" class="template-description">
                {{ template.description }}
            </p>

            <!-- 时间配置摘要 -->
            <div class="time-summary mb-3">
                <v-chip color="primary" variant="outlined" size="small" class="mb-1">
                    <v-icon start size="small">mdi-clock-outline</v-icon>
                    {{ TaskTimeUtils.formatTimeConfigSummary(template.timeConfig) }}
                </v-chip>
            </div>

            <!-- 元信息 -->
            <div class="template-meta">
                <!-- 日期范围 -->
                <div class="meta-item">
                    <v-icon color="primary" size="small" class="meta-icon">
                        mdi-calendar-range
                    </v-icon>
                    <span class="meta-text">
                        {{ dateRange }}
                    </span>
                </div>

                <!-- 时间范围 -->
                <div class="meta-item">
                    <v-icon color="info" size="small" class="meta-icon">
                        mdi-clock
                    </v-icon>
                    <span class="meta-text">
                        {{ timeRange }}
                    </span>
                </div>

                <!-- 重复模式 -->
                <div class="meta-item">
                    <v-icon color="success" size="small" class="meta-icon">
                        mdi-repeat
                    </v-icon>
                    <span class="meta-text">
                        {{ recurrence || '无重复' }}
                    </span>
                </div>

                <!-- 分类和标签 -->
                <div class="meta-item">
                    <v-icon color="purple" size="small" class="meta-icon">
                        mdi-tag
                    </v-icon>
                    <span class="meta-text">
                        {{ template.metadata.category }}
                        <span v-if="template.metadata.tags.length > 0" class="tags">
                            · {{ template.metadata.tags.slice(0, 2).join(', ') }}
                            <span v-if="template.metadata.tags.length > 2">等{{ template.metadata.tags.length }}个标签</span>
                        </span>
                    </span>
                </div>

                <!-- 关联目标 -->
                <div v-if="template.keyResultLinks?.length" class="meta-item">
                    <v-icon color="warning" size="small" class="meta-icon">
                        mdi-target
                    </v-icon>
                    <span class="meta-text">
                        关联 {{ template.keyResultLinks.length }} 个关键结果
                    </span>
                </div>
            </div>

            <!-- 关键结果标签 -->
            <div v-if="template.keyResultLinks?.length" class="key-results mt-3">
                <v-chip v-for="link in template.keyResultLinks.slice(0, 2)" :key="link.keyResultId" size="small"
                    color="primary" variant="outlined" class="mr-1 mb-1">
                    <v-icon start size="small">mdi-target</v-icon>
                    {{ getKeyResultName(link) }}
                </v-chip>
                <v-chip v-if="template.keyResultLinks.length > 2" size="small" variant="text" class="mb-1">
                    +{{ template.keyResultLinks.length - 2 }}
                </v-chip>
            </div>

            <!-- 统计信息 -->
            <div v-if="template.analytics.totalInstances > 0" class="analytics-info mt-3">
                <v-divider class="mb-2"></v-divider>
                <div class="analytics-row">
                    <div class="analytics-item">
                        <span class="analytics-label">总次数：</span>
                        <span class="analytics-value">{{ template.analytics.totalInstances }}</span>
                    </div>
                    <div class="analytics-item">
                        <span class="analytics-label">完成率：</span>
                        <span class="analytics-value">{{ Math.round(template.analytics.successRate * 100) }}%</span>
                    </div>
                    <div v-if="template.analytics.averageCompletionTime" class="analytics-item">
                        <span class="analytics-label">平均用时：</span>
                        <span class="analytics-value">{{ formatCompletionTime(template.analytics.averageCompletionTime) }}</span>
                    </div>
                </div>
            </div>
        </v-card-text>

        <!-- 卡片底部操作 -->
        <v-card-actions class="template-footer">
            <v-btn v-if="template.isActive()" color="primary" variant="outlined" size="small" 
                @click="handlePauseTemplate">
                <v-icon start size="small">mdi-plus</v-icon>
                暂停
            </v-btn>
            <v-btn v-else-if="template.isPaused()" color="warning" variant="outlined" size="small" 
                @click="handleResume">
                <v-icon start size="small">mdi-play</v-icon>
                恢复
            </v-btn>
            
            <v-spacer></v-spacer>
            
            <div class="template-dates">
                <span class="date-text">
                    创建于 {{ TaskTimeUtils.formatDisplayDate(template.lifecycle.createdAt) }}
                </span>
            </div>
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TaskTimeUtils } from '../../domain/utils/taskTimeUtils';
import { useGoalStore } from '@/modules/Goal/presentation/stores/goalStore';
import type { TaskTemplate } from '@/modules/Task/domain/aggregates/taskTemplate';
interface Props {
    template: TaskTemplate;
    statusFilters?: Array<{
        label: string;
        value: string;
        icon: string;
    }>;
}

interface Emits {
    (e: 'edit', templateId: string): void;
    (e: 'delete', template: TaskTemplate): void;
    (e: 'pause', template: TaskTemplate): void;
    (e: 'resume', template: TaskTemplate): void;
}

const props = withDefaults(defineProps<Props>(), {
    statusFilters: () => [
        { label: '进行中', value: 'active', icon: 'mdi-play-circle' },
        { label: '草稿', value: 'draft', icon: 'mdi-file-document-outline' },
        { label: '已暂停', value: 'paused', icon: 'mdi-pause-circle' },
        { label: '已归档', value: 'archived', icon: 'mdi-archive' }
    ]
});

const emit = defineEmits<Emits>();
const goalStore = useGoalStore();

const timeConfigFormatted = computed(() => {
    return TaskTimeUtils.formatTimeConfig(props.template.timeConfig);
});

const dateRange = computed(() => timeConfigFormatted.value.dateRange);
const timeRange = computed(() => timeConfigFormatted.value.timeRange);
const recurrence = computed(() => timeConfigFormatted.value.recurrence);
console.log('lifecycle', props.template.lifecycle);
// 状态相关方法
const getTemplateStatusColor = (template: TaskTemplate) => {
    const status = template.lifecycle.status;
    switch (status) {
        case 'active': return 'success';
        case 'draft': return 'info';
        case 'paused': return 'warning';
        case 'archived': return 'default';
        default: return 'default';
    }
};

const getTemplateStatusIcon = (template: TaskTemplate) => {
    const status = template.lifecycle.status;
    return props.statusFilters.find(s => s.value === status)?.icon || 'mdi-circle';
};

const getTemplateStatusText = (template: TaskTemplate) => {
    const status = template.lifecycle.status;
    return props.statusFilters.find(s => s.value === status)?.label || '';
};

const getPriorityColor = (priority: number) => {
    switch (priority) {
        case 1: return 'error';
        case 2: return 'warning';
        case 3: return 'info';
        case 4: return 'success';
        case 5: return 'default';
        default: return 'default';
    }
};

const getKeyResultName = (link: any) => {
    const goal = goalStore.getGoalByUuid(link.goalUuid);
    const kr = goal?.keyResults.find(kr => kr.uuid === link.keyResultId);
    return kr?.name || '未知关键结果';
};

const formatCompletionTime = (minutes: number): string => {
    if (minutes < 60) {
        return `${Math.round(minutes)}分钟`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.round(minutes % 60);
        return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
    }
};

// 事件处理方法
const handleEdit = () => {
    emit('edit', props.template.uuid);
};

const handleDelete = () => {
    emit('delete', props.template);
};

const handlePauseTemplate = () => {
    emit('pause', props.template);
};

const handleResume = () => {
    emit('resume', props.template);
};
</script>

<style scoped>
/* 模板卡片样式 */
.template-card {
    border-radius: 16px;
    transition: all 0.3s ease;
    border: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.template-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.template-header {
    background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05), rgba(var(--v-theme-secondary), 0.05));
    border-bottom: 1px solid rgba(var(--v-theme-outline), 0.08);
    padding: 1rem 1.5rem;
}

.header-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
}

.header-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
}

.template-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    color: rgb(var(--v-theme-on-surface));
}

.template-actions {
    display: flex;
    gap: 0.25rem;
}

.action-btn {
    transition: all 0.2s ease;
}

.action-btn:hover {
    transform: scale(1.1);
}

/* 卡片内容 */
.template-content {
    padding: 1.5rem;
}

.template-description {
    color: rgba(var(--v-theme-on-surface), 0.7);
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 1rem;
}

.time-summary {
    border-left: 3px solid rgb(var(--v-theme-primary));
    padding-left: 0.75rem;
    background: rgba(var(--v-theme-primary), 0.05);
    border-radius: 0 8px 8px 0;
    padding: 0.75rem;
}

.template-meta {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.meta-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
}

.meta-text {
    font-size: 0.875rem;
    color: rgba(var(--v-theme-on-surface), 0.8);
    line-height: 1.4;
}

.tags {
    color: rgba(var(--v-theme-on-surface), 0.6);
    font-style: italic;
}

.key-results {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}

/* 统计信息 */
.analytics-info {
    background: rgba(var(--v-theme-surface), 0.3);
    border-radius: 8px;
    padding: 0.75rem;
}

.analytics-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
}

.analytics-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 60px;
}

.analytics-label {
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
    margin-bottom: 0.25rem;
}

.analytics-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgb(var(--v-theme-primary));
}

/* 卡片底部 */
.template-footer {
    padding: 0.75rem 1.5rem;
    background: rgba(var(--v-theme-surface), 0.3);
    border-top: 1px solid rgba(var(--v-theme-outline), 0.08);
    min-height: auto;
}

.template-dates {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.date-text {
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .template-header {
        padding: 1rem;
    }

    .template-content {
        padding: 1rem;
    }

    .template-footer {
        padding: 0.75rem 1rem;
    }

    .analytics-row {
        justify-content: center;
    }
}

@media (max-width: 480px) {
    .header-content {
        align-items: center;
        text-align: center;
    }

    .template-actions {
        justify-content: center;
        margin-top: 0.5rem;
    }

    .meta-item {
        justify-content: center;
    }

    .time-summary {
        text-align: center;
    }
}
</style>