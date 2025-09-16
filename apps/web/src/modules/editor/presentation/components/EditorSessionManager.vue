<template>
  <div class="editor-session-manager">
    <!-- 会话选择器 -->
    <div class="session-selector">
      <div class="session-tabs">
        <div
          v-for="session in sessions"
          :key="session.uuid"
          class="session-tab"
          :class="{ active: currentSessionUuid === session.uuid }"
          @click="switchSession(session.uuid)"
        >
          <span class="session-name">{{ session.name }}</span>
          <button
            v-if="sessions.length > 1"
            class="close-btn"
            @click.stop="deleteSession(session.uuid)"
          >
            ×
          </button>
        </div>
        <button class="add-session-btn" @click="createNewSession">
          +
        </button>
      </div>
    </div>

    <!-- 编辑器内容区域 -->
    <div class="editor-content" v-if="currentSession">
      <!-- 编辑器组 -->
      <div class="editor-groups">
        <div
          v-for="group in currentGroups"
          :key="group.uuid"
          class="editor-group"
          :style="{ width: `${group.width}px` }"
          :class="{ 
            active: isActiveGroup(group.uuid),
            resizing: ui.isResizing,
            'drop-target': isDropTarget(group.uuid)
          }"
          @mousedown="setActiveGroup(group.uuid)"
          @dragover.prevent
          @drop="handleDrop($event, group.uuid)"
        >
          <!-- 标签页栏 -->
          <div class="tab-bar">
            <div
              v-for="tab in group.tabs"
              :key="tab.uuid"
              class="tab"
              :class="{ 
                active: isActiveTab(group.uuid, tab.uuid),
                dirty: tab.isDirty,
                preview: tab.isPreview,
                dragging: ui.draggedTabId === tab.uuid
              }"
              @click="setActiveTab(group.uuid, tab.uuid)"
              @mousedown="startTabDrag(tab.uuid)"
              draggable="true"
              @dragstart="onTabDragStart($event, tab.uuid)"
              @dragend="onTabDragEnd"
            >
              <span class="tab-icon">📄</span>
              <span class="tab-title">{{ tab.title }}</span>
              <span v-if="tab.isDirty" class="dirty-indicator">●</span>
              <button
                class="tab-close-btn"
                @click.stop="closeTab(tab.uuid)"
              >
                ×
              </button>
            </div>
            <button
              class="add-tab-btn"
              @click="openNewFile(group.uuid)"
            >
              +
            </button>
          </div>

          <!-- 编辑器内容 -->
          <div class="editor-area">
            <div v-if="getActiveTab(group.uuid)" class="file-content">
              <div class="file-header">
                <span class="file-path">{{ getActiveTab(group.uuid)?.path }}</span>
                <span v-if="getActiveTab(group.uuid)?.isDirty" class="unsaved-changes">●</span>
              </div>
              <div class="editor-placeholder">
                <!-- 这里可以集成真正的代码编辑器 -->
                <textarea
                  v-model="getActiveTab(group.uuid).content"
                  class="simple-editor"
                  @input="onContentChange(group.uuid)"
                  placeholder="开始编辑..."
                />
              </div>
            </div>
            <div v-else class="empty-editor">
              <p>没有打开的文件</p>
              <button @click="openNewFile(group.uuid)">新建文件</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="status-bar">
      <div class="status-left">
        <span>会话: {{ currentSession?.name }}</span>
        <span>组: {{ sessionStats.totalGroups }}</span>
        <span>标签页: {{ sessionStats.totalTabs }}</span>
        <span v-if="hasUnsavedChanges" class="unsaved-warning">有未保存更改</span>
      </div>
      <div class="status-right">
        <span v-if="isLoading">加载中...</span>
        <span v-if="error" class="error">{{ error }}</span>
      </div>
    </div>

    <!-- 通知 -->
    <div class="notifications">
      <div
        v-for="notification in ui.notifications"
        :key="notification.id"
        class="notification"
        :class="notification.type"
        @click="removeNotification(notification.id)"
      >
        {{ notification.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useEditorSessionStore } from '../stores/editorSessionStore';

const editorSessionStore = useEditorSessionStore();

// 响应式数据
const {
  sessions,
  currentSessionUuid,
  isLoading,
  error,
  ui,
} = storeToRefs(editorSessionStore);

// 计算属性
const currentSession = computed(() => editorSessionStore.currentSession);
const sessionStats = computed(() => editorSessionStore.sessionStats);
const hasUnsavedChanges = computed(() => editorSessionStore.hasUnsavedChanges);

const currentGroups = computed(() => {
  const session = currentSession.value;
  return session?._groups || [];
});

// 方法
const { 
  initialize,
  createSession,
  switchToSession,
  deleteSession,
  openFile,
  closeTab,
  setDragState,
  setResizing,
  addNotification,
  removeNotification,
} = editorSessionStore;

// 会话管理
const switchSession = async (sessionUuid: string) => {
  try {
    await switchToSession(sessionUuid);
  } catch (error) {
    console.error('切换会话失败:', error);
  }
};

const createNewSession = async () => {
  const name = prompt('请输入会话名称:');
  if (name) {
    try {
      const sessionUuid = await createSession({ name });
      await switchSession(sessionUuid);
    } catch (error) {
      console.error('创建会话失败:', error);
    }
  }
};

// 编辑器组管理
const isActiveGroup = (groupUuid: string) => {
  return currentSession.value?.activeGroupId === groupUuid;
};

const setActiveGroup = (groupUuid: string) => {
  // 这里需要更新会话的活动组
  if (currentSession.value) {
    (currentSession.value as any)._activeGroupId = groupUuid;
  }
};

// 标签页管理
const isActiveTab = (groupUuid: string, tabUuid: string) => {
  const group = currentGroups.value.find((g: any) => g.uuid === groupUuid);
  return group?.activeTabId === tabUuid;
};

const getActiveTab = (groupUuid: string) => {
  const group = currentGroups.value.find((g: any) => g.uuid === groupUuid);
  if (!group) return null;
  return group.tabs?.find((t: any) => t.uuid === group.activeTabId);
};

const setActiveTab = (groupUuid: string, tabUuid: string) => {
  const group = currentGroups.value.find((g: any) => g.uuid === groupUuid);
  if (group && group.setActiveTab) {
    group.setActiveTab(tabUuid);
  }
};

const openNewFile = async (groupUuid?: string) => {
  const path = prompt('请输入文件路径:');
  if (path) {
    try {
      await openFile({
        path,
        title: path.split('/').pop() || 'Untitled',
        content: '',
      });
    } catch (error) {
      console.error('打开文件失败:', error);
    }
  }
};

const onContentChange = (groupUuid: string) => {
  const activeTab = getActiveTab(groupUuid);
  if (activeTab && activeTab.setDirty) {
    activeTab.setDirty(true);
  }
};

// 拖拽相关
const startTabDrag = (tabUuid: string) => {
  setDragState(tabUuid);
};

const onTabDragStart = (event: DragEvent, tabUuid: string) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', tabUuid);
    event.dataTransfer.effectAllowed = 'move';
  }
};

const onTabDragEnd = () => {
  setDragState();
};

const isDropTarget = (groupUuid: string) => {
  return ui.value.draggedTabId && isActiveGroup(groupUuid);
};

const handleDrop = (event: DragEvent, groupUuid: string) => {
  event.preventDefault();
  const tabUuid = event.dataTransfer?.getData('text/plain');
  if (tabUuid) {
    // 这里处理标签页移动逻辑
    console.log(`移动标签页 ${tabUuid} 到组 ${groupUuid}`);
  }
  setDragState();
};

// 生命周期
onMounted(async () => {
  await initialize();
});

// 导入 storeToRefs
import { storeToRefs } from 'pinia';
</script>

<style scoped>
.editor-session-manager {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1e1e1e;
  color: #d4d4d4;
}

/* 会话选择器 */
.session-selector {
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  padding: 0;
}

.session-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
}

.session-tab {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: #3c3c3c;
  cursor: pointer;
  transition: background-color 0.2s;
}

.session-tab:hover {
  background: #4c4c4c;
}

.session-tab.active {
  background: #1e1e1e;
  border-bottom: 2px solid #007acc;
}

.session-name {
  font-size: 13px;
}

.close-btn {
  margin-left: 8px;
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.close-btn:hover {
  background: #e81123;
  color: white;
}

.add-session-btn {
  padding: 8px 16px;
  background: #0e639c;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.add-session-btn:hover {
  background: #1177bb;
}

/* 编辑器内容 */
.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-groups {
  display: flex;
  width: 100%;
}

.editor-group {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #3e3e42;
  min-width: 200px;
}

.editor-group.active {
  background: #1e1e1e;
}

.editor-group.resizing {
  pointer-events: none;
}

.editor-group.drop-target {
  background: #264f78;
}

/* 标签页栏 */
.tab-bar {
  display: flex;
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  min-height: 35px;
}

.tab {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #2d2d30;
  border-right: 1px solid #3e3e42;
  cursor: pointer;
  min-width: 120px;
  max-width: 200px;
  position: relative;
}

.tab:hover {
  background: #3c3c3c;
}

.tab.active {
  background: #1e1e1e;
  border-bottom: 2px solid #007acc;
}

.tab.dirty .tab-title::after {
  content: '●';
  margin-left: 4px;
  color: #f0f0f0;
}

.tab.preview {
  font-style: italic;
}

.tab.dragging {
  opacity: 0.5;
}

.tab-icon {
  margin-right: 6px;
  font-size: 12px;
}

.tab-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
}

.dirty-indicator {
  color: #f0f0f0;
  margin-left: 4px;
}

.tab-close-btn {
  margin-left: 6px;
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  opacity: 0;
  transition: opacity 0.2s;
}

.tab:hover .tab-close-btn {
  opacity: 1;
}

.tab-close-btn:hover {
  background: #e81123;
  color: white;
}

.add-tab-btn {
  padding: 8px 12px;
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  font-size: 16px;
}

.add-tab-btn:hover {
  background: #3c3c3c;
}

/* 编辑器区域 */
.editor-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.file-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.file-header {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  font-size: 12px;
}

.file-path {
  flex: 1;
  color: #cccccc;
}

.unsaved-changes {
  color: #f0f0f0;
  margin-left: 8px;
}

.simple-editor {
  flex: 1;
  background: #1e1e1e;
  color: #d4d4d4;
  border: none;
  outline: none;
  padding: 16px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
}

.empty-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6c6c6c;
}

.empty-editor button {
  margin-top: 16px;
  padding: 8px 16px;
  background: #0e639c;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 4px;
}

.empty-editor button:hover {
  background: #1177bb;
}

/* 状态栏 */
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 16px;
  background: #007acc;
  color: white;
  font-size: 12px;
  min-height: 22px;
}

.status-left {
  display: flex;
  gap: 16px;
}

.unsaved-warning {
  color: #ffcc00;
  font-weight: bold;
}

.error {
  color: #f14c4c;
}

/* 通知 */
.notifications {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1000;
}

.notification {
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 4px;
  cursor: pointer;
  min-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification.info {
  background: #0e639c;
  color: white;
}

.notification.success {
  background: #107c10;
  color: white;
}

.notification.warning {
  background: #ff8c00;
  color: white;
}

.notification.error {
  background: #e81123;
  color: white;
}
</style>
