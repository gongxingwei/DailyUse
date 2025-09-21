<template>
  <div class="reminder-view">
    
    <!-- Grid Container -->
    <div class="grid-container">
      <ReminderGrid :items="allGridItems" :grid-size="gridSize" />
    </div>


    <ConfirmDialog :model-value="deleteDialog.show" :title="'确认删除'"
      :message="`确定要删除 “${deleteDialog.itemName}”${deleteDialog.type === 'group' ? '？这将同时删除该组中的所有模板。' : '？'}`"
      cancel-text="取消" confirm-text="删除" @update:modelValue="deleteDialog.show = $event" @confirm="confirmDelete"
      @cancel="deleteDialog.show = false" />

    <!-- ReminderTemplateCard -->
    <reminder-template-card :show="reminderTemplateCard.show" :template="reminderTemplateCard.template"
      @back="handleBackFromReminderTemplateCard" />

    <!-- ReminderTemplateGroupCard -->
    <reminder-template-group-card :show="reminderTemplateGroupCard.show"
      :template-group-uuid="(reminderTemplateGroupCard.templateGroupUuid as string)" @back="handleBackFromReminderTemplateGroupCard" />

    <!-- TemplateDialog -->
    <template-dialog :model-value="templateDialog.show"
      :template="(templateDialog.template as ReminderTemplate)"
      @update:modelValue="templateDialog.show = $event" @create-template="handleCreateReminderTemplate"
      @update-template="handleUpdateReminderTemplate" />

    <!-- GroupDialog -->
    <group-dialog :model-value="groupDialog.show"
      :group="(groupDialog.group as ReminderTemplateGroup)"
      @update:modelValue="groupDialog.show = $event" @create-group="handleCreateReminderGroup"
      @update-group="handleUpdateReminderGroup" />

    <!-- TemplateMoveDialog -->
    <template-move-dialog :model-value="moveTemplateDialog.show"
      :template="(moveTemplateDialog.template as ReminderTemplate)"
      @update:modelValue="moveTemplateDialog.show = $event" @move="handleMoveTemplateToGroup" />

    <!-- snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="top right">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 组件导入
import ContextMenu from '../components/context-menu/ContextMenu.vue'
import GroupDialog from '../components/dialogs/GroupDialog.vue'
import TemplateDialog from '../components/dialogs/TemplateDialog.vue'
import TemplateMoveDialog from '../components/dialogs/TemplateMoveDialog.vue'

// Composables
import { useReminder } from '../composables/useReminder'
import { useContextMenu } from '../composables/useContextMenu'

// 类型导入
import type {
  GridItem,
  IReminderTemplate,
  IReminderTemplateGroup,
  ContextMenuItem
} from '@dailyuse/contracts/modules/reminder/types'

// 常量
const SYSTEM_ROOT_GROUP_ID = 'system-root'
const DEFAULT_GRID_CONFIG = {
  columns: 4,
  rows: 8,
  itemSize: 80,
  gap: 12,
  padding: 24,
}

// 使用 composables
const {
  isLoading,
  error,
  reminderTemplates,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  refreshAll
} = useReminder()

const {
  contextMenu,
  showContextMenu,
  closeContextMenu
} = useContextMenu()

// 响应式数据
const selectedItem = ref<GridItem | null>(null)
const gridConfig = ref(DEFAULT_GRID_CONFIG)
const templates = ref<IReminderTemplate[]>([])
const groups = ref<IReminderTemplateGroup[]>([])
const showError = ref(false)

// 对话框状态
const groupDetailDialog = ref({
  show: false,
  group: null as IReminderTemplateGroup | null,
  templates: [] as IReminderTemplate[]
})

const groupDialog = ref({
  show: false,
  group: null as IReminderTemplateGroup | null
})

const templateDialog = ref({
  show: false,
  template: null as IReminderTemplate | null,
  defaultGroupUuid: undefined as string | undefined
})

const moveDialog = ref({
  show: false,
  template: null as IReminderTemplate | null
})

const deleteDialog = ref({
  show: false,
  type: 'template' as 'template' | 'group',
  item: null as GridItem | null,
  itemName: ''
})

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
  timeout: 3000
})

// 计算属性
const gridItems = computed<GridItem[]>(() => {
  const items: GridItem[] = []

  // 目前只添加模板项，分组功能稍后添加
  templates.value.forEach(template => {
    items.push({
      uuid: template.uuid,
      name: template.name,
      type: 'template',
      position: template.position,
      displayOrder: template.displayOrder || 0,
      template
    })
  })

  return items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
})

const emptySlots = computed(() => {
  const totalSlots = gridConfig.value.columns * gridConfig.value.rows
  const usedSlots = gridItems.value.length
  return Math.max(0, totalSlots - usedSlots)
})

// 网格项样式计算
const getItemStyle = (item: GridItem) => {
  const { itemSize, gap } = gridConfig.value
  const position = item.position || getDefaultPosition(item.displayOrder || 0)

  return {
    width: `${itemSize}px`,
    height: `${itemSize}px`,
    left: `${position.x * (itemSize + gap)}px`,
    top: `${position.y * (itemSize + gap)}px`
  }
}

const getEmptySlotStyle = (index: number) => {
  const { itemSize, gap, columns } = gridConfig.value
  const usedSlots = gridItems.value.length
  const slotIndex = usedSlots + index
  const x = slotIndex % columns
  const y = Math.floor(slotIndex / columns)

  return {
    width: `${itemSize}px`,
    height: `${itemSize}px`,
    left: `${x * (itemSize + gap)}px`,
    top: `${y * (itemSize + gap)}px`
  }
}

const getDefaultPosition = (displayOrder: number) => {
  const { columns } = gridConfig.value
  return {
    x: displayOrder % columns,
    y: Math.floor(displayOrder / columns)
  }
}

// 事件处理
const handleItemClick = (item: GridItem) => {
  selectedItem.value = item

  if (item.type === 'group') {
    openGroupDetail(item.group)
  } else if (item.type === 'template') {
    openTemplate(item.template)
  }
}

const handleItemContextMenu = (item: GridItem, event: MouseEvent) => {
  const items = []

  if (item.type === 'group') {
    items.push(
      { label: '打开分组', icon: 'mdi-folder-open', action: () => handleContextMenuAction('open', item) },
      { label: '编辑分组', icon: 'mdi-pencil', action: () => handleContextMenuAction('edit', item) },
      { label: '添加模板', icon: 'mdi-plus', action: () => handleContextMenuAction('add-template', item) },
      { label: '删除分组', icon: 'mdi-delete', action: () => handleContextMenuAction('delete', item) }
    )
  } else {
    items.push(
      { label: '编辑模板', icon: 'mdi-pencil', action: () => handleContextMenuAction('edit', item) },
      { label: '移动到分组', icon: 'mdi-folder-move', action: () => handleContextMenuAction('move', item) },
      {
        label: item.template?.enabled ? '禁用' : '启用',
        icon: item.template?.enabled ? 'mdi-pause' : 'mdi-play',
        action: () => handleContextMenuAction('toggle', item)
      },
      { label: '删除模板', icon: 'mdi-delete', action: () => handleContextMenuAction('delete', item) }
    )
  }

  showContextMenu(event, items)
}

const handleScreenContextMenu = (event: MouseEvent) => {
  const items = [
    {
      label: '新建分组',
      icon: 'mdi-folder-plus',
      action: () => openGroupDialog()
    },
    {
      label: '新建模板',
      icon: 'mdi-plus',
      action: () => openTemplateDialog()
    }
  ]

  showContextMenu(event, items)
}

const handleEmptySlotClick = () => {
  // 点击空白区域，可以显示创建菜单或取消选择
  selectedItem.value = null
}

const handleContextMenuAction = (actionId: string, item: GridItem) => {
  switch (actionId) {
    case 'open':
      if (item.type === 'group') {
        openGroupDetail(item.group)
      }
      break
    case 'edit':
      if (item.type === 'group') {
        openGroupDialog(item.group)
      } else if (item.type === 'template') {
        openTemplateDialog(item.template)
      }
      break
    case 'add-template':
      if (item.type === 'group') {
        openTemplateDialog(undefined, item.group?.uuid)
      }
      break
    case 'move':
      if (item.type === 'template') {
        openMoveDialog(item.template!)
      }
      break
    case 'toggle':
      if (item.type === 'template') {
        toggleTemplateStatus(item.template!)
      }
      break
    case 'delete':
      openDeleteDialog(item)
      break
  }
  closeContextMenu()
}

// 弹窗操作
const openGroupDetail = (group: IReminderTemplateGroup | undefined) => {
  if (!group) return
  const groupTemplates = templates.value.filter(t => t.groupUuid === group.uuid)
  groupDetailDialog.value = {
    show: true,
    group,
    templates: groupTemplates
  }
}

const openGroupDialog = (group?: IReminderTemplateGroup) => {
  groupDialog.value = {
    show: true,
    group: group || null
  }
}

const openTemplateDialog = (template?: IReminderTemplate, defaultGroupUuid?: string) => {
  templateDialog.value = {
    show: true,
    template: template || null,
    defaultGroupUuid
  }
}

const openMoveDialog = (template: IReminderTemplate) => {
  moveDialog.value = {
    show: true,
    template
  }
}

const openDeleteDialog = (item: GridItem) => {
  deleteDialog.value = {
    show: true,
    type: item.type,
    item,
    itemName: item.name
  }
}

const openTemplate = (template: IReminderTemplate | undefined) => {
  if (!template) return
  // 打开模板详情或编辑
  openTemplateDialog(template)
}

const createTemplateInGroup = () => {
  if (groupDetailDialog.value.group) {
    openTemplateDialog(undefined, groupDetailDialog.value.group.uuid)
  }
}

// 操作处理
const toggleTemplateStatus = async (template: IReminderTemplate) => {
  try {
    // 直接调用 toggleTemplateEnabled 方法
    const result = await updateTemplate(template.uuid, {
      // 根据实际的 CreateReminderTemplateRequest 接口调整
    })
    showSnackbar(`模板已${template.enabled ? '禁用' : '启用'}`, 'success')
    await loadData()
  } catch (error) {
    console.error('Toggle template error:', error)
    showSnackbar('操作失败', 'error')
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.value.item) return

  try {
    if (deleteDialog.value.type === 'template') {
      await deleteTemplate(deleteDialog.value.item.uuid)
      showSnackbar('模板已删除', 'success')
    }
    // 分组删除功能暂未实现
    deleteDialog.value.show = false
    selectedItem.value = null
    await loadData()
  } catch (error) {
    showSnackbar('删除失败', 'error')
  }
}

// 成功回调
const handleGroupSuccess = (group: IReminderTemplateGroup) => {
  groupDialog.value.show = false
  showSnackbar('分组操作成功', 'success')
  loadData()
}

const handleTemplateSuccess = (template: IReminderTemplate) => {
  templateDialog.value.show = false
  showSnackbar('模板操作成功', 'success')
  loadData()

  // 如果在组详情中，更新组详情
  if (groupDetailDialog.value.show && groupDetailDialog.value.group) {
    const groupTemplates = templates.value.filter(t => t.groupUuid === groupDetailDialog.value.group?.uuid)
    groupDetailDialog.value.templates = groupTemplates
  }
}

const handleMoveSuccess = () => {
  moveDialog.value.show = false
  showSnackbar('模板移动成功', 'success')
  loadData()
}

const showSnackbar = (message: string, color: 'success' | 'error' | 'warning' = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color,
    timeout: 3000
  }
}

const loadData = async () => {
  try {
    await getTemplates()
    // 直接使用 reminderTemplates 响应式引用
    templates.value = reminderTemplates.value || []
    showError.value = false
  } catch (error) {
    console.error('加载数据失败:', error)
    showSnackbar('加载数据失败', 'error')
    showError.value = true
  }
}

// 生命周期
onMounted(async () => {
  await loadData()
})
</script>

<template>
  <div class="reminder-view">
    <!-- 手机屏幕外壳 -->
    <div class="phone-screen">
      <!-- 状态栏 -->
      <div class="status-bar">
        <span class="time">{{ new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</span>
        <div class="status-icons">
          <v-icon size="14">mdi-signal</v-icon>
          <v-icon size="14">mdi-wifi</v-icon>
          <v-icon size="14">mdi-battery</v-icon>
        </div>
      </div>

      <!-- 网格容器 -->
      <div class="grid-container" @contextmenu.prevent="handleScreenContextMenu">
        <!-- 网格项 -->
        <div v-for="item in gridItems" :key="item.uuid" :style="getItemStyle(item)" class="grid-item"
          :class="{ 'selected': selectedItem?.uuid === item.uuid }" @click="handleItemClick(item)"
          @contextmenu.prevent="handleItemContextMenu(item, $event)">
          <!-- 模板项 -->
          <div v-if="item.type === 'template'" class="template-item">
            <div class="template-icon">
              <v-icon :color="item.template?.color || '#2196F3'" size="32">
                {{ item.template?.icon || 'mdi-bell' }}
              </v-icon>
            </div>
            <div class="template-name">{{ item.name }}</div>
            <div v-if="!item.template?.enabled" class="disabled-overlay">
              <v-icon size="16" color="white">mdi-pause</v-icon>
            </div>
          </div>

          <!-- 分组项 -->
          <div v-else-if="item.type === 'group'" class="group-item">
            <div class="group-icon">
              <v-icon :color="item.group?.color || '#4CAF50'" size="32">
                {{ item.group?.icon || 'mdi-folder' }}
              </v-icon>
            </div>
            <div class="group-name">{{ item.name }}</div>
            <div class="group-badge">
              {{ item.activeTemplateCount }}/{{ item.templateCount }}
            </div>
            <div v-if="!item.group?.enabled" class="disabled-overlay">
              <v-icon size="16" color="white">mdi-pause</v-icon>
            </div>
          </div>
        </div>

        <!-- 空白槽位 -->
        <div v-for="index in emptySlots" :key="`empty-${index}`" :style="getEmptySlotStyle(index - 1)"
          class="empty-slot" @click="handleEmptySlotClick" @contextmenu.prevent="handleScreenContextMenu">
          <div class="empty-placeholder">
            <v-icon size="24" color="#E0E0E0">mdi-plus</v-icon>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="bottom-bar">
        <v-btn icon size="small" @click="openTemplateDialog()" :loading="isLoading">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
        <v-btn icon size="small" @click="openGroupDialog()">
          <v-icon>mdi-folder-plus</v-icon>
        </v-btn>
        <v-btn icon size="small" @click="loadData()" :loading="isLoading">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- 右键菜单 -->
    <ContextMenu v-if="contextMenu.show" :x="contextMenu.x" :y="contextMenu.y" :items="contextMenu.items"
      @close="closeContextMenu" />

    <!-- 分组详情对话框 -->
    <v-dialog v-model="groupDetailDialog.show" max-width="800" persistent>
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-folder-open</v-icon>
          {{ groupDetailDialog.group?.name || '分组详情' }}
          <v-spacer />
          <v-btn icon @click="groupDetailDialog.show = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <div class="mb-4">
            <p class="text-body-2">{{ groupDetailDialog.group?.description || '暂无描述' }}</p>
          </div>

          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title class="text-h6">统计信息</v-card-title>
                <v-card-text>
                  <div class="d-flex justify-space-between">
                    <span>总模板数:</span>
                    <span>{{ groupDetailDialog.templates.length }}</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span>启用模板:</span>
                    <span>{{groupDetailDialog.templates.filter(t => t.enabled).length}}</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title class="text-h6">操作</v-card-title>
                <v-card-text>
                  <v-btn block color="primary" class="mb-2" @click="createTemplateInGroup">
                    <v-icon class="mr-2">mdi-plus</v-icon>
                    添加模板
                  </v-btn>
                  <v-btn block variant="outlined" @click="openGroupDialog(groupDetailDialog.group || undefined)">
                    <v-icon class="mr-2">mdi-pencil</v-icon>
                    编辑分组
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- 模板列表 -->
          <div class="mt-4">
            <h3 class="text-h6 mb-2">模板列表</h3>
            <v-list v-if="groupDetailDialog.templates.length > 0">
              <v-list-item v-for="template in groupDetailDialog.templates" :key="template.uuid"
                @click="openTemplateDialog(template)">
                <template #prepend>
                  <v-icon :color="template.color || '#2196F3'">
                    {{ template.icon || 'mdi-bell' }}
                  </v-icon>
                </template>

                <v-list-item-title>{{ template.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ template.description || template.message }}</v-list-item-subtitle>

                <template #append>
                  <v-chip :color="template.enabled ? 'success' : 'grey'" size="small" variant="flat">
                    {{ template.enabled ? '启用' : '禁用' }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            <v-card v-else variant="outlined" class="text-center pa-4">
              <v-icon size="48" color="grey">mdi-inbox-outline</v-icon>
              <p class="text-body-2 mt-2">暂无模板</p>
              <v-btn color="primary" @click="createTemplateInGroup">
                <v-icon class="mr-2">mdi-plus</v-icon>
                添加第一个模板
              </v-btn>
            </v-card>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 分组编辑对话框 -->
    <GroupDialog v-model="groupDialog.show" :group="groupDialog.group" @success="handleGroupSuccess"
      @cancel="groupDialog.show = false" />

    <!-- 模板编辑对话框 -->
    <TemplateDialog v-model="templateDialog.show" :template="templateDialog.template"
      :default-group-uuid="templateDialog.defaultGroupUuid" @success="handleTemplateSuccess"
      @cancel="templateDialog.show = false" />

    <!-- 模板移动对话框 -->
    <TemplateMoveDialog v-model="moveDialog.show" :template="moveDialog.template" @success="handleMoveSuccess"
      @cancel="moveDialog.show = false" />

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2" color="warning">mdi-alert</v-icon>
          确认删除
        </v-card-title>

        <v-card-text>
          确定要删除{{ deleteDialog.type === 'template' ? '模板' : '分组' }}
          "{{ deleteDialog.itemName }}" 吗？

          <v-alert v-if="deleteDialog.type === 'group'" type="warning" variant="tonal" class="mt-3">
            删除分组将同时删除其中的所有模板！
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog.show = false">取消</v-btn>
          <v-btn color="error" @click="confirmDelete">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 消息提示 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="top">
      {{ snackbar.message }}
      <template #actions>
        <v-btn @click="snackbar.show = false" icon size="small">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>

    <!-- 加载覆盖层 -->
    <v-overlay v-model="isLoading" class="align-center justify-center">
      <v-progress-circular size="64" indeterminate color="primary" />
      <div class="mt-3 text-h6">加载中...</div>
    </v-overlay>

    <!-- 错误提示 -->
    <v-snackbar v-model="showError" color="error" timeout="5000" location="top">
      {{ error }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.reminder-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.phone-screen {
  width: 375px;
  height: 750px;
  background: #000;
  border-radius: 24px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.status-bar {
  height: 44px;
  background: #000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.status-icons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.grid-container {
  flex: 1;
  background: #1a1a1a;
  position: relative;
  padding: 24px;
  overflow: hidden;
}

.grid-item {
  position: absolute;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.grid-item:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.grid-item.selected {
  transform: scale(1.08);
  background: rgba(33, 150, 243, 0.3);
  border-color: #2196F3;
  box-shadow: 0 0 20px rgba(33, 150, 243, 0.5);
}

.template-item,
.group-item {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  padding: 8px;
}

.template-icon,
.group-icon {
  margin-bottom: 4px;
}

.template-name,
.group-name {
  color: white;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(76, 175, 80, 0.8);
  color: white;
  font-size: 8px;
  padding: 2px 4px;
  border-radius: 8px;
  font-weight: 600;
}

.disabled-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-slot {
  position: absolute;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 16px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-slot:hover {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.05);
}

.empty-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-bar {
  height: 80px;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 0 20px;
  flex-shrink: 0;
}

.bottom-bar .v-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.bottom-bar .v-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 对话框样式增强 */
.v-dialog .v-card {
  border-radius: 16px;
}

.v-card-title {
  background: linear-gradient(135deg, #2196F3, #21CBF3);
  color: white;
  border-radius: 16px 16px 0 0;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reminder-view {
    padding: 10px;
  }

  .phone-screen {
    width: 100%;
    max-width: 375px;
    height: 600px;
  }
}
</style>

<style scoped>
.reminder-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg,
      rgba(var(--v-theme-primary), 0.02) 0%,
      rgba(var(--v-theme-surface), 0.95) 100%);
}

.reminder-header {
  padding: 24px;
  background: rgba(var(--v-theme-surface), 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 2rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 8px;
}

.page-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 1rem;
  margin: 0;
}

.grid-container {
  flex: 1;
  padding: 24px;
  overflow: auto;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 768px) {
  .reminder-header {
    padding: 16px;
  }

  .grid-container {
    padding: 16px;
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>
