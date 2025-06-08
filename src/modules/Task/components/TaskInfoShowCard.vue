<template>
    <div class="modal-overlay" v-if="visible">
        <div class="modal-container">
            <div class="modal-header">
                <h2>任务详情</h2>
                <button class="btn btn-secondary" @click="handleClose">关闭</button>
            </div>

            <div class="modal-content">
                <div class="task-info">
                    <h3>{{ task.title }}</h3>
                    <p v-if="task.description">{{ task.description }}</p>
                    
                    <div class="task-meta">
                        <div class="due-date">
                            <v-icon icon="mdi-calendar" />
                            <span>任务日期: {{ getTaskDisplayDate(task) }}</span>
                        </div>
                        
                        <div class="task-status">
                            <v-icon :icon="task.status === 'completed' ? 'mdi-check-circle' : 'mdi-clock-outline'" />
                            <span>{{ getStatusText(task.status) }}</span>
                        </div>
                        
                        <div class="task-time">
                            <v-icon icon="mdi-clock" />
                            <span>时间: {{ getTaskDisplayTime(task) }}</span>
                        </div>
                    </div>

                    <!-- Key Results Progress -->
                    <div class="key-results" v-if="task.keyResultLinks?.length">
                        <h4>关联的关键结果</h4>
                        <div v-for="link in task.keyResultLinks" :key="link.keyResultId" class="kr-item">
                            <span>{{ getKeyResultName(link) }}</span>
                            <span>完成后 +{{ link.incrementValue }}</span>
                        </div>
                    </div>

                    <!-- Complete Button -->
                    <button 
                        v-if="task.status !== 'completed'"
                        class="btn btn-primary complete-btn"
                        @click="handleComplete"
                    >
                        完成任务
                    </button>
                    
                    <!-- Undo Complete Button -->
                    <button 
                        v-else
                        class="btn btn-secondary undo-btn"
                        @click="handleUndoComplete"
                    >
                        取消完成
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ITaskInstance } from '../types/task';
import { useTaskStore } from '../stores/taskStore';
import { useGoalStore } from '@/modules/Goal/stores/goalStore';
import { getTaskDisplayTime, getTaskDisplayDate } from '../utils/taskInstanceUtils';

const props = defineProps<{
    visible: boolean;
    task: ITaskInstance;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'complete'): void;
}>();

const taskStore = useTaskStore();
const goalStore = useGoalStore();

// ✅ 状态文本映射
const getStatusText = (status: string) => {
    const statusMap = {
        'pending': '待处理',
        'inProgress': '进行中',
        'completed': '已完成',
        'cancelled': '已取消',
        'overdue': '已过期'
    };
    return statusMap[status as keyof typeof statusMap] || '未知状态';
};

const getKeyResultName = (link: any) => {
    const goal = goalStore.getGoalById(link.goalId);
    const kr = goal?.keyResults.find(kr => kr.id === link.keyResultId);
    return `${goal?.title} - ${kr?.name}`;
};

const handleComplete = async () => {
    await taskStore.completeTask(props.task.id);
    emit('complete');
};

const handleUndoComplete = async () => {
    await taskStore.undoCompleteTask(props.task.id);
    emit('complete');
};

const handleClose = () => {
    emit('close');
};
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-container {
    background-color: rgb(41, 41, 41);
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-content {
    padding: 1rem;
    overflow-y: auto;
}

.form-group {
    margin-bottom: 1rem;
}

.weekday-selector {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.weekday-selector button {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    border: 1px solid #ccc;
    background: transparent;
    color: #ccc;
    cursor: pointer;
}

.weekday-selector button.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
}

.key-result-link {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.invalid {
    border-color: #ff4444;
}

.error-message {
    color: #ff4444;
    font-size: 0.8rem;
    margin-top: 0.25rem;
}
</style>