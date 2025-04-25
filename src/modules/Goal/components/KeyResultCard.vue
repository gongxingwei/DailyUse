<template>
    <v-container>
        <v-card class="d-flex flex-column" @click.stop=" navigateToKeyResultInfo" :style="cardStyle">
            <!-- 进度背景层 -->
            <div 
                class="progress-background"
                :style="{
                    background: goal?.color || '#FF5733',
                    width: `${progress}%`,
                    opacity: 0.1 
                }"
            ></div>
            <v-card-title>
                <v-row>
                    <v-col cols="8">
                        <h3>{{ keyResult.name }}</h3>
                    </v-col>
                </v-row>
            </v-card-title>

            <v-card-text class="d-flex flex-column pa-0">
                <v-row class=" ma-0">
                    <v-col cols="12" class="d-flex flex-row justify-space-between align-end">
                        <div></div>
                        <div class="pb-2 no-wrap">
                            <span>{{ keyResult.currentValue }} -> {{ keyResult.targetValue }}</span>
                        </div>
                        <div>
                            <v-btn icon @click.stop="startAddRecord(keyResult.id)">
                            <v-icon icon="mdi-plus" size="20" />
                        </v-btn>
                        </div>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

    </v-container>
    <RecordDialog :visible="showRecordDialog"
        @save="(record) => handleSaveRecord(record, props.goalId, props.keyResult.id)" @cancel="handleCancelAddRecord" />
</template>
<script lang="ts" setup>
// vue-router
import { useRouter } from 'vue-router';
// types
import { IKeyResult } from '../types/goal';
// 组件
import RecordDialog from './RecordDialog.vue';
// composables
import { useRecordDialog } from '../composables/useRecordDialog';
// stores
import { useGoalStore } from '../stores/goalStore';
import { computed } from 'vue';
const router = useRouter();
const navigateToKeyResultInfo = () => {
    router.push({ name: 'key-result-info', params: { goalId: props.goalId, keyResultId: props.keyResult.id } });
};

const { showRecordDialog, selectedKeyResultId, startAddRecord, handleSaveRecord, handleCancelAddRecord } = useRecordDialog();
const props = defineProps<{
    keyResult: IKeyResult;
    goalId: string;
}>();

const goalStore = useGoalStore();
const goal = computed(() => goalStore.getGoalById(props.goalId));

// 计算进度
const progress = computed(() => {
    return Math.min((props.keyResult.currentValue / props.keyResult.targetValue) * 100, 100);
});
const cardStyle = computed(() => ({
    cursor: 'pointer',
    minHeight: '150px',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }
}));
</script>
<style scoped lang="css">
.progress-background {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    transition: width 0.3s ease;
    pointer-events: none;
}

</style>