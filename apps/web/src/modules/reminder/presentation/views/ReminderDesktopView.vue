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
                <v-btn icon size="large" @click="openGroupView()" class="dock-btn">
                    <v-icon>mdi-folder-plus</v-icon>
                </v-btn>
                <v-btn icon size="large" @click="refresh" :loading="isLoading" class="dock-btn">
                    <v-icon>mdi-refresh</v-icon>
                </v-btn>
            </div>
        </div>

        <!-- 右键菜单 -->
        <div v-if="contextMenu.show" class="context-menu-overlay" @click="contextMenu.show = false"
            @contextmenu.prevent="contextMenu.show = false">
            <div class="context-menu" :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }">
                <div v-for="item in contextMenu.items" :key="item.title" class="context-menu-item" @click="item.action">
                    <v-icon class="mr-2" size="small">{{ item.icon }}</v-icon>
                    {{ item.title }}
                </div>
            </div>
        </div>

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
        <TemplateMoveDialog v-model="moveDialog.show" :template="moveDialog.template" @moved="handleTemplateMoved"
            @closed="moveDialog.show = false" />

        <!-- 模板卡片组件 -->
        <!-- TemplateCard 组件 -->
        <TemplateCard ref="templateCardRef" />

        <!-- GroupDialog 组件 -->
        <GroupDialog ref="groupDialogRef" />
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'

// 组件导入
import SimpleTemplateDialog from '../components/dialogs/SimpleTemplateDialog.vue'
import SimpleGroupDialog from '../components/dialogs/SimpleGroupDialog.vue'
import TemplateMoveDialog from '../components/dialogs/TemplateMoveDialog.vue'
import TemplateCard from '../components/cards/TemplateCard.vue'
import GroupDialog from '../components/GroupDialog.vue'

// Composables
import { useReminder } from '../composables/useReminder'
import { useSnackbar } from '@/shared/composables/useSnackbar'

// 应用服务
import { getReminderService } from '../../application/services/ReminderWebApplicationService'

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

const snackbar = useSnackbar()

// 直接使用应用服务获取分组数据 - 懒加载
const reminderService = getReminderService()
const reminderTemplateGroups = ref<any[]>([])

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
const groupDialogRef = ref<InstanceType<typeof GroupDialog> | null>(null)
const templateCardRef = ref<InstanceType<typeof TemplateCard> | null>(null)

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

// 移动对话框状态
const moveDialog = reactive({
    show: false,
    template: null as ReminderTemplate | null
})

// ===== 事件处理 =====

/**
 * 处理模板点击
 */
const handleTemplateClick = (template: ReminderTemplate) => {
    // 显示模板卡片而非编辑对话框
    templateCardRef.value?.open(template)
}

/**
 * 处理分组点击
 */
const handleGroupClick = (group: ReminderTemplateGroup) => {
    // 打开分组详情或编辑
    groupDialogRef.value?.open(group)
}

/**
 * 打开组视图
 */
const openGroupView = (group?: ReminderTemplateGroup) => {
    if (group) {
        groupDialogRef.value?.open(group)
    } else {
        // 显示第一个组或提示选择组
        if (reminderTemplateGroups.value.length > 0) {
            groupDialogRef.value?.open(reminderTemplateGroups.value[0])
        } else {
            snackbar.showInfo('暂无可用的模板组')
        }
    }
}

/**
 * 处理模板右键菜单
 */
const handleTemplateContextMenu = (template: ReminderTemplate, event: MouseEvent) => {
    contextMenu.x = event.clientX
    contextMenu.y = event.clientY
    contextMenu.items = [
        {
            title: '查看详情',
            icon: 'mdi-information',
            action: () => {
                templateCardRef.value?.open(template)
                contextMenu.show = false
            }
        },
        {
            title: '编辑模板',
            icon: 'mdi-pencil',
            action: () => {
                templateDialogRef.value?.openForEdit(template)
                contextMenu.show = false
            }
        },
        {
            title: '移动到分组',
            icon: 'mdi-folder-move',
            action: () => {
                openMoveDialog(template)
                contextMenu.show = false
            }
        },
        {
            title: '复制模板',
            icon: 'mdi-content-copy',
            action: () => {
                duplicateTemplate(template)
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
            title: '测试模板',
            icon: 'mdi-play-circle',
            action: () => {
                testTemplate(template)
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
            title: '查看分组',
            icon: 'mdi-folder-open',
            action: () => {
                showGroupTemplates(group)
                contextMenu.show = false
            }
        },
        {
            title: '编辑分组',
            icon: 'mdi-pencil',
            action: () => {
                groupDialogRef.value?.open(group)
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
            title: '复制分组',
            icon: 'mdi-content-copy',
            action: () => {
                duplicateGroup(group)
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
                // GroupDialog 目前没有创建功能，使用现有对话框
                templateDialogRef.value?.openDialog()
                contextMenu.show = false
            }
        },
        {
            title: '刷新',
            icon: 'mdi-refresh',
            action: () => {
                initialize()
                contextMenu.show = false
            }
        },
        {
            title: '整理桌面',
            icon: 'mdi-view-grid',
            action: () => {
                // TODO: 实现桌面整理功能
                console.log('整理桌面')
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
 * 复制模板
 */
const duplicateTemplate = async (template: ReminderTemplate) => {
    try {
        // 使用模板数据创建新模板请求
        const createRequest = {
            name: `${template.name} - 副本`,
            message: template.message,
            category: template.category,
            priority: template.priority,
            timeConfig: {
                type: template.timeConfig.type === 'absolute' || template.timeConfig.type === 'relative'
                    ? 'custom'
                    : template.timeConfig.type,
                times: template.timeConfig.times || [],
                weekdays: template.timeConfig.weekdays,
                monthDays: template.timeConfig.monthDays,
                customPattern: template.timeConfig.customPattern
            },
            groupUuid: template.groupUuid,
            tags: template.tags
        }

        // 调用应用服务创建新模板
        await reminderService.createReminderTemplate(createRequest)
        // 刷新数据
        await initialize()
        console.log('模板复制成功')
    } catch (error) {
        console.error('复制模板失败:', error)
    }
}

/**
 * 测试模板
 */
const testTemplate = async (template: ReminderTemplate) => {
    try {
        // 这里可以创建一个临时实例来测试
        console.log('测试模板:', template.name)
        // 可以显示一个通知或者创建一个测试提醒
        alert(`测试模板: ${template.name}\n消息: ${template.message}`)
    } catch (error) {
        console.error('模板测试失败:', error)
    }
}

/**
 * 显示分组内的模板（以桌面形式）
 */
const showGroupTemplates = (group: ReminderTemplateGroup) => {
    // 这里可以实现一个新的对话框显示分组内的模板
    // 暂时先用简单的方式显示
    const groupTemplates = templates.value.filter(t => t.groupUuid === group.uuid)
    console.log(`分组 "${group.name}" 包含 ${groupTemplates.length} 个模板:`, groupTemplates)
    // TODO: 创建 GroupDetailDialog 组件来以桌面形式显示分组内的模板
}

/**
 * 复制分组
 */
const duplicateGroup = async (group: ReminderTemplateGroup) => {
    try {
        // 创建分组副本
        const createRequest = {
            name: `${group.name} - 副本`,
            description: group.description,
            color: group.color,
            icon: group.icon
        }

        await reminderService.createReminderTemplateGroup(createRequest)
        await initialize()
        console.log('分组复制成功')
    } catch (error) {
        console.error('复制分组失败:', error)
    }
}

/**
 * 获取分组中的模板数量
 */
const getGroupTemplateCount = (group: ReminderTemplateGroup): number => {
    return templates.value.filter(t => t.groupUuid === group.uuid).length
}

/**
 * 打开移动对话框
 */
const openMoveDialog = (template: ReminderTemplate) => {
    moveDialog.template = template
    moveDialog.show = true
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
 * 处理模板移动事件
 */
const handleTemplateMoved = async (templateUuid: string, targetGroupUuid: string) => {
    console.log('模板已移动:', templateUuid, '到分组:', targetGroupUuid)
    await refresh()
    moveDialog.show = false
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

/* 上下文菜单样式 */
.context-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 999;
    background: transparent;
}

.context-menu {
    position: fixed;
    z-index: 1000;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(0, 0, 0, 0.1);
    min-width: 180px;
    overflow: hidden;
    backdrop-filter: blur(10px);
}

.context-menu-item {
    padding: 12px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 14px;
    transition: background-color 0.2s ease;
    color: #333;
}

.context-menu-item:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.context-menu-item:first-child {
    border-radius: 8px 8px 0 0;
}

.context-menu-item:last-child {
    border-radius: 0 0 8px 8px;
}
</style>