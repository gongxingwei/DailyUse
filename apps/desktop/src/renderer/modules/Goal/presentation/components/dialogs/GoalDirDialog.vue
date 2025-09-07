<template>
    <v-dialog :model-value="props.modelValue" max-width="400" persistent>
        <v-card>
            <v-card-title class="pa-4">
                <v-icon size="24" class="mr-2">mdi-folder-plus</v-icon>
                {{ isEditing ? '编辑目标节点' : '创建目标节点' }}
            </v-card-title>

            <v-form ref="formRef">
                <v-card-text class="pa-4">
                <v-text-field v-model="localGoalDir.name" label="节点名称" variant="outlined" density="compact" :rules="nameRules"
                    @keyup.enter="handleSave">
                </v-text-field>

                <v-select v-model="localGoalDir.icon" :items="iconOptions" label="选择图标" variant="outlined" density="compact"
                    item-title="text" item-value="value">
                    <template v-slot:item="{ props, item }">
                        <v-list-item v-bind="props">
                            <template v-slot:prepend>
                                <v-icon>{{ item.raw.value }}</v-icon>
                            </template>
                          
                        </v-list-item>
                    </template>
                </v-select>
            </v-card-text>
            </v-form>
            

            <v-card-actions class="pa-4">
                <v-btn variant="text" @click="handleCancel">取消</v-btn>
                <v-btn color="primary" class="ml-2" @click="handleSave" variant="elevated" :disabled="!isFormValid">
                    确定
                </v-btn>
            </v-card-actions>

        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { GoalDir } from '@renderer/modules/Goal/domain/aggregates/goalDir';

const props = defineProps<{
    modelValue: boolean;
    goalDir: GoalDir | null; // 目标目录数据
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'create-goal-dir', goalDir: GoalDir): void;
    (e: 'edit-goal-dir', goalDir: GoalDir): void;
}>();

const localGoalDir = ref<GoalDir>(GoalDir.forCreate());
const isEditing = computed(() => !!props.goalDir);
const formRef = ref<InstanceType<typeof HTMLFormElement> | null>(null);
const isFormValid = computed(() => {
    return formRef.value?.isValid ?? false;
})

watch(() => localGoalDir.value.name, (newName) => {
    console.log('localGoalDir name changed:', newName);
    console.log('isFormValid', isFormValid.value);
    console.log('formRef:', formRef.value);
    console.log('formRef.value?.isValid:', formRef.value?.isValid);
    console.log('isFormValid:', isFormValid.value);
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
    if (!isFormValid.value) return;
    if (props.goalDir) {
        // 编辑模式
        emit('edit-goal-dir', GoalDir.ensureGoalDirNeverNull(localGoalDir.value));
    } else {
        // 创建模式
        emit('create-goal-dir', GoalDir.ensureGoalDirNeverNull(localGoalDir.value));
    }
    closeDialog();
};

const handleCancel = () => {
    closeDialog();
};

const closeDialog = () => {
    emit('update:modelValue', false);
};

watch(
    [() => props.modelValue, () => props.goalDir],
    ([show]) => {
        if (show) {
            localGoalDir.value = props.goalDir ? props.goalDir.clone() : GoalDir.forCreate();
        } else {
            localGoalDir.value = GoalDir.forCreate();
        }
    },
    { immediate: true }
)
</script>
