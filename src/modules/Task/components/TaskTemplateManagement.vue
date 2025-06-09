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
                        <v-chip size="small" :color="status.value === 'active' ? 'success' :
                            status.value === 'upcoming' ? 'warning' : 'info'" variant="elevated" class="ml-2">
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
                    <v-icon :color="currentStatus === 'active' ? 'primary' :
                        currentStatus === 'upcoming' ? 'warning' : 'info'" size="64" class="mb-4">
                        {{statusFilters.find(s => s.value === currentStatus)?.icon}}
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
                        <v-chip :color="getStatusColor(template)" variant="tonal" size="small" class="status-chip">
                            <v-icon start size="small">
                                {{ getStatusIcon(template) }}
                            </v-icon>
                            {{ getStatusText(template) }}
                        </v-chip>
                    </div>

                    <!-- 操作按钮 -->
                    <div class="template-actions">
                        <v-btn icon variant="text" size="small" @click="startEditTaskTemplate(template.id)"
                            class="action-btn">
                            <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                        <v-btn icon variant="text" size="small" color="error" @click="deleteTemplate(template)"
                            class="action-btn">
                            <v-icon>mdi-delete</v-icon>
                        </v-btn>
                    </div>
                </v-card-title>

                <!-- 卡片内容 -->
                <v-card-text class="template-content">
                    <!-- 描述 -->
                    <p v-if="template.description" class="template-description">
                        {{ template.description }}
                    </p>

                    <!-- 元信息 -->
                    <div class="template-meta">
                        <!-- 日期范围 -->
                        <div class="meta-item">
                            <v-icon color="primary" size="small" class="meta-icon">
                                mdi-calendar-range
                            </v-icon>
                            <span class="meta-text">
                                {{ formatDateRange(template) }}
                            </span>
                        </div>

                        <!-- 重复模式 -->
                        <div class="meta-item">
                            <v-icon color="success" size="small" class="meta-icon">
                                mdi-repeat
                            </v-icon>
                            <span class="meta-text">
                                {{ getRepeatText(template.timeConfig) }}
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
                </v-card-text>
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
                    确定要删除任务模板 "{{ selectedTemplate?.title }}" 吗？此操作不可恢复。
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
        <TaskTemplateDialog :visible="showEditTaskTemplateDialog" :template="currentTemplate" :is-edit-mode="isEditMode"
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
import type { TaskTemplate } from '..//types/task';
import TaskTemplateDialog from './TaskTemplateDialog.vue';
import TemplateSelectionDialog from './TemplateSelectionDialog.vue';
import { useTaskDialog } from '../composables/useTaskDialog';
import { getTemplateStatus } from '../utils/taskInstanceUtils';
import { getTaskDisplayDate } from '../utils/taskInstanceUtils';
// services
import { taskTemplateService } from '../services/taskTemplateService';

const {
    snackbar,
    showSnackbar,
    closeSnackbar,

    showEditTaskTemplateDialog,
    showTemplateSelectionDialog,
    currentTemplate,
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

const statusFilters = [
    { label: '进行中', value: 'active', icon: 'mdi-play-circle' },
    { label: '未开始', value: 'upcoming', icon: 'mdi-clock' },
    { label: '已结束', value: 'ended', icon: 'mdi-check-circle' }
];

const filteredTemplates = computed(() => {
    return taskStore.getAllTaskTemplates.filter(template =>
        getTemplateStatus(template) === currentStatus.value
    );
});

const getTemplateCountByStatus = (status: string) => {
    return taskStore.getAllTaskTemplates.filter(template =>
        getTemplateStatus(template) === status
    ).length;
};

const getRepeatText = (timeConfig: any) => {
    const { recurrence } = timeConfig;

    switch (recurrence.type) {
        case 'daily':
            return recurrence.interval > 1 ? `每${recurrence.interval}天` : '每天';
        case 'weekly':
            if (recurrence.config?.weekdays?.length) {
                const weekdayNames = recurrence.config.weekdays.map((d: number) => '日一二三四五六'[d]);
                return `每周${weekdayNames.join('、')}`;
            }
            return recurrence.interval > 1 ? `每${recurrence.interval}周` : '每周';
        case 'monthly':
            return recurrence.interval > 1 ? `每${recurrence.interval}月` : '每月';
        case 'yearly':
            return recurrence.interval > 1 ? `每${recurrence.interval}年` : '每年';
        default:
            return '不重复';
    }
};

const getStatusColor = (template: TaskTemplate) => {
    const status = getTemplateStatus(template);
    switch (status) {
        case 'active': return 'success';
        case 'upcoming': return 'warning';
        case 'ended': return 'info';
        default: return 'default';
    }
};

const getStatusIcon = (template: TaskTemplate) => {
    const status = getTemplateStatus(template);
    return statusFilters.find(s => s.value === status)?.icon || 'mdi-circle';
};

const getStatusText = (template: TaskTemplate) => {
    const status = getTemplateStatus(template);
    return statusFilters.find(s => s.value === status)?.label || '';
};

const formatDateRange = (template: TaskTemplate) => {
    const startTime = template.timeConfig.baseTime.start;
    const start = getTaskDisplayDate({ scheduledTime: startTime } as any);

    let end = '持续进行';
    if (template.timeConfig.recurrence.endCondition.type === 'date' &&
        template.timeConfig.recurrence.endCondition.endDate) {
        end = getTaskDisplayDate({
            scheduledTime: template.timeConfig.recurrence.endCondition.endDate
        } as any);
    } else if (template.timeConfig.recurrence.endCondition.type === 'count' &&
        template.timeConfig.recurrence.endCondition.count) {
        end = `${template.timeConfig.recurrence.endCondition.count}次后结束`;
    }

    return `${start} - ${end}`;
};

const getKeyResultName = (link: any) => {
    const goal = goalStore.getGoalById(link.goalId);
    const kr = goal?.keyResults.find(kr => kr.id === link.keyResultId);
    return kr?.name || '未知关键结果';
};

const getEmptyStateText = () => {
    switch (currentStatus.value) {
        case 'active': return '暂无进行中的模板';
        case 'upcoming': return '暂无未开始的模板';
        case 'ended': return '暂无已结束的模板';
        default: return '暂无模板';
    }
};

const getEmptyStateDescription = () => {
    switch (currentStatus.value) {
        case 'active': return '创建任务模板来自动化你的日常工作';
        case 'upcoming': return '即将开始的任务模板会在这里显示';
        case 'ended': return '已完成的任务模板历史记录';
        default: return '';
    }
};

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
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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

.template-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    color: rgb(var(--v-theme-on-surface));
}

.status-chip {
    align-self: flex-start;
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
}

.meta-text {
    font-size: 0.875rem;
    color: rgba(var(--v-theme-on-surface), 0.8);
}

.key-results {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}

/* 卡片底部 */
.template-footer {
    padding: 0.75rem 1.5rem;
    background: rgba(var(--v-theme-surface), 0.5);
    border-top: 1px solid rgba(var(--v-theme-outline), 0.08);
}

/* 响应式设计 */
@media (max-width: 1024px) {
    .template-grid {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
}
</style>