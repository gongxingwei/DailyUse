<template>
    <div id="task-template-management">
        <!-- 筛选和操作栏 -->
        <div class="template-controls">
            <!-- 状态筛选器 -->
            <div class="template-filters">
                <v-btn-toggle v-model="currentStatus" mandatory variant="outlined" divided class="filter-group">
                    <v-btn v-for="status in statusFilters" :key="status.value" :value="status.value"
                        class="filter-button" size="large">
                        <v-icon :icon="status.icon" start />
                        {{ status.label }}
                        <v-chip size="small" :color="getStatusChipColor(status.value)" variant="elevated" class="ml-2">
                            {{ getTemplateCountByStatus(status.value) }}
                        </v-chip>
                    </v-btn>
                </v-btn-toggle>
            </div>

            <!-- 创建按钮 -->
            <v-btn color="primary" variant="elevated" size="large" prepend-icon="mdi-plus"
                @click="startCreateTaskTemplate" class="create-button">
                创建新模板
            </v-btn>
        </div>

        <!-- 模板列表 -->
        <div class="template-grid">
            <!-- 空状态 -->
            <v-card v-if="filteredTemplates.length === 0" class="empty-state-card" elevation="2">
                <v-card-text class="text-center pa-8">
                    <v-icon :color="getEmptyStateIconColor()" size="64" class="mb-4">
                        {{ getEmptyStateIcon() }}
                    </v-icon>
                    <h3 class="text-h5 mb-2">
                        {{ getEmptyStateText() }}
                    </h3>
                    <p class="text-body-1 text-medium-emphasis">
                        {{ getEmptyStateDescription() }}
                    </p>
                    <v-btn v-if="currentStatus === 'active'" color="primary" variant="tonal" prepend-icon="mdi-plus"
                        @click="startCreateTaskTemplate" class="mt-4">
                        创建第一个模板
                    </v-btn>
                </v-card-text>
            </v-card>

            <!-- 模板卡片 -->
            <v-card v-for="template in filteredTemplates" :key="template.id" class="template-card" elevation="2" hover>
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
                        <v-btn icon variant="text" size="small" @click="startEditTaskTemplate(template.id)"
                            class="action-btn">
                            <v-icon>mdi-pencil</v-icon>
                            <v-tooltip activator="parent" location="bottom">编辑模板</v-tooltip>
                        </v-btn>
                        <v-btn icon variant="text" size="small" color="error" @click="deleteTemplate(template)"
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
                                {{ TaskTimeUtils.formatDateRange(template.timeConfig.baseTime) }}
                            </span>
                        </div>

                        <!-- 时间范围 -->
                        <div class="meta-item">
                            <v-icon color="info" size="small" class="meta-icon">
                                mdi-clock
                            </v-icon>
                            <span class="meta-text">
                                {{ TaskTimeUtils.formatTimeRange(template.timeConfig.baseTime) }}
                            </span>
                        </div>

                        <!-- 重复模式 -->
                        <div class="meta-item">
                            <v-icon color="success" size="small" class="meta-icon">
                                mdi-repeat
                            </v-icon>
                            <span class="meta-text">
                                {{ TaskTimeUtils.formatRecurrence(template.timeConfig.recurrence) }}
                            </span>
                        </div>

                        <!-- 持续时间 -->
                        <div v-if="template.timeConfig.baseTime.end" class="meta-item">
                            <v-icon color="orange" size="small" class="meta-icon">
                                mdi-timer-outline
                            </v-icon>
                            <span class="meta-text">
                                {{ TaskTimeUtils.formatDuration(template.timeConfig.baseTime) }}
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
                        @click="createInstanceFromTemplate(template)">
                        <v-icon start size="small">mdi-plus</v-icon>
                        创建实例
                    </v-btn>
                    <v-btn v-else-if="template.isDraft()" color="success" variant="outlined" size="small" 
                        @click="activateTemplate(template)">
                        <v-icon start size="small">mdi-play</v-icon>
                        激活模板
                    </v-btn>
                    <v-btn v-else-if="template.isPaused()" color="warning" variant="outlined" size="small" 
                        @click="resumeTemplate(template)">
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
        </div>

        <!-- 删除确认对话框 -->
        <v-dialog v-model="showDeleteDialog" max-width="400">
            <v-card>
                <v-card-title class="text-h6">
                    <v-icon color="error" class="mr-2">mdi-delete-alert</v-icon>
                    确认删除
                </v-card-title>
                <v-card-text>
                    确定要删除任务模板 "{{ selectedTemplate?.title }}" 吗？
                    <br>
                    <span class="text-caption text-error">此操作不可恢复，相关的任务实例不会被删除。</span>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="showDeleteDialog = false">
                        取消
                    </v-btn>
                    <v-btn color="error" variant="elevated" @click="confirmDelete">
                        删除
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 模板选择对话框 -->
        <TemplateSelectionDialog :visible="showTemplateSelectionDialog" @cancel="cancelTemplateSelection"
            @select="handleTemplateTypeSelected" />

        <!-- 任务模板编辑对话框 -->
        <TaskTemplateDialog :visible="showEditTaskTemplateDialog" :is-edit-mode="isEditMode"
            @cancel="cancelEditTaskTemplate" @save="handleSaveTaskTemplate" />

        <!-- 消息提示框 -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="top right"
            variant="elevated" :multi-line="snackbar.message.length > 50">
            <div class="d-flex align-center">
                <span class="flex-1-1">{{ snackbar.message }}</span>
                <v-btn icon variant="text" size="small" color="white" @click="closeSnackbar">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>
        </v-snackbar>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import { useGoalStore } from '@/modules/Goal/stores/goalStore';
import TaskTemplateDialog from './TaskTemplateDialog.vue';
import TemplateSelectionDialog from './TemplateSelectionDialog.vue';
import { useTaskDialog } from '../composables/useTaskDialog';
import { TaskTimeUtils } from '../../domain/utils/taskTimeUtils';

const {
    snackbar,
    closeSnackbar,
    showEditTaskTemplateDialog,
    showTemplateSelectionDialog,
    isEditMode,
    startCreateTaskTemplate,
    handleTemplateTypeSelected,
    cancelTemplateSelection,
    startEditTaskTemplate,
    handleSaveTaskTemplate,
    cancelEditTaskTemplate,
    handleDeleteTaskTemplate
} = useTaskDialog();

const taskStore = useTaskStore();
const goalStore = useGoalStore();
const currentStatus = ref('active');
const showDeleteDialog = ref(false);
const selectedTemplate = ref<TaskTemplate | null>(null);

// 状态筛选器配置
const statusFilters = [
    { label: '进行中', value: 'active', icon: 'mdi-play-circle' },
    { label: '草稿', value: 'draft', icon: 'mdi-file-document-outline' },
    { label: '已暂停', value: 'paused', icon: 'mdi-pause-circle' },
    { label: '已归档', value: 'archived', icon: 'mdi-archive' }
];

// 计算属性
const filteredTemplates = computed(() => {
    return taskStore.getAllTaskTemplates.filter(template =>
        template.lifecycle.status === currentStatus.value
    );
});

// 工具方法
const getTemplateCountByStatus = (status: string) => {
    return taskStore.getAllTaskTemplates.filter(template =>
        template.lifecycle.status === status
    ).length;
};

const getStatusChipColor = (status: string) => {
    switch (status) {
        case 'active': return 'success';
        case 'draft': return 'info';
        case 'paused': return 'warning';
        case 'archived': return 'default';
        default: return 'default';
    }
};

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
    return statusFilters.find(s => s.value === status)?.icon || 'mdi-circle';
};

const getTemplateStatusText = (template: TaskTemplate) => {
    const status = template.lifecycle.status;
    return statusFilters.find(s => s.value === status)?.label || '';
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
    const goal = goalStore.getGoalById(link.goalId);
    const kr = goal?.keyResults.find(kr => kr.id === link.keyResultId);
    return kr?.name || '未知关键结果';
};

const getEmptyStateText = () => {
    switch (currentStatus.value) {
        case 'active': return '暂无进行中的模板';
        case 'draft': return '暂无草稿模板';
        case 'paused': return '暂无暂停的模板';
        case 'archived': return '暂无归档的模板';
        default: return '暂无模板';
    }
};

const getEmptyStateDescription = () => {
    switch (currentStatus.value) {
        case 'active': return '创建并激活任务模板来自动化你的日常工作';
        case 'draft': return '草稿模板需要激活后才能使用';
        case 'paused': return '暂停的模板可以随时恢复使用';
        case 'archived': return '归档的模板不会再产生新的任务实例';
        default: return '';
    }
};

const getEmptyStateIcon = () => {
    return statusFilters.find(s => s.value === currentStatus.value)?.icon || 'mdi-circle';
};

const getEmptyStateIconColor = () => {
    return getStatusChipColor(currentStatus.value);
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

// 操作方法
const deleteTemplate = (template: TaskTemplate) => {
    selectedTemplate.value = template;
    showDeleteDialog.value = true;
};

const confirmDelete = async () => {
    if (selectedTemplate.value) {
        await handleDeleteTaskTemplate(selectedTemplate.value.id);
        showDeleteDialog.value = false;
        selectedTemplate.value = null;
    }
};

const createInstanceFromTemplate = (template: TaskTemplate) => {
    // 这里应该调用创建任务实例的方法
    console.log('创建任务实例:', template.title);
    // TODO: 实现创建任务实例的逻辑
};

const activateTemplate = (template: TaskTemplate) => {
    template.activate();
    // TODO: 调用store保存模板状态
    console.log('激活模板:', template.title);
};

const resumeTemplate = (template: TaskTemplate) => {
    template.activate(); // 恢复就是重新激活
    // TODO: 调用store保存模板状态
    console.log('恢复模板:', template.title);
};
</script>

<style scoped>
#task-template-management {
    padding: 1.5rem;
}

/* 控制栏样式 */
.template-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.filter-group {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-button {
    font-weight: 600;
    letter-spacing: 0.5px;
}

.create-button {
    font-weight: 600;
    letter-spacing: 0.5px;
}

/* 模板网格 */
.template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 1.5rem;
}

/* 空状态样式 */
.empty-state-card {
    grid-column: 1 / -1;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(var(--v-theme-surface), 0.8), rgba(var(--v-theme-background), 0.95));
}

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
@media (max-width: 1024px) {
    .template-grid {
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1rem;
    }
}

@media (max-width: 768px) {
    #task-template-management {
        padding: 1rem;
    }

    .template-controls {
        flex-direction: column;
        align-items: stretch;
    }

    .template-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

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