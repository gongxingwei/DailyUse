<template>
    <div id="goal-dir" class="goal-dir">
        <header class="header d-flex justify-space-between">
            <span class="text-h6">目标节点</span>
            <div class="dropdown">
                <button class="dropdown-trigger">
                    +
                </button>
                <div class="dropdown-menu">
                    <div class="dropdown-item" @click="showGoalDirDialog = true">
                        <v-icon>mdi-folder-plus</v-icon>
                        <span>创建目标节点</span>
                    </div>
                </div>
            </div>
        </header>
        <main>
            <div v-for="item in goalDirs" :key="item.id"
                class="goal-dir-items cursor-pointer d-flex align-center justify-start px-2 py-1rem"
                :class="{ 'active': selectedDirId === item.id }" @click="selectDir(item.id)">
                <div class="button-list">
                    <v-icon>{{ item.icon }}</v-icon>
                    <span class="ml-1rem">{{ item.name }}</span>
                </div>
            </div>
        </main>
        <GoalDirDialog v-model="showGoalDirDialog"
            @save="saveGoalDir" @cancel="closeGoalDirDialog" />
    </div>

</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGoalDirStore } from '../stores/goalDirStore';
// 组件
import GoalDirDialog from './GoalDirDialog.vue';
import { useGoalManagement } from '../composables/useGoalManagement';
// composables
import { useGoalDirDialog } from '../composables/useGoalDirDialog';
const { showGoalDirDialog, startCreateGoalDir, startEditGoalDir, closeGoalDirDialog,saveGoalDir } = useGoalDirDialog();
const { selectedDirId } = useGoalManagement();
// const { t } = useI18n();
const emit = defineEmits<{
    (e: 'selected-goal-dir-id', selectedDirId: string): void
    (e: 'add-goal-dir'): void
}>();

const goalDirStore = useGoalDirStore();
// 得到所有的目标节点
const goalDirs = computed(() => {
    return goalDirStore.getAllDirs;
});

// 选择点击的文件夹
const selectDir = (dirId: string) => {
    selectedDirId.value = dirId;
    emit('selected-goal-dir-id', dirId);
};
</script>

<style scoped>
.goal-dir {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.header {
    width: 100%;
}

/* 下拉列表 */
.dropdown {
    position: relative;
}

.dropdown-trigger {
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.dropdown-trigger:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background-color: #2d2d2d;
    border-radius: 4px;
    padding: 0.5rem 0;
    min-width: 200px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.2s;
}

.dropdown:hover .dropdown-menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    color: #fff;
    transition: background-color 0.2s;
}

.dropdown-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.dropdown-menu {
    z-index: 100;
}

/* 目标文件夹列表item */
.goal-dir-items {
    border-radius: 4px;
    margin-bottom: 0.5rem;
    transition: background-color 0.2s;
    gap: 0.5rem;
}

.goal-dir-items:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.goal-dir-items.active {
    background-color: rgba(255, 255, 255, 0.2);
    color: rgb(var(--v-theme-primary));
}
</style>