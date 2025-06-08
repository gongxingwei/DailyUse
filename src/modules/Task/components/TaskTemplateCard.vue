<template>
    <v-card class="mb-4" variant="outlined">
        <v-container>
            <v-row class="d-flex justify-space-between align-center">
                <v-col cols="8">
                    <div class="d-flex align-center gap-4">
                        <!-- 任务名称 -->
                        <div>
                            <div class="text-h6">{{ taskTemplate.title }}</div>
                            <span>{{ formatDateRange(taskTemplate) }}</span>
                        </div>
                    </div>
                </v-col>
                
                <v-col cols="4" class="text-right">
                    <!-- 关联的KR值 -->
                    <v-chip color="primary" variant="outlined">
                        KR值: {{ keyResultValue }}
                    </v-chip>
                </v-col>
            </v-row>
        </v-container>
    </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TaskTemplate } from '../types/task';
import { getTaskDisplayDate } from '../utils/taskInstanceUtils';

const props = defineProps<{
    taskTemplate: TaskTemplate;
    keyResultId: string;
}>();

const keyResultValue = computed(() => {
    const relativeKeyResult = props.taskTemplate.keyResultLinks?.find(
        (kr) => kr.keyResultId === props.keyResultId
    );
    if (!relativeKeyResult) {
        return 0;
    }
    return relativeKeyResult.incrementValue;
});

// ✅ 格式化日期范围 - 使用新的时间数据结构
const formatDateRange = (template: TaskTemplate) => {
    const startTime = template.timeConfig.baseTime.start;
    const start = getTaskDisplayDate({ scheduledTime: startTime } as any);
    
    let end = '持续进行';
    if (template.timeConfig.recurrence.endCondition.type === 'date' && 
        template.timeConfig.recurrence.endCondition.endDate) {
        end = getTaskDisplayDate({ 
            scheduledTime: template.timeConfig.recurrence.endCondition.endDate 
        } as any);
    }
    
    return `${start} - ${end}`;
};
</script>

<style scoped>
.v-card {
    transition: all 0.3s ease;
}

.v-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>