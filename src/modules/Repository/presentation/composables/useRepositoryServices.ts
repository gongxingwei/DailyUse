import { getRepositoryApplicationService } from "../../application/services/repositoryApplicationService";
// types
import type { Repository } from "../../domain/aggregates/repository";
// composables
import { useSnackbar } from "@/shared/composables/useSnackbar";

/**
 * useRepositoryServices
 * 
 * 该组合式函数封装了所有与仓库相关的业务操作（增删改查等），
 * 并统一处理消息提示（snackbar），为表现层提供简洁的调用接口。
 * 
 * 主要职责：
 * - 调用应用服务（repositoryService）完成业务操作
 * - 统一处理操作结果和异常
 * - 通过 snackbar 反馈操作结果
 */
export function useRepositoryServices() {
  // 获取领域应用服务实例
  const repositoryService = getRepositoryApplicationService();
  // 获取全局 snackbar 相关方法
  const { snackbar, showError, showSuccess } = useSnackbar();

  /**
   * 创建仓库
   * @param repository - 新建的仓库实例
   */
  const handleCreateRepository = async (repository: Repository) => {
    try {
      await repositoryService.addRepository(repository);
      showSuccess(`仓库创建成功：${repository.name}`);
    } catch (error: any) {
      showError(`创建仓库失败：${error.message || error}`);
      console.error("Error creating repository:", error);
    }
  };

  /**
   * 更新仓库
   * @param repo - 要更新的仓库实例
   */
  const handleUpdateRepository = async (repo: Repository) => {
    try {
      await repositoryService.updateRepository(repo);
      showSuccess(`仓库更新成功：${repo.name}`);
    } catch (error: any) {
      showError(`更新仓库失败：${error.message || error}`);
      console.error("Error updating repository:", error);
    }
  };

  /**
   * 删除仓库
   * @param repoId - 要删除的仓库 id
   */
  const handleDeleteRepository = async (repoId: string) => {
    try {
      await repositoryService.removeRepository(repoId);
      showSuccess(`仓库已删除：${repoId}`);
    } catch (error: any) {
      showError(`删除仓库失败：${error.message || error}`);
      console.error("Error deleting repository:", error);
    }
  };

  /**
   * 获取仓库详情
   * @param repoId - 仓库 id
   */
  const handleGetRepositoryById = async (repoId: string): Promise<Repository | null> => {
    try {
      return await repositoryService.getRepositoryById(repoId);
    } catch (error: any) {
      showError(`获取仓库详情失败：${error.message || error}`);
      console.error("Error getting repository:", error);
      return null;
    }
  };

  // 导出所有业务操作和 snackbar
  return {
    snackbar,
    handleCreateRepository,
    handleUpdateRepository,
    handleDeleteRepository,
    handleGetRepositoryById,
  };
}