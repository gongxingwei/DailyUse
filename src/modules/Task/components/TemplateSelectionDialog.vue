<!-- filepath: /d:/myPrograms/DailyUse/src/modules/Task/components/TemplateSelectionDialog.vue -->
<template>
    <v-dialog :model-value="visible" max-width="800" persistent>
        <v-card class="template-selection-dialog">
            <v-card-title class="dialog-header">
                <v-icon color="primary" class="mr-2">mdi-view-grid-plus</v-icon>
                选择任务模板类型
                <v-spacer />
                <v-btn icon variant="text" @click="$emit('cancel')">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-card-text class="template-grid">
                <v-card v-for="template in templateTypes" :key="template.type" class="template-type-card"
                    :class="{ 'selected': selectedType === template.type }" elevation="2" hover
                    @click="selectTemplate(template.type)">
                    <v-card-text class="text-center pa-4">
                        <v-avatar :color="template.color" size="64" class="mb-3">
                            <v-icon size="32" color="white">
                                {{ template.icon }}
                            </v-icon>
                        </v-avatar>

                        <h3 class="text-h6 mb-2">{{ template.title }}</h3>
                        <p class="text-body-2 text-medium-emphasis">
                            {{ template.description }}
                        </p>

                        <div class="template-features mt-3">
                            <v-chip v-for="feature in template.features" :key="feature" size="small" variant="outlined"
                                class="ma-1">
                                {{ feature }}
                            </v-chip>
                        </div>
                    </v-card-text>
                </v-card>
            </v-card-text>

            <v-card-actions class="dialog-actions">
                <v-spacer />
                <v-btn variant="text" @click="$emit('cancel')">
                    取消
                </v-btn>
                <v-btn color="primary" variant="elevated" :disabled="!selectedType" @click="confirmSelection">
                    继续创建
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface TemplateType {
    type: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    features: string[];
}

interface Props {
    visible: boolean;
}

interface Emits {
    (e: 'cancel'): void;
    (e: 'select', templateType: string): void;
    (e: 'update:visible', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedType = ref<string>('');

const templateTypes: TemplateType[] = [
    {
        type: 'empty',
        title: '空白模板',
        description: '从零开始创建自定义任务模板',
        icon: 'mdi-file-outline',
        color: 'grey',
        features: ['完全自定义', '灵活配置']
    },
    {
        type: 'habit',
        title: '习惯养成',
        description: '建立日常习惯，追踪进度',
        icon: 'mdi-repeat',
        color: 'green',
        features: ['每日重复', '21天计划', '进度追踪']
    },
    // {
    //   type: 'work',
    //   title: '工作项目',
    //   description: '管理工作任务和项目进度',
    //   icon: 'mdi-briefcase',
    //   color: 'blue',
    //   features: ['工作时间', '跳过周末', '项目管理']
    // },
    // {
    //   type: 'event',
    //   title: '事件提醒',
    //   description: '重要事件和约会提醒',
    //   icon: 'mdi-calendar-star',
    //   color: 'orange',
    //   features: ['单次事件', '多重提醒', '日程安排']
    // },
    // {
    //   type: 'deadline',
    //   title: '截止任务',
    //   description: '有明确截止日期的任务',
    //   icon: 'mdi-clock-alert',
    //   color: 'red',
    //   features: ['截止提醒', '优先级管理', '紧急处理']
    // },
    // {
    //   type: 'meeting',
    //   title: '会议安排',
    //   description: '定期会议和团队协作',
    //   icon: 'mdi-account-group',
    //   color: 'purple',
    //   features: ['定期会议', '团队协作', '议程管理']
    // }
];

const selectTemplate = (type: string) => {
    selectedType.value = type;
};

const confirmSelection = () => {
    if (selectedType.value) {
        emit('select', selectedType.value);
    }
};

// 重置选择当对话框关闭时
watch(() => props.visible, (newVal) => {
    if (!newVal) {
        selectedType.value = '';
    }
});
</script>

<style scoped>
.template-selection-dialog {
    border-radius: 16px;
}

.dialog-header {
    background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.1), rgba(var(--v-theme-secondary), 0.05));
    border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    padding: 1.5rem;
}

.template-type-card {
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;
}

.template-type-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.template-type-card.selected {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.05);
}

.template-features {
    min-height: 40px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
}

.dialog-actions {
    padding: 1rem 1.5rem;
    border-top: 1px solid rgba(var(--v-theme-outline), 0.12);
}

@media (max-width: 768px) {
    .template-grid {
        grid-template-columns: 1fr;
        padding: 1rem;
    }
}
</style>