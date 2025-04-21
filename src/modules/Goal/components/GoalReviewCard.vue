<template>
    <Teleport to="body">
        <div v-if="visible" class="modal-overlay" @click="handleClose">
            <div class="review-card" @click.stop>
                <div class="review-card-content">
                    <!-- 关闭按钮 -->
                    <button class="close-btn" @click="handleClose">×</button>

                    <!-- 复盘列表 -->
                    <div class="review-list">
                        <div v-if="!allReviews?.length" class="empty-state">
                            暂无复盘记录
                        </div>
                        <div v-else v-for="review in allReviews" 
                             :key="review.id" 
                             class="review-card-item">
                            <div class="review-card-item-info">
                                <div class="review-time">
                                    {{ formatDateWithTemplate(review.createdAt, 'YYYY/MM/DD HH:mm') }}
                                </div>
                                <div class="review-progress">
                                    进度：{{ review.goalProgress?.currentProgress }}%
                                </div>
                            </div>
                            <div class="review-card-item-btn">
                                <button class="btn btn-primary" @click="handleEdit(review.id)">
                                    编辑
                                </button>
                                <button class="btn btn-danger" @click="handleDelete(review.id)">
                                    删除
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">

import { useGoalReview } from '../composables/useGoalReview';
// utils
import { formatDateWithTemplate } from '@/shared/utils/dateUtils';
defineProps<{
    visible: boolean;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'edit', reviewId: string): void;
    (e: 'delete', reviewId: string): void;
}>();
const { allReviews } = useGoalReview();

// 事件处理
const handleClose = () => emit('close');
const handleEdit = (reviewId: string) => {
    emit('edit', reviewId);
    handleClose();
};
const handleDelete = (reviewId: string) => {
    emit('delete', reviewId);
    handleClose();
};
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.review-card {
    background: rgb(49, 47, 47);
    border-radius: 12px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
}

.review-card-content {
    padding: 2rem;
}
/* item */
.review-card-item {
    background: rgb(41, 41, 41);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;

    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
}
.close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-dark);
    padding: 0.5rem;
    line-height: 1;
}

</style>