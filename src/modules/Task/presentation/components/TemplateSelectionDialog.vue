<template>
    <v-dialog :model-value="visible" max-width="800" persistent>
        <v-card class="template-selection-dialog">
            <v-card-title class="dialog-header">
                <v-icon color="primary" class="mr-2">mdi-view-grid-plus</v-icon>
                选择任务模板类型
            </v-card-title>

            <v-card-text class="template-grid">
                <v-card 
                    v-for="metaTemplate in metaTemplates" 
                    :key="metaTemplate.id" 
                    class="template-type-card"
                    :class="{ 'selected': selectedMetaTemplateId === metaTemplate.id }" 
                    elevation="2" 
                    hover
                    @click="selectMetaTemplate(metaTemplate.id)"
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
import { TaskMetaTemplate } from '@/modules/Task/domain/entities/taskMetaTemplate';
import { useTaskStore } from '@/modules/Task/presentation/stores/taskStore';

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
const taskStore = useTaskStore();

onMounted(async () => {
    // 确保初始化了默认的 MetaTemplates
    taskStore.initializeDefaultMetaTemplates();
    metaTemplates.value = taskStore.getAllMetaTemplates;
});

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