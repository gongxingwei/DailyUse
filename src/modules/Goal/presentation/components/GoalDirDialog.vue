<template>
    <v-dialog v-model="props.modelValue" max-width="400">
        <v-card>
            <v-card-title class="pa-4">
                <v-icon size="24" class="mr-2">mdi-folder-plus</v-icon>
                {{ dialogTitle }}
            </v-card-title>

            <!-- 正常表单状态 -->
            <template v-if="goalDirData">
                <v-card-text class="pa-4">
                    <v-text-field v-model="name" label="节点名称" variant="outlined" density="compact" :rules="nameRules"
                        @keyup.enter="handleSave">
                    </v-text-field>

                    <v-select v-model="icon" :items="iconOptions" label="选择图标" variant="outlined" density="compact"
                        item-title="text" item-value="value">
                        <template v-slot:item="{ props, item }">
                            <v-list-item v-bind="props">
                                <template v-slot:prepend>
                                    <v-icon>{{ item.raw.value }}</v-icon>
                                </template>
                                <v-list-item-title>{{ item.raw.text }}</v-list-item-title>
                            </v-list-item>
                        </template>
                    </v-select>
                </v-card-text>

                <v-card-actions class="pa-4">
                    <v-spacer></v-spacer>
                    <v-btn variant="outlined" @click="handleCancel">取消</v-btn>
                    <v-btn color="primary" class="ml-2" @click="handleSave" :disabled="!isFormValid">
                        确定
                    </v-btn>
                </v-card-actions>
            </template>

            <!-- 错误状态 -->
            <template v-else>
                <v-card-text class="pa-4">
                    <v-alert type="error" variant="tonal" prominent class="mb-4">
                        <template v-slot:prepend>
                            <v-icon>mdi-alert-circle</v-icon>
                        </template>
                        <v-alert-title>数据加载错误</v-alert-title>
                        <div class="mt-2">
                            目标节点数据未正确加载。可能的原因：
                            <ul class="mt-2 ml-4">
                                <li>数据初始化失败</li>
                                <li>网络连接问题</li>
                                <li>存储服务异常</li>
                            </ul>
                        </div>
                        <div class="mt-3 text-body-2 text-medium-emphasis">
                            建议：关闭对话框后重新尝试，或刷新页面。
                        </div>
                    </v-alert>
                </v-card-text>

                <v-card-actions class="pa-4">
                    <v-btn variant="outlined" @click="handleRetry">
                        <v-icon start>mdi-refresh</v-icon>
                        重试
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" @click="handleCancel">关闭</v-btn>
                </v-card-actions>
            </template>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { GoalDir } from '@/modules/Goal/domain/entities/goalDir';
import type { IGoalDir } from '@common/modules/goal/types/goal';
const props = defineProps<{
    modelValue: boolean;
    goalDirDialogMode: 'create' | 'edit'; // 创建或编辑模式
     goalDirData: GoalDir | IGoalDir | null; // 目标目录数据
}>();

const emit = defineEmits<{
    (e: 'save'): void;
    (e: 'cancel'): void;
    (e: 'retry'): void;
}>();

const dialogTitle = computed(() => {
    if (!props.goalDirDialogMode) return '目标节点';
    return props.goalDirDialogMode === 'create' ? '创建目标节点' : '编辑目标节点';
});

const goalDirInstance = computed(() => {
    if (!props.goalDirData) return null;
    
    // 如果已经是 GoalDir 实例，直接返回
    if (props.goalDirData instanceof GoalDir) {
        return props.goalDirData;
    }
    
    // 如果是普通对象，转换为 GoalDir 实例
    return GoalDir.fromDTO(props.goalDirData);
});

const name = computed({
    get: () => goalDirInstance.value?.name,
    set: (value: string) => {
        goalDirInstance.value?.updateName(value);
    },
});

const icon = computed({
    get: () => goalDirInstance.value?.icon,
    set: (value: string) => {
        goalDirInstance.value?.updateIcon(value);
    },
});

const isFormValid = computed(() => {
    if (!goalDirInstance.value) return false;
    return GoalDir.validate(goalDirInstance.value).isValid;
});

const iconOptions = [
    { text: '文件夹', value: 'mdi-folder' },
    { text: '目标', value: 'mdi-target' },
    { text: '学习', value: 'mdi-school' },
    { text: '工作', value: 'mdi-briefcase' },
    { text: '生活', value: 'mdi-home' },
    { text: '健康', value: 'mdi-heart' },
];

const nameRules = [
    (v: string) => !!v || '名称不能为空',
    (v: string) => (v && v.length >= 1) || '名称至少需要2个字符',
    (v: string) => (v && v.length <= 50) || '名称不能超过50个字符'
];


const handleSave = () => {
    emit('save');
};

const handleCancel = () => {
    emit('cancel');
};

const handleRetry = () => {
    emit('retry');
};



</script>