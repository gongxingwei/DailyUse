/**
 * useEditorWorkspace Composable
 * 提供 EditorWorkspace 相关的响应式状态和操作方法
 */

import { ref, computed, type Ref } from 'vue';
import type { EditorContracts } from '@dailyuse/contracts';
import { editorWorkspaceApplicationService } from '../../application/EditorWorkspaceApplicationService';

// 类型别名
type WorkspaceClientDTO = EditorContracts.EditorWorkspaceClientDTO;
type SessionClientDTO = EditorContracts.EditorSessionClientDTO;
type CreateWorkspaceRequest = EditorContracts.CreateEditorWorkspaceRequest;
type UpdateWorkspaceRequest = EditorContracts.UpdateEditorWorkspaceRequest;
type CreateSessionRequest = EditorContracts.CreateEditorSessionRequest;

/**
 * EditorWorkspace Composable
 */
export function useEditorWorkspace() {
  // ========== 状态 ==========
  const workspaces: Ref<WorkspaceClientDTO[]> = ref([]);
  const currentWorkspace: Ref<WorkspaceClientDTO | null> = ref(null);
  const currentSessions: Ref<SessionClientDTO[]> = ref([]);
  const loading: Ref<boolean> = ref(false);
  const error: Ref<Error | null> = ref(null);

  // ========== 计算属性 ==========
  const activeWorkspaces = computed(() => workspaces.value.filter((w) => w.isActive));
  const inactiveWorkspaces = computed(() => workspaces.value.filter((w) => !w.isActive));
  const hasWorkspaces = computed(() => workspaces.value.length > 0);
  const currentWorkspaceName = computed(() => currentWorkspace.value?.name || '');

  // ========== Workspace 操作 ==========

  /**
   * 创建工作区
   */
  async function createWorkspace(data: CreateWorkspaceRequest): Promise<WorkspaceClientDTO | null> {
    loading.value = true;
    error.value = null;

    try {
      const workspace = await editorWorkspaceApplicationService.createWorkspace(data);
      workspaces.value.push(workspace);
      return workspace;
    } catch (err) {
      error.value = err as Error;
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取工作区详情
   */
  async function fetchWorkspace(uuid: string): Promise<WorkspaceClientDTO | null> {
    loading.value = true;
    error.value = null;

    try {
      const workspace = await editorWorkspaceApplicationService.getWorkspace(uuid);
      currentWorkspace.value = workspace;
      return workspace;
    } catch (err) {
      error.value = err as Error;
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 列出账户的所有工作区
   */
  async function fetchWorkspaces(accountUuid: string): Promise<WorkspaceClientDTO[]> {
    loading.value = true;
    error.value = null;

    try {
      const list = await editorWorkspaceApplicationService.listWorkspaces(accountUuid);
      workspaces.value = list;
      return list;
    } catch (err) {
      error.value = err as Error;
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * 更新工作区
   */
  async function updateWorkspace(
    uuid: string,
    data: UpdateWorkspaceRequest,
  ): Promise<WorkspaceClientDTO | null> {
    loading.value = true;
    error.value = null;

    try {
      const workspace = await editorWorkspaceApplicationService.updateWorkspace(uuid, data);

      // 更新列表中的工作区
      const index = workspaces.value.findIndex((w) => w.uuid === uuid);
      if (index !== -1) {
        workspaces.value[index] = workspace;
      }

      // 更新当前工作区
      if (currentWorkspace.value?.uuid === uuid) {
        currentWorkspace.value = workspace;
      }

      return workspace;
    } catch (err) {
      error.value = err as Error;
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 删除工作区
   */
  async function deleteWorkspace(uuid: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      await editorWorkspaceApplicationService.deleteWorkspace(uuid);

      // 从列表中移除
      workspaces.value = workspaces.value.filter((w) => w.uuid !== uuid);

      // 清除当前工作区
      if (currentWorkspace.value?.uuid === uuid) {
        currentWorkspace.value = null;
      }

      return true;
    } catch (err) {
      error.value = err as Error;
      return false;
    } finally {
      loading.value = false;
    }
  }

  // ========== Session 操作 ==========

  /**
   * 添加会话到工作区
   */
  async function addSession(
    workspaceUuid: string,
    data: CreateSessionRequest,
  ): Promise<SessionClientDTO | null> {
    loading.value = true;
    error.value = null;

    try {
      const session = await editorWorkspaceApplicationService.addSession(workspaceUuid, data);
      currentSessions.value.push(session);
      return session;
    } catch (err) {
      error.value = err as Error;
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取工作区的所有会话
   */
  async function fetchSessions(workspaceUuid: string): Promise<SessionClientDTO[]> {
    loading.value = true;
    error.value = null;

    try {
      const sessions = await editorWorkspaceApplicationService.getSessions(workspaceUuid);
      currentSessions.value = sessions;
      return sessions;
    } catch (err) {
      error.value = err as Error;
      return [];
    } finally {
      loading.value = false;
    }
  }

  // ========== 辅助方法 ==========

  /**
   * 清除错误
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * 重置状态
   */
  function reset(): void {
    workspaces.value = [];
    currentWorkspace.value = null;
    currentSessions.value = [];
    loading.value = false;
    error.value = null;
  }

  /**
   * 设置当前工作区（不调用API）
   */
  function setCurrentWorkspace(workspace: WorkspaceClientDTO | null): void {
    currentWorkspace.value = workspace;
  }

  // ========== 返回 ==========
  return {
    // 状态
    workspaces,
    currentWorkspace,
    currentSessions,
    loading,
    error,

    // 计算属性
    activeWorkspaces,
    inactiveWorkspaces,
    hasWorkspaces,
    currentWorkspaceName,

    // Workspace 操作
    createWorkspace,
    fetchWorkspace,
    fetchWorkspaces,
    updateWorkspace,
    deleteWorkspace,

    // Session 操作
    addSession,
    fetchSessions,

    // 辅助方法
    clearError,
    reset,
    setCurrentWorkspace,
  };
}
