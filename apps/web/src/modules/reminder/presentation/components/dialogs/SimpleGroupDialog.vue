<template>
    <v-dialog v-model="isVisible" max-width="500" persistent>
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">{{ isEditing ? 'mdi-pencil' : 'mdi-folder-plus' }}</v-icon>
                {{ isEditing ? '编辑提醒分组' : '新建提醒分组' }}
                <v-spacer />
                <v-btn icon variant="text" @click="closeDialog">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-6">
                <v-form ref="formRef" v-model="isFormValid">
                    <!-- 分组名称 -->
                    <v-text-field v-model="formData.name" label="分组名称" :rules="nameRules" required class="mb-4" />

                    <!-- 描述 -->
                    <v-textarea v-model="formData.description" label="描述" rows="2" class="mb-4" />

                    <!-- 启用模式 -->
                    <v-select v-model="formData.enableMode" :items="enableModeOptions" label="启用模式" class="mb-4" />

                    <!-- 启用开关 -->
                    <v-switch v-model="formData.enabled" label="启用分组" color="primary" class="mb-4" />
                </v-form>
            </v-card-text>

            <v-card-actions class="pa-6 pt-0">
                <v-spacer />
                <v-btn variant="text" @click="closeDialog">
                    取消
                </v-btn>
                <v-btn color="primary" :disabled="!isFormValid" @click="handleSubmit">
                    {{ isEditing ? '更新' : '创建' }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { ReminderTemplateGroup } from '@dailyuse/domain-client'
import { useReminder } from '../../../composables/useReminder'

// 使用reminder composable
const {
    createGroup,
    updateGroup,
    isLoading
} = useReminder()

// 定义事件
const emit = defineEmits<{
    'group-created': [group: ReminderTemplateGroup]
    'group-updated': [group: ReminderTemplateGroup]
}>()

// =====================
// 状态管理
// =====================
const isVisible = ref(false)
const isEditing = ref(false)
const currentGroup = ref<ReminderTemplateGroup | null>(null)

// 表单数据
const formData = reactive({
    name: '',
    description: '',
    enabled: true,
    enableMode: 'group' as 'group' | 'individual'
})

// 表单引用和验证
const formRef = ref()
const isFormValid = ref(false)

// 验证规则
const nameRules = [
    (v: string) => !!v || '分组名称不能为空',
    (v: string) => v.length >= 2 || '分组名称至少2个字符'
]

// 启用模式选项
const enableModeOptions = [
    { title: '按组启用', value: 'group' },
    { title: '单独启用', value: 'individual' }
]

// =====================
// 暴露的方法
// =====================

/**
 * 打开新建对话框
 */
const openDialog = () => {
    isEditing.value = false
    currentGroup.value = null
    resetForm()
    isVisible.value = true
}

/**
 * 打开编辑对话框
 */
const openForEdit = (group: ReminderTemplateGroup) => {
    isEditing.value = true
    currentGroup.value = group
    loadFormData(group)
    isVisible.value = true
}

/**
 * 关闭对话框
 */
const closeDialog = () => {
    isVisible.value = false
    formRef.value?.resetValidation?.()
}

/**
 * 重置表单
 */
const resetForm = () => {
    formData.name = ''
    formData.description = ''
    formData.enabled = true
    formData.enableMode = 'group'
}

/**
 * 加载表单数据
 */
const loadFormData = (group: ReminderTemplateGroup) => {
    formData.name = group.name
    formData.description = group.description || ''
    formData.enabled = group.enabled || true
    formData.enableMode = (group as any).enableMode || 'group'
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
    if (!isFormValid.value) return

    try {
        if (isEditing.value && currentGroup.value) {
            // 更新分组
            const updateRequest = {
                name: formData.name,
                description: formData.description,
                enabled: formData.enabled,
                enableMode: formData.enableMode
            }

            const updatedGroup = await updateGroup(currentGroup.value.uuid, updateRequest)
            emit('group-updated', updatedGroup)
        } else {
            // 创建新分组
            const createRequest = {
                name: formData.name,
                description: formData.description,
                enabled: formData.enabled,
                enableMode: formData.enableMode
            }

            const newGroup = await createGroup(createRequest)
            emit('group-created', newGroup)
        }

        closeDialog()
    } catch (error) {
        console.error('保存分组失败:', error)
    }
}

// 暴露方法给父组件
defineExpose({
    openDialog,
    openForEdit
})
</script>