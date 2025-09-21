<template>
    <v-dialog v-model="isVisible" max-width="600" persistent>
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">{{ isEditing ? 'mdi-pencil' : 'mdi-bell-plus' }}</v-icon>
                {{ isEditing ? '编辑提醒模板' : '新建提醒模板' }}
                <v-spacer />
                <v-btn icon variant="text" @click="closeDialog">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-6">
                <v-form ref="formRef" v-model="isFormValid">
                    <!-- 模板名称 -->
                    <v-text-field v-model="formData.name" label="模板名称" :rules="nameRules" required class="mb-4" />

                    <!-- 提醒消息 -->
                    <v-text-field v-model="formData.message" label="提醒消息" :rules="messageRules" required class="mb-4" />

                    <!-- 描述 -->
                    <v-textarea v-model="formData.description" label="描述" rows="2" class="mb-4" />

                    <!-- 分类 -->
                    <v-text-field v-model="formData.category" label="分类" class="mb-4" />

                    <!-- 优先级 -->
                    <v-select v-model="formData.priority" :items="priorityOptions" label="优先级" class="mb-4" />

                    <!-- 启用开关 -->
                    <v-switch v-model="formData.enabled" label="启用模板" color="primary" class="mb-4" />
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
import type { ReminderTemplate } from '@dailyuse/domain-client'
import type { ReminderContracts } from '@dailyuse/contracts'
import { useReminder } from '../../../composables/useReminder'

// 使用reminder composable
const {
    createTemplate,
    updateTemplate,
    isLoading
} = useReminder()

// 定义事件
const emit = defineEmits<{
    'template-created': [template: ReminderTemplate]
    'template-updated': [template: ReminderTemplate]
}>()

// =====================
// 状态管理
// =====================
const isVisible = ref(false)
const isEditing = ref(false)
const currentTemplate = ref<ReminderTemplate | null>(null)
const currentGroupUuid = ref<string | undefined>(undefined)

// 表单数据
const formData = reactive({
    name: '',
    description: '',
    message: '',
    category: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    tags: [] as string[],
    enabled: true
})

// 表单引用和验证
const formRef = ref()
const isFormValid = ref(false)

// 验证规则
const nameRules = [
    (v: string) => !!v || '名称不能为空',
    (v: string) => v.length >= 2 || '名称至少2个字符'
]

const messageRules = [
    (v: string) => !!v || '提醒消息不能为空'
]

// 优先级选项
const priorityOptions = [
    { title: '低优先级', value: 'low' },
    { title: '普通', value: 'normal' },
    { title: '高优先级', value: 'high' },
    { title: '紧急', value: 'urgent' }
]

// =====================
// 暴露的方法
// =====================

/**
 * 打开新建对话框
 */
const openDialog = (groupUuid?: string) => {
    isEditing.value = false
    currentTemplate.value = null
    currentGroupUuid.value = groupUuid
    resetForm()
    isVisible.value = true
}

/**
 * 打开编辑对话框
 */
const openForEdit = (template: ReminderTemplate) => {
    isEditing.value = true
    currentTemplate.value = template
    currentGroupUuid.value = template.groupUuid
    loadFormData(template)
    isVisible.value = true
}

/**
 * 打开创建对话框（指定分组）
 */
const openForCreate = (groupUuid: string) => {
    openDialog(groupUuid)
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
    formData.message = ''
    formData.category = ''
    formData.priority = 'normal'
    formData.tags = []
    formData.enabled = true
}

/**
 * 加载表单数据
 */
const loadFormData = (template: ReminderTemplate) => {
    formData.name = template.name
    formData.description = template.description || ''
    formData.message = template.message || ''
    formData.category = template.category || ''
    formData.priority = template.priority as any || 'normal'
    formData.tags = template.tags || []
    formData.enabled = template.enabled
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
    if (!isFormValid.value) return

    try {
        if (isEditing.value && currentTemplate.value) {
            // 更新模板
            const updateRequest: Partial<ReminderContracts.CreateReminderTemplateRequest> = {
                name: formData.name,
                description: formData.description,
                message: formData.message,
                category: formData.category,
                priority: formData.priority,
                tags: formData.tags,
                groupUuid: currentGroupUuid.value
            }

            const updatedTemplate = await updateTemplate(currentTemplate.value.uuid, updateRequest)
            emit('template-updated', updatedTemplate)
        } else {
            // 创建新模板
            const createRequest: ReminderContracts.CreateReminderTemplateRequest = {
                name: formData.name,
                description: formData.description,
                message: formData.message,
                category: formData.category,
                priority: formData.priority,
                tags: formData.tags,
                groupUuid: currentGroupUuid.value,
                timeConfig: {
                    type: 'daily',
                    times: ['09:00']
                }
            }

            const newTemplate = await createTemplate(createRequest)
            emit('template-created', newTemplate)
        }

        closeDialog()
    } catch (error) {
        console.error('保存模板失败:', error)
    }
}

// 暴露方法给父组件
defineExpose({
    openDialog,
    openForEdit,
    openForCreate
})
</script>