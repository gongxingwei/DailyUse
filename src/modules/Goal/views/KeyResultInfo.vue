<template>
    <v-container>
        <!-- 返回按钮 -->
        <v-row>
            <v-col cols="12">
                <v-btn
                    color="primary"
                    variant="text"
                    prepend-icon="mdi-arrow-left"
                    @click="router.back()"
                >
                    返回
                </v-btn>
            </v-col>
        </v-row>
        <v-row>
            <KeyResultCard :keyResult="keyResult" :goalId="goalId" />
        </v-row>
        <!-- 计算方式、起始值、权重 -->
        <v-row>
            <v-col cols="12">
                <div class="d-flex gap-4">
                    <!-- 计算方式 -->
                    <v-chip :color="goalColor" variant="outlined" label size="large">
                        <v-icon start icon="mdi-calculator-variant" />
                        {{ keyResult.calculationMethod }}
                    </v-chip>

                    <!-- 初始值 -->
                    <v-chip :color="goalColor" variant="outlined" label size="large">
                        <v-icon start icon="mdi-numeric" />
                        起始值: {{ keyResult.startValue }}
                    </v-chip>

                    <!-- 权重 -->
                    <v-chip :color="goalColor" variant="outlined" label size="large">
                        <v-icon start icon="mdi-weight" />
                        权重: {{ keyResult.weight }}
                    </v-chip>
                </div>
            </v-col>
        </v-row>
        <!-- 相关任务、记录 -->
        <v-row class="key-result-relative-info">
            <v-col cols="12">
                <!-- v-tabs 组件 -->
                <v-tabs v-model="activeTab">
                    <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
                        {{ tab.name }}
                    </v-tab>
                </v-tabs>

                <!-- v-window 组件 -->
                <v-window v-model="activeTab">
                    <v-window-item :value="0">
                        <!-- 关联任务的内容 -->
                        <div class="pa-4">
                            <div v-if="taskTemplates.length === 0" class="text-center pa-4">
                                暂无关联任务
                            </div>
                            <div v-else v-for="task in taskTemplates" :key="task.id">
                                <TaskTemplateCard :taskTemplate="task" :key-result-id="keyResult.id" />
                            </div>
                        </div>
                    </v-window-item>
                    <v-window-item :value="1">
                        <div class="pa-4">
                            <div v-for="record in records" :key="record.id">
                                <RecordCard :record="record" />
                            </div>
                        </div>
                    </v-window-item>
                </v-window>
            </v-col>
        </v-row>

    </v-container>
</template>
<script setup lang="ts">
// vue
import { computed, ref } from 'vue';
// vue-router
import { useRoute, useRouter } from 'vue-router';
// stores
import { useGoalStore } from '../stores/goalStore';
import { useTaskStore } from '@/modules/Task/stores/taskStore';
// 组件
import KeyResultCard from '../components/KeyResultCard.vue';
import RecordCard from '../components/RecordCard.vue';
import TaskTemplateCard from '@/modules/Task/components/TaskTemplateCard.vue';

const router = useRouter();
const route = useRoute();
const goalId = route.params.goalId as string; // 从路由参数中获取目标ID
const keyResultId = route.params.keyResultId as string; // 从路由参数中获取关键结果ID

const goalStore = useGoalStore();
const taskStore = useTaskStore();
// 目标的颜色
const goalColor = computed(() => {
    const goal = goalStore.getGoalById(goalId);
    if (!goal) {
        throw new Error('Goal not found');
    }
    return goal.color;
});
// 关键结果
const keyResult = computed(() => {
    const keyResult = goalStore.getKeyResultById(goalId, keyResultId);
    if (!keyResult) {
        throw new Error('Key result not found');
    }
    return keyResult;
});

const activeTab = ref(0);
const tabs = [
    { name: '关联任务', value: 0 },
    { name: '记录', value: 1 },
];
// 关联的任务模板
const taskTemplates = computed(() => {
    const taskTemplates = taskStore.getTaskTemplateForKeyResult(goalId, keyResultId);
    if (!taskTemplates) {
        throw new Error('Tasks not found');
    }
    return taskTemplates;
});

// 计算所有记录
const records = computed(() => {
    const records = goalStore.getRecordsByKeyResultId(goalId, keyResultId);
    if (!records) {
        throw new Error('Records not found');
    }

    return records;
});
</script>
<style lang="css" scoped>
.key-result-relative-info {
    background-color: rgb(var(--v-theme-surface));
}

</style>