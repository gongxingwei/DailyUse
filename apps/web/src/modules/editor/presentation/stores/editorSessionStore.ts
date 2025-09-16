import { defineStore } from 'pinia';
import { EditorSession, EditorGroup, EditorTab } from '@dailyuse/domain-client';
import type { EditorContracts } from '@dailyuse/contracts';

// 简化的 store 实现
export const useEditorSessionStore = defineStore('editorSession', {
  state: () => ({
    sessions: [] as any[],
    currentSessionUuid: null as string | null,
    isLoading: false,
    isInitialized: false,
    error: null as string | null,
    ui: {
      draggedTabId: undefined as string | undefined,
      draggedGroupId: undefined as string | undefined,
      isResizing: false,
      notifications: [] as Array<{
        id: string;
        type: 'info' | 'warning' | 'error' | 'success';
        message: string;
        timestamp: Date;
      }>,
    },
  }),

  getters: {
    currentSession(): any {
      if (!this.currentSessionUuid) return null;
      return this.sessions.find((s) => s.uuid === this.currentSessionUuid) || null;
    },

    sessionStats(): { totalSessions: number; totalGroups: number; totalTabs: number } {
      return {
        totalSessions: this.sessions.length,
        totalGroups: 0,
        totalTabs: 0,
      };
    },

    hasUnsavedChanges(): boolean {
      return false; // 简化实现
    },

    notificationCount(): number {
      return this.ui.notifications.length;
    },

    isDragging(): boolean {
      return !!this.ui.draggedTabId || !!this.ui.draggedGroupId;
    },
  },

  actions: {
    async initialize(): Promise<void> {
      if (this.isInitialized) return;

      this.isLoading = true;
      this.error = null;

      try {
        await this.createDefaultSession();
        this.isInitialized = true;
        this.addNotification('success', '编辑器初始化成功');
      } catch (error) {
        this.error = error instanceof Error ? error.message : '初始化失败';
        this.addNotification('error', this.error);
      } finally {
        this.isLoading = false;
      }
    },

    async createDefaultSession(): Promise<string> {
      try {
        const sessionDto = {
          uuid: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          accountUuid: 'current-user',
          name: '默认会话',
          activeGroupId: null,
          layoutUuid: null,
          autoSave: true,
          autoSaveInterval: 30,
          lastSavedAt: undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const session = new EditorSession(sessionDto);

        // 创建默认编辑器组
        const defaultGroup = session.createGroup({
          width: 800,
          height: 600,
          title: '主编辑器',
          order: 0,
        });

        this.sessions.push(session);
        this.currentSessionUuid = session.uuid;

        return session.uuid;
      } catch (error) {
        console.error('Failed to create default session:', error);
        throw error;
      }
    },

    async createSession(params: { name: string; accountUuid?: string }): Promise<string> {
      try {
        const sessionDto = {
          uuid: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          accountUuid: params.accountUuid || 'current-user',
          name: params.name,
          activeGroupId: null,
          layoutUuid: null,
          autoSave: true,
          autoSaveInterval: 30,
          lastSavedAt: undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const session = new EditorSession(sessionDto);

        this.sessions.push(session);
        this.addNotification('success', `创建会话: ${params.name}`);

        return session.uuid;
      } catch (error) {
        this.addNotification('error', '创建会话失败');
        throw error;
      }
    },

    async switchToSession(sessionUuid: string): Promise<void> {
      const session = this.sessions.find((s) => s.uuid === sessionUuid);
      if (!session) {
        throw new Error(`会话不存在: ${sessionUuid}`);
      }

      this.currentSessionUuid = sessionUuid;
      this.addNotification('info', `切换到会话: ${session.name}`);
    },

    async deleteSession(sessionUuid: string): Promise<void> {
      const index = this.sessions.findIndex((s) => s.uuid === sessionUuid);
      if (index === -1) {
        throw new Error(`会话不存在: ${sessionUuid}`);
      }

      const session = this.sessions[index];
      this.sessions.splice(index, 1);

      if (this.currentSessionUuid === sessionUuid) {
        if (this.sessions.length > 0) {
          await this.switchToSession(this.sessions[0].uuid);
        } else {
          await this.createDefaultSession();
        }
      }

      this.addNotification('info', `删除会话: ${session.name}`);
    },

    async openFile(params: {
      path: string;
      title?: string;
      content?: string;
      fileType?: EditorContracts.SupportedFileType;
    }): Promise<string> {
      const session = this.currentSession;
      if (!session) {
        throw new Error('没有活动会话');
      }

      try {
        // 使用session的createTab方法
        const groups = (session as any)._groups || [];
        if (groups.length === 0) {
          throw new Error('没有可用的编辑器组');
        }

        const tab = session.createTab(groups[0].uuid, {
          title: params.title || params.path.split('/').pop() || 'Untitled',
          path: params.path,
          content: params.content,
          fileType: params.fileType,
          isPreview: false,
        });

        this.addNotification('success', `打开文件: ${tab.title}`);
        return tab.uuid;
      } catch (error) {
        this.addNotification('error', '打开文件失败');
        throw error;
      }
    },

    async closeTab(tabUuid: string): Promise<void> {
      const session = this.currentSession;
      if (!session) return;

      try {
        const groups = (session as any)._groups || [];
        let removed = false;

        for (const group of groups) {
          if (group.findTab && group.removeTab) {
            const tab = group.findTab(tabUuid);
            if (tab) {
              if (tab.isDirty) {
                const confirmed = confirm(`文件 "${tab.title}" 有未保存的更改，确定要关闭吗？`);
                if (!confirmed) return;
              }

              group.removeTab(tabUuid);
              this.addNotification('info', `关闭文件: ${tab.title}`);
              removed = true;
              break;
            }
          }
        }

        if (!removed) {
          this.addNotification('warning', '标签页不存在');
        }
      } catch (error) {
        this.addNotification('error', '关闭标签页失败');
        throw error;
      }
    },

    setDragState(draggedTabId?: string, draggedGroupId?: string): void {
      this.ui.draggedTabId = draggedTabId;
      this.ui.draggedGroupId = draggedGroupId;
    },

    setResizing(isResizing: boolean): void {
      this.ui.isResizing = isResizing;
    },

    addNotification(type: 'info' | 'warning' | 'error' | 'success', message: string): void {
      const notification = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        message,
        timestamp: new Date(),
      };

      this.ui.notifications.push(notification);

      if (type !== 'error') {
        setTimeout(() => {
          this.removeNotification(notification.id);
        }, 5000);
      }
    },

    removeNotification(notificationId: string): void {
      const index = this.ui.notifications.findIndex((n) => n.id === notificationId);
      if (index !== -1) {
        this.ui.notifications.splice(index, 1);
      }
    },

    cleanup(): void {
      this.sessions = [];
      this.currentSessionUuid = null;
      this.ui.notifications = [];
      this.isInitialized = false;
    },
  },
});

export default useEditorSessionStore;
