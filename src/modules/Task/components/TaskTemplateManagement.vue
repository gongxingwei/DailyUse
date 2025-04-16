<template>
    <div id="task-template-management">
        <div class="d-flex justify-space-between mb-4">
            <div class="template-filters">
                <button v-for="status in statusFilters" :key="status.value" class="filter-btn"
                    :class="{ active: currentStatus === status.value }" @click="currentStatus = status.value">
                    <v-icon :icon="status.icon" size="20" />
                    {{ status.label }}
                    <span class="count">{{ getTemplateCountByStatus(status.value) }}</span>
                </button>
            </div>
            <div>
                <v-btn variant="tonal" color="primary" @click="startCreateTaskTemplate">
                    创建新模板
                </v-btn>
            </div>
        </div>

        <div class="template-list">
            <div v-for="template in filteredTemplates" :key="template.id" class="template-card">
                <div class="template-header">
                    <h3>{{ template.title }}</h3>
                    <div class="template-actions">
                        <button class="btn-icon" @click="startEditTaskTemplate(template.id)">
                            <v-icon icon="mdi-pencil" size="20" />
                        </button>
                        <button class="btn-icon" @click="deleteTemplate(template)">
                            <v-icon icon="mdi-delete" size="20" />
                        </button>
                    </div>
                </div>

                <div class="template-meta">
                    <div class="date-range">
                        <v-icon icon="mdi-calendar-range" width="16" height="16" />
                        <span>{{ template.repeatPattern.startDate }} - {{ template.repeatPattern.startDate }}</span>
                    </div>
                    <div class="repeat-pattern">
                        <v-icon icon="mdi-repeat" width="16" height="16" />
                        <span>{{ getRepeatText(template.repeatPattern) }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div>
        <TaskTemplateDialog
            :visible="showEditTaskTemplateDialog"
            @cancel="cancelEditTaskTemplate"
            @save="handleSaveTaskTemplate"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import type { ITaskTemplate } from '../types/task';
import TaskTemplateDialog from './TaskTemplateDialog.vue';
import { useTaskDialog } from '../composables/useTaskDialog';
// utils
import { getTemplateStatus } from '../utils/taskUtils';
const { showEditTaskTemplateDialog, startCreateTaskTemplate, startEditTaskTemplate, handleSaveTaskTemplate, cancelEditTaskTemplate } = useTaskDialog();
const taskStore = useTaskStore();
const currentStatus = ref('active');

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

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
};

const getRepeatText = (pattern: any) => {
    switch (pattern.type) {
        case 'daily':
            return '每天';
        case 'weekly':
            return `每周${pattern.days.map((d: number) => '日一二三四五六'[d]).join('、')}`;
        case 'monthly':
            return `每月${pattern.days.join('、')}日`;
        default:
            return '不重复';
    }
};

const deleteTemplate = async (template: ITaskTemplate) => {
    if (confirm('确定要删除此任务模板吗？')) {
        await taskStore.deleteTaskTemplate(template.id);
    }
};
</script>

<style scoped>
#task-template-management {
    padding: 1rem;
}

.template-filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
}

.filter-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    color: #ccc;
    cursor: pointer;
    transition: all 0.2s ease;
}

.filter-btn.active {
    background: var(--primary-color);
    color: white;
}

.count {
    background: rgba(0, 0, 0, 0.2);
    padding: 0.2rem 0.5rem;
    border-radius: 10px;
    font-size: 0.8rem;
}

.template-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
}

.template-card {
    background: rgb(41, 41, 41);
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.template-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.template-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: white;
}

.template-actions {
    display: flex;
    gap: 0.5rem;
}

.btn-icon {
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #ccc;
    cursor: pointer;
}

.btn-icon:hover {
    background: rgba(255, 255, 255, 0.1);
}

.template-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    color: #999;
    font-size: 0.9rem;
}

.date-range,
.repeat-pattern {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
</style>