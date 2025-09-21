<template>
    <v-container fluid class="pa-0 h-100">
        <!-- 手机桌面风格的网格布局 -->
        <div class="phone-desktop">
            <!-- 网格容器 -->
            <div class="desktop-grid" @contextmenu.prevent="handleDesktopContextMenu">
                <!-- 模板项（应用图标风格） -->
                <div v-for="template in reminderTemplates" :key="template.uuid" class="app-icon"
                    :class="{ disabled: !template.enabled }" @click="handleTemplateClick(template)"
                    @contextmenu.prevent="handleTemplateContextMenu(template, $event)">
                    <div class="icon-circle">
                        <v-icon :color="template.enabled ? '#2196F3' : '#999'" size="32">
                            mdi-bell
                        </v-icon>
                    </div>
                    <div class="app-name">{{ template.name }}</div>
                </div>

                <!-- 分组项（文件夹风格） -->
                <div v-for="group in templateGroups" :key="group.uuid" class="folder-icon"
                    :class="{ disabled: !group.enabled }" @click="handleGroupClick(group)"
                    @contextmenu.prevent="handleGroupContextMenu(group, $event)">
                    <div class="folder-circle">
                        <v-icon :color="group.enabled ? '#4CAF50' : '#999'" size="32">
                            mdi-folder
                        </v-icon>
                        <div class="folder-badge" v-if="getGroupTemplateCount(group) > 0">
                            {{ getGroupTemplateCount(group) }}
                        </div>
                    </div>
                    <div class="folder-name">{{ group.name }}</div>
                </div>
            </div>

            <!-- 底部工具栏 -->
            <div class="bottom-dock">
                <v-btn icon size="large" @click="templateDialogRef?.openDialog()" class="dock-btn">
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
                <v-btn icon size="large" @click="groupDialogRef?.openDialog()" class="dock-btn">
                    <v-icon>mdi-folder-plus</v-icon>
                </v-btn>
                <v-btn icon size="large" @click="refresh" :loading="isLoading" class="dock-btn">
                    <v-icon>mdi-refresh</v-icon>
                </v-btn>
            </div>
        </div>

        <!-- 右键菜单 -->
        <v-menu v-model="contextMenu.show"
            :style="`left: ${contextMenu.x}px; top: ${contextMenu.y}px; position: fixed;`" absolute>
            <v-list>
                <v-list-item v-for="item in contextMenu.items" :key="item.title" @click="item.action">
                    <template #prepend>
                        <v-icon>{{ item.icon }}</v-icon>
                    </template>
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>

        <!-- 确认删除对话框 -->
        <v-dialog v-model="deleteDialog.show" max-width="400">
            <v-card>
                <v-card-title>确认删除</v-card-title>
                <v-card-text>
                    确定要删除{{ deleteDialog.type === 'template' ? '模板' : '分组' }}
                    "{{ deleteDialog.name }}" 吗？
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="deleteDialog.show = false">取消</v-btn>
                    <v-btn color="error" @click="confirmDelete">删除</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 加载状态 -->
        <v-overlay v-model="isLoading" class="align-center justify-center">
            <v-progress-circular size="64" indeterminate color="primary" />
        </v-overlay>

        <!-- 错误提示 -->
        <v-snackbar v-model="showError" color="error" timeout="5000" location="top">
            {{ error }}
        </v-snackbar>

        <!-- 对话框组件 -->
        <SimpleTemplateDialog ref="templateDialogRef" @template-created="handleTemplateCreated"
            @template-updated="handleTemplateUpdated" />
        <SimpleGroupDialog ref="groupDialogRef" @group-created="handleGroupCreated"
            @group-updated="handleGroupUpdated" />
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'

// 组件导入
import SimpleTemplateDialog from '../components/dialogs/SimpleTemplateDialog.vue'
import SimpleGroupDialog from '../components/dialogs/SimpleGroupDialog.vue'

// Composables
import { useReminder } from '../composables/useReminder'

// 应用服务
import { ReminderWebApplicationService } from '../../application/services/ReminderWebApplicationService'

// 类型导入 - 使用 domain-client 实体
import type { ReminderTemplate, ReminderTemplateGroup } from '@dailyuse/domain-client'

// 使用 composables
const {
    isLoading,
    error,
    reminderTemplates,
    initialize,
    refreshAll,
    deleteTemplate
} = useReminder()

// 直接使用应用服务获取分组数据
const reminderService = new ReminderWebApplicationService()
const reminderTemplateGroups = ref<ReminderTemplateGroup[]>([])

// 别名以保持兼容性
const templates = computed(() => reminderTemplates.value)
const groups = computed(() => reminderTemplateGroups.value)
const templateGroups = computed(() => reminderTemplateGroups.value)
const refresh = refreshAll

// 加载分组数据
const loadGroups = async () => {
    try {
        const groupsData = await reminderService.getReminderTemplateGroups()
        reminderTemplateGroups.value = groupsData
    } catch (error) {
        console.error('加载分组失败:', error)
    }
}

const deleteGroup = async (uuid: string) => {
    try {
        await reminderService.deleteReminderTemplateGroup(uuid)
        await loadGroups() // 重新加载分组数据
        console.log('删除分组成功:', uuid)
    } catch (error) {
        console.error('删除分组失败:', error)
    }
}

// Dialog refs
const templateDialogRef = ref<InstanceType<typeof SimpleTemplateDialog> | null>(null)
const groupDialogRef = ref<InstanceType<typeof SimpleGroupDialog> | null>(null)

// 响应式数据
const showError = ref(false)

// 右键菜单状态
const contextMenu = reactive({
    show: false,
    x: 0,
    y: 0,
    items: [] as Array<{
        title: string
        icon: string
        action: () => void
    }>
})

// 删除对话框状态
const deleteDialog = reactive({
    show: false,
    type: 'template' as 'template' | 'group',
    uuid: '',
    name: ''
})

// ===== 事件处理 =====

/**
 * 处理模板点击
 */
const handleTemplateClick = (template: ReminderTemplate) => {
    // 打开模板详情或编辑
    templateDialogRef.value?.openForEdit(template)
}

/**
 * 处理分组点击
 */
const handleGroupClick = (group: ReminderTemplateGroup) => {
    // 打开分组详情或编辑
    groupDialogRef.value?.openForEdit(group)
}

/**
 * 处理模板右键菜单
 */
const handleTemplateContextMenu = (template: ReminderTemplate, event: MouseEvent) => {
    contextMenu.x = event.clientX
    contextMenu.y = event.clientY
    contextMenu.items = [
        {
            title: '编辑模板',
            icon: 'mdi-pencil',
            action: () => {
                templateDialogRef.value?.openForEdit(template)
                contextMenu.show = false
            }
        },
        {
            title: template.enabled ? '禁用' : '启用',
            icon: template.enabled ? 'mdi-pause' : 'mdi-play',
            action: () => {
                toggleTemplateEnabled(template)
                contextMenu.show = false
            }
        },
        {
            title: '删除模板',
            icon: 'mdi-delete',
            action: () => {
                openDeleteDialog('template', template.uuid, template.name)
                contextMenu.show = false
            }
        }
    ]
    contextMenu.show = true
}

/**
 * 处理分组右键菜单
 */
const handleGroupContextMenu = (group: ReminderTemplateGroup, event: MouseEvent) => {
    contextMenu.x = event.clientX
    contextMenu.y = event.clientY
    contextMenu.items = [
        {
            title: '编辑分组',
            icon: 'mdi-pencil',
            action: () => {
                groupDialogRef.value?.openForEdit(group)
                contextMenu.show = false
            }
        },
        {
            title: '添加模板',
            icon: 'mdi-plus',
            action: () => {
                templateDialogRef.value?.openForCreate(group.uuid)
                contextMenu.show = false
            }
        },
        {
            title: '删除分组',
            icon: 'mdi-delete',
            action: () => {
                openDeleteDialog('group', group.uuid, group.name)
                contextMenu.show = false
            }
        }
    ]
    contextMenu.show = true
}

/**
 * 处理桌面右键菜单
 */
const handleDesktopContextMenu = (event: MouseEvent) => {
    contextMenu.x = event.clientX
    contextMenu.y = event.clientY
    contextMenu.items = [
        {
            title: '新建模板',
            icon: 'mdi-plus',
            action: () => {
                templateDialogRef.value?.openDialog()
                contextMenu.show = false
            }
        },
        {
            title: '新建分组',
            icon: 'mdi-folder-plus',
            action: () => {
                groupDialogRef.value?.openDialog()
                contextMenu.show = false
            }
        }
    ]
    contextMenu.show = true
}

// ===== 业务逻辑 =====

/**
 * 切换模板启用状态
 */
const toggleTemplateEnabled = async (template: ReminderTemplate) => {
    try {
        // 调用 domain entity 的业务方法
        template.toggleEnabled(!template.enabled)
        // 这里应该调用应用服务来持久化更改
        // await updateTemplate(template)
    } catch (error) {
        console.error('切换模板状态失败:', error)
    }
}

/**
 * 获取分组中的模板数量
 */
const getGroupTemplateCount = (group: ReminderTemplateGroup): number => {
    return templates.value.filter(t => t.groupUuid === group.uuid).length
}

/**
 * 打开删除确认对话框
 */
const openDeleteDialog = (type: 'template' | 'group', uuid: string, name: string) => {
    deleteDialog.type = type
    deleteDialog.uuid = uuid
    deleteDialog.name = name
    deleteDialog.show = true
}

/**
 * 确认删除
 */
const confirmDelete = async () => {
    try {
        if (deleteDialog.type === 'template') {
            await deleteTemplate(deleteDialog.uuid)
        } else {
            await deleteGroup(deleteDialog.uuid)
        }
        deleteDialog.show = false
    } catch (error) {
        console.error('删除失败:', error)
    }
}

// ===== 对话框事件处理 =====

/**
 * 处理模板创建事件
 */
const handleTemplateCreated = async (template: ReminderTemplate) => {
    console.log('模板已创建:', template)
    await refresh()
}

/**
 * 处理模板更新事件
 */
const handleTemplateUpdated = async (template: ReminderTemplate) => {
    console.log('模板已更新:', template)
    await refresh()
}

/**
 * 处理分组创建事件
 */
const handleGroupCreated = async (group: ReminderTemplateGroup) => {
    console.log('分组已创建:', group)
    await refresh()
}

/**
 * 处理分组更新事件
 */
const handleGroupUpdated = async (group: ReminderTemplateGroup) => {
    console.log('分组已更新:', group)
    await refresh()
}// ===== 生命周期 =====

onMounted(async () => {
    try {
        await initialize()
        await loadGroups() // 加载分组数据
    } catch (error) {
        console.error('初始化失败:', error)
        showError.value = true
    }
})
</script>

<style scoped>
.phone-desktop {
    height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;
    padding: 20px;
    display: flex;
    flex-direction: column;
}

.desktop-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 16px;
    padding: 20px;
    align-content: start;
}

.app-icon,
.folder-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: transform 0.2s ease;
    user-select: none;
}

.app-icon:hover,
.folder-icon:hover {
    transform: scale(1.05);
}

.app-icon.disabled,
.folder-icon.disabled {
    opacity: 0.5;
}

.icon-circle,
.folder-circle {
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    position: relative;
}

.folder-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #ff4444;
    color: white;
    border-radius: 10px;
    min-width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
}

.app-name,
.folder-name {
    color: white;
    font-size: 12px;
    text-align: center;
    max-width: 80px;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.bottom-dock {
    height: 80px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.dock-btn {
    background: rgba(255, 255, 255, 0.2) !important;
    color: white !important;
    backdrop-filter: blur(10px);
}

.dock-btn:hover {
    background: rgba(255, 255, 255, 0.3) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .desktop-grid {
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 12px;
        padding: 15px;
    }

    .phone-desktop {
        padding: 15px;
    }
}

@media (max-width: 480px) {
    .desktop-grid {
        grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
        gap: 10px;
    }
}
</style>