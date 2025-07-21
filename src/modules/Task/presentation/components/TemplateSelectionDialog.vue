<template>
    <v-dialog :model-value="visible" max-width="800" persistent>
        <v-card class="template-selection-dialog">
            <v-card-title class="dialog-header">
                <v-icon color="primary" class="mr-2">mdi-view-grid-plus</v-icon>
                选择任务模板类型
            </v-card-title>

            <v-card-text class="template-grid">
                <!-- 加载状态 -->
                <div v-if="loading" class="text-center pa-8">
                    <v-progress-circular 
                        color="primary" 
                        indeterminate 
                        size="48"
                        class="mb-4"
                    />
                    <p class="text-body-1">正在加载模板...</p>
                </div>

                <!-- 无数据状态 -->
                <div v-else-if="metaTemplates.length === 0" class="text-center pa-8">
                    <v-icon size="64" color="grey" class="mb-4">mdi-folder-open-outline</v-icon>
                    <p class="text-body-1 text-medium-emphasis">暂无可用模板</p>
                    <v-btn color="primary" variant="text" @click="loadMetaTemplates">
                        重新加载
                    </v-btn>
                </div>

                <!-- 模板列表 -->
                <v-card 
                    v-else
                    v-for="metaTemplate in metaTemplates" 
                    :key="metaTemplate.uuid" 
                    class="template-type-card"
                    :class="{ 'selected': selectedMetaTemplateId === metaTemplate.uuid }" 
                    elevation="2" 
                    hover
                    @click="selectMetaTemplate(metaTemplate.uuid)"
                >
                    <v-card-text class="text-center pa-4">
                        <v-avatar :color="getMetaTemplateColor(metaTemplate.category)" size="64" class="mb-3">
                            <v-icon size="32" color="white">
                                {{ getMetaTemplateIcon(metaTemplate.category) }}
                            </v-icon>
                        </v-avatar>

                        <h3 class="text-h6 mb-2">{{ metaTemplate.name }}</h3>
                        <p class="text-body-2 text-medium-emphasis">
                            {{ metaTemplate.description }}
                        </p>

                        <div class="template-features mt-3">
                            <v-chip 
                                v-for="tag in metaTemplate.defaultMetadata.tags" 
                                :key="tag" 
                                size="small" 
                                variant="outlined"
                                class="ma-1"
                            >
                                {{ tag }}
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
                <v-btn 
                    color="primary" 
                    variant="elevated" 
                    :disabled="!selectedMetaTemplateId" 
                    @click="confirmSelection"
                >
                    继续创建
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { TaskMetaTemplate } from '@/modules/Task/domain/aggregates/taskMetaTemplate';

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

const metaTemplates = ref<TaskMetaTemplate[]>([]);
const selectedMetaTemplateId = ref<string>('');
const loading = ref(false);

onMounted(async () => {
    await loadMetaTemplates();
});

const loadMetaTemplates = async () => {
    try {
        loading.value = true;
        // 从主进程获取元模板，而不是使用本地初始化
        const { getTaskDomainApplicationService } = await import('../../application/services/taskDomainApplicationService');
        const taskService = getTaskDomainApplicationService();
        const result = await taskService.getAllMetaTemplates();
        // 转换为 TaskMetaTemplate 实例
        metaTemplates.value = result.map(template => TaskMetaTemplate.fromCompleteData(template));
    } catch (error) {
        console.error('获取元模板失败:', error);
        metaTemplates.value = [];
    } finally {
        loading.value = false;
    }
};

const selectMetaTemplate = (metaTemplateId: string) => {
    selectedMetaTemplateId.value = metaTemplateId;
};

const confirmSelection = () => {
    if (selectedMetaTemplateId.value) {
        emit('select', selectedMetaTemplateId.value);
    }
};

const getMetaTemplateColor = (category: string): string => {
    const colorMap: Record<string, string> = {
        'general': 'grey',
        'habit': 'green',
        'work': 'blue',
        'event': 'orange',
        'deadline': 'red',
        'meeting': 'purple'
    };
    return colorMap[category] || 'grey';
};

const getMetaTemplateIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
        'general': 'mdi-file-outline',
        'habit': 'mdi-repeat',
        'work': 'mdi-briefcase',
        'event': 'mdi-calendar-star',
        'deadline': 'mdi-clock-alert',
        'meeting': 'mdi-account-group'
    };
    return iconMap[category] || 'mdi-file-outline';
};

// 重置选择当对话框关闭时
watch(() => props.visible, (newVal) => {
    if (!newVal) {
        selectedMetaTemplateId.value = '';
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