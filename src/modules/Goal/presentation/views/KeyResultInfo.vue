<template>
    <v-container class="h-100 d-flex flex-column gap-4 pa-4">
        <!-- 返回按钮 -->
        <div class="flex-shrink-0">
            <v-btn icon variant="elevated" size="56px" :color="`rgba(var(--v-theme-surface))`" @click="router.back()">
                <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
        </div>
        
        <!-- 关键结果卡片 -->
        <div class="flex-shrink-0">
            <KeyResultCard :keyResult="keyResult" :goalId="goalId" />
        </div>
        
        <!-- 计算方式、起始值、权重 -->
        <div class="flex-shrink-0 mb-4">
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
        </div>
        
        <!-- 相关任务、记录 - 占据剩余空间 -->
        <div class="key-result-relative-info flex-grow-1 d-flex flex-column">
            <!-- v-tabs 组件 -->
            <v-tabs v-model="activeTab" class="flex-shrink-0 d-flex flex-row">
                <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value" class="flex-grow-1 text-center">
                    {{ tab.name }}
                </v-tab>
            </v-tabs>

            <!-- v-window 组件 -->
            <div class="tab-content flex-grow-1">
                <v-window v-model="activeTab" class="h-100">
                    <v-window-item :value="0" class="h-100">
                        <!-- 关联任务的内容 -->
                        <div class="scrollable-content">
                            <div v-if="taskTemplates.length === 0" class="text-center pa-4">
                                暂无关联任务
                            </div>
                            <div v-else class="pa-4">
                                <div v-for="task in taskTemplates" :key="task.id" class="mb-4">
                                    {{ task.name }}
                                </div>
                            </div>
                        </div>
                    </v-window-item>
                    
                    <v-window-item :value="1" class="h-100">
                        <div class="scrollable-content">
                            <div v-if="records.length === 0" class="text-center pa-4">
                                暂无记录
                            </div>
                            <div v-else class="pa-4">
                                <div v-for="record in records" :key="record.id" class="mb-4">
                                    <RecordCard :record="record" />
                                </div>
                            </div>
                        </div>
                    </v-window-item>
                </v-window>
            </div>
        </div>
    </v-container>
</template>

<style lang="css" scoped>
.key-result-relative-info {
    background-color: rgb(var(--v-theme-surface));
    min-height: 0;
}

.tab-content {
    min-height: 0;
    overflow: hidden;
}

.scrollable-content {
    height: 100%;
    overflow-y: auto;
}
</style>
<script setup lang="ts">
// vue
import { computed, onMounted, ref } from 'vue';
// vue-router
import { useRoute, useRouter } from 'vue-router';
// stores
import { useGoalStore } from '../stores/goalStore.new';
import { useTaskStore } from '@/modules/Task/presentation/stores/taskStore';
// 组件
import KeyResultCard from '../components/KeyResultCard.vue';
import RecordCard from '../components/RecordCard.vue';

const router = useRouter();
const route = useRoute();
const goalId = route.params.goalId as string; // 从路由参数中获取目标ID
const keyResultId = route.params.keyResultId as string; // 从路由参数中获取关键结果ID

const goalStore = useGoalStore();
const taskStore = useTaskStore();

const taskTemplates = ref<any>([]);
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

onMounted(async() => {
    taskTemplates.value = await taskStore.getTaskTemplateForKeyResult(goalId, keyResultId);

})

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
    min-height: 0;
}

.tab-content {
    min-height: 0;
    overflow: hidden;
}

.scrollable-content {
    height: 100%;
    overflow-y: auto;
}

</style>