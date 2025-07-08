import { defineStore } from "pinia";
import type { IGoal, IRecord, IGoalDir } from "../../domain/types/goal";
import { Goal } from "../../domain/entities/goal";
import { GoalDir } from "../../domain/entities/goalDir";

/**
 * 系统默认文件夹配置
 */
const SYSTEM_GOAL_DIRS = {
  ALL: 'system_all',
  DELETED: 'system_deleted', 
  ARCHIVED: 'system_archived'
} as const;

/**
 * 创建系统默认文件夹
 */
function createSystemGoalDirs(): IGoalDir[] {
  const now = new Date();
  const timestamp = {
    date: {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate()
    },
    timestamp: now.getTime(),
    isoString: now.toISOString()
  };

  return [
    {
      id: SYSTEM_GOAL_DIRS.ALL,
      name: '全部',
      icon: 'mdi-view-dashboard',
      lifecycle: {
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'active'
      }
    },
    {
      id: SYSTEM_GOAL_DIRS.DELETED,
      name: '已删除',
      icon: 'mdi-delete',
      lifecycle: {
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'active'
      }
    },
    {
      id: SYSTEM_GOAL_DIRS.ARCHIVED,
      name: '已归档',
      icon: 'mdi-archive',
      lifecycle: {
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'active'
      }
    }
  ];
}

/**
 * 目标状态接口
 */
interface GoalState {
  goals: IGoal[];
  goalDirs: IGoalDir[];
  // 临时目录编辑状态
  tempGoalDir: IGoalDir | null;
}

/**
 * 精简的目标 Pinia Store - 纯状态管理版本
 */
export const useGoalStore = defineStore("goal", {
  state: () =>
    ({
      goals: [] as IGoal[],
      goalDirs: createSystemGoalDirs(),
      tempGoalDir: null as IGoalDir | null,
    } as GoalState),

  getters: {
    // ========== 目标查询 ==========
    
    /**
     * 获取所有目标
     */
    getAllGoals(): IGoal[] {
      return this.goals;
    },

    /**
     * 获取所有目标作为领域对象
     */
    getAllGoalEntities(): Goal[] {
      return this.goals.map(goal => Goal.fromDTO(goal));
    },

    /**
     * 根据ID获取目标
     */
    getGoalById: (state) => (id: string) => {
      return state.goals.find((g) => g.id === id);
    },

    /**
     * 根据ID获取目标领域对象
     */
    getGoalEntityById: (state) => (id: string) => {
      const goal = state.goals.find((g) => g.id === id);
      return goal ? Goal.fromDTO(goal) : null;
    },

    /**
     * 根据目录ID获取目标
     */
    getGoalsByDirId: (state) => (dirId: string) => {
      if (dirId === SYSTEM_GOAL_DIRS.ALL || dirId === "all") {
        // "全部" 文件夹显示所有活跃和完成的目标，排除已归档的
        return state.goals.filter((g) => 
          g.lifecycle.status === "active" || 
          g.lifecycle.status === "completed" || 
          g.lifecycle.status === "paused"
        );
      }
      
      if (dirId === SYSTEM_GOAL_DIRS.ARCHIVED) {
        // "已归档" 文件夹只显示已归档的目标
        return state.goals.filter((g) => g.lifecycle.status === "archived");
      }
      
      if (dirId === SYSTEM_GOAL_DIRS.DELETED) {
        // "已删除" 文件夹 - 预留功能，当前返回空数组
        // 当类型支持 'deleted' 状态时，可以返回已删除的目标
        return [];
      }
      
      // 用户自定义文件夹，显示该文件夹下的非归档目标
      return state.goals.filter((g) => 
        g.dirId === dirId && 
        g.lifecycle.status !== "archived"
      );
    },

    /**
     * 获取活跃目标
     */
    getActiveGoals: (state) => {
      return state.goals.filter((g) => g.lifecycle.status === "active");
    },

    /**
     * 获取进行中的目标（活跃且未完成）
     */
    getInProgressGoals: (state) => {
      return state.goals.filter((g) => 
        g.lifecycle.status === "active" || g.lifecycle.status === "paused"
      );
    },

    /**
     * 获取今天的记录数量
     */
    getTodayRecordCount: (state) => {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1; // 23:59:59.999

      let todayRecordCount = 0;
      for (const goal of state.goals) {
        for (const record of goal.records) {
          if (record.date.timestamp >= todayStart && record.date.timestamp <= todayEnd) {
            todayRecordCount++;
          }
        }
      }
      return todayRecordCount;
    },

    // ========== 记录查询（通过目标获取）==========
    
    /**
     * 获取所有记录
     */
    getAllRecords(): IRecord[] {
      return this.goals.flatMap(g => g.records);
    },

    /**
     * 根据目标ID获取记录
     */
    getRecordsByGoalId: (state) => (goalId: string) => {
      const goal = state.goals.find(g => g.id === goalId);
      return goal?.records || [];
    },

    /**
     * 根据关键结果ID获取记录
     */
    getRecordsByKeyResultId: (state) => (keyResultId: string) => {
      return state.goals
        .flatMap(g => g.records)
        .filter(r => r.keyResultId === keyResultId);
    },

    // ========== 目标目录查询 ==========
    
    /**
     * 获取所有目标目录（按显示规则排序）
     * - "全部" 文件夹始终显示在最上方
     * - 用户自定义文件夹显示在中间
     * - "已删除" 和 "已归档" 文件夹在有数据时显示在最下方
     */
    getAllGoalDirs(): IGoalDir[] {
      const systemDirs = this.goalDirs.filter(dir => 
        dir.id === SYSTEM_GOAL_DIRS.ALL ||
        dir.id === SYSTEM_GOAL_DIRS.DELETED ||
        dir.id === SYSTEM_GOAL_DIRS.ARCHIVED
      );
      
      const userDirs = this.goalDirs.filter(dir => 
        dir.id !== SYSTEM_GOAL_DIRS.ALL &&
        dir.id !== SYSTEM_GOAL_DIRS.DELETED &&
        dir.id !== SYSTEM_GOAL_DIRS.ARCHIVED
      );

      // 检查是否有已归档的目标
      // 注意：根据类型定义，目标状态包括 "active" | "completed" | "paused" | "archived"
      // 暂时没有 "deleted" 状态，可能需要在未来扩展
      const hasArchivedGoals = this.goals.some(goal => goal.lifecycle.status === 'archived');
      // 预留：检查已删除目标的逻辑，当类型支持时可以启用
      // const hasDeletedGoals = this.goals.some(goal => goal.lifecycle.status === 'deleted');

      const result: IGoalDir[] = [];
      
      // 1. 添加 "全部" 文件夹（始终显示在最上方）
      const allDir = systemDirs.find(dir => dir.id === SYSTEM_GOAL_DIRS.ALL);
      if (allDir) {
        result.push(allDir);
      }
      
      // 2. 添加用户自定义文件夹（按名称排序）
      result.push(...userDirs.sort((a, b) => a.name.localeCompare(b.name)));
      
      // 3. 添加系统文件夹（仅在有数据时显示，显示在最下方）
      if (hasArchivedGoals) {
        const archivedDir = systemDirs.find(dir => dir.id === SYSTEM_GOAL_DIRS.ARCHIVED);
        if (archivedDir) {
          result.push(archivedDir);
        }
      }
      
      // 预留：当支持删除状态时启用
      // if (hasDeletedGoals) {
      //   const deletedDir = systemDirs.find(dir => dir.id === SYSTEM_GOAL_DIRS.DELETED);
      //   if (deletedDir) {
      //     result.push(deletedDir);
      //   }
      // }
      
      return result;
    },

    /**
     * 获取所有目标目录作为领域对象
     */
    getAllGoalDirEntities(): GoalDir[] {
      return this.goalDirs.map(dir => GoalDir.fromDTO(dir));
    },

    /**
     * 根据ID获取目标目录
     */
    getGoalDirById: (state) => (id: string) => {
      return state.goalDirs.find((d) => d.id === id);
    },

    /**
     * 根据ID获取目标目录领域对象
     */
    getGoalDirEntityById: (state) => (id: string) => {
      const dir = state.goalDirs.find((d) => d.id === id);
      return dir ? GoalDir.fromDTO(dir) : null;
    },

    // ========== 系统文件夹相关 ==========
    
    /**
     * 判断是否为系统文件夹
     */
    isSystemGoalDir: () => (dirId: string) => {
      return dirId === SYSTEM_GOAL_DIRS.ALL ||
             dirId === SYSTEM_GOAL_DIRS.DELETED ||
             dirId === SYSTEM_GOAL_DIRS.ARCHIVED;
    },

    /**
     * 获取系统文件夹列表
     */
    getSystemGoalDirs(): IGoalDir[] {
      return this.goalDirs.filter(dir => 
        dir.id === SYSTEM_GOAL_DIRS.ALL ||
        dir.id === SYSTEM_GOAL_DIRS.DELETED ||
        dir.id === SYSTEM_GOAL_DIRS.ARCHIVED
      );
    },

    /**
     * 获取用户自定义文件夹列表
     */
    getUserGoalDirs(): IGoalDir[] {
      return this.goalDirs.filter(dir => 
        dir.id !== SYSTEM_GOAL_DIRS.ALL &&
        dir.id !== SYSTEM_GOAL_DIRS.DELETED &&
        dir.id !== SYSTEM_GOAL_DIRS.ARCHIVED
      );
    },
  },

  actions: {
    // ========== 状态同步方法（用于仓库接口实现）==========
    
    /**
     * 添加目标到状态
     */
    async addGoal(goal: IGoal): Promise<void> {
      const existingIndex = this.goals.findIndex(g => g.id === goal.id);
      if (existingIndex >= 0) {
        this.goals[existingIndex] = goal;
      } else {
        this.goals.push(goal);
      }
    },

    /**
     * 更新目标状态
     */
    async updateGoal(goal: IGoal): Promise<void> {
      const index = this.goals.findIndex(g => g.id === goal.id);
      if (index >= 0) {
        this.goals[index] = goal;
      }
    },

    /**
     * 移除目标状态
     */
    async removeGoal(goalId: string): Promise<void> {
      const index = this.goals.findIndex(g => g.id === goalId);
      if (index >= 0) {
        this.goals.splice(index, 1);
      }
    },

    /**
     * 设置所有目标
     */
    async setGoals(goals: IGoal[]): Promise<void> {
      this.goals = goals;
    },

    /**
     * 清空所有目标
     */
    async clearAllGoals(): Promise<void> {
      this.goals = [];
    },

    // ========== 记录状态管理 ==========
    
    /** 
     * 添加记录（通过更新目标实现）
     */
    async addRecord(record: IRecord): Promise<void> {
      const goalIndex = this.goals.findIndex(g => g.id === record.goalId);
      if (goalIndex >= 0) {
        const goal = this.goals[goalIndex];
        const recordExists = goal.records.some(r => r.id === record.id);
        if (!recordExists) {
          goal.records.push(record);
        }
      }
    },

    /**
     * 更新记录（通过更新目标实现）
     */
    async updateRecord(record: IRecord): Promise<void> {
      const goalIndex = this.goals.findIndex(g => g.id === record.goalId);
      if (goalIndex >= 0) {
        const goal = this.goals[goalIndex];
        const recordIndex = goal.records.findIndex(r => r.id === record.id);
        if (recordIndex >= 0) {
          goal.records[recordIndex] = record;
        }
      }
    },

    /**
     * 移除记录
     */
    async removeRecord(recordId: string): Promise<void> {
      for (const goal of this.goals) {
        const recordIndex = goal.records.findIndex(r => r.id === recordId);
        if (recordIndex >= 0) {
          goal.records.splice(recordIndex, 1);
          break;
        }
      }
    },

    /**
     * 设置所有记录
     */
    async setRecords(records: IRecord[]): Promise<void> {
      // 清空所有目标的记录
      for (const goal of this.goals) {
        goal.records = [];
      }
      
      // 重新分配记录到对应目标
      for (const record of records) {
        await this.addRecord(record);
      }
    },

    /**
     * 根据目标ID移除记录
     */
    async removeRecordsByGoalId(goalId: string): Promise<void> {
      const goalIndex = this.goals.findIndex(g => g.id === goalId);
      if (goalIndex >= 0) {
        this.goals[goalIndex].records = [];
      }
    },

    /**
     * 根据关键结果ID移除记录
     */
    async removeRecordsByKeyResultId(keyResultId: string): Promise<void> {
      for (const goal of this.goals) {
        goal.records = goal.records.filter(r => r.keyResultId !== keyResultId);
      }
    },

    /**
     * 清空所有记录
     */
    async clearAllRecords(): Promise<void> {
      for (const goal of this.goals) {
        goal.records = [];
      }
    },

    // ========== 目标目录状态管理 ==========
    
    /**
     * 添加目标目录
     */
    async addGoalDir(goalDir: IGoalDir): Promise<void> {
      const existingIndex = this.goalDirs.findIndex(d => d.id === goalDir.id);
      if (existingIndex >= 0) {
        this.goalDirs[existingIndex] = goalDir;
      } else {
        this.goalDirs.push(goalDir);
      }
    },

    /**
     * 更新目标目录
     */
    async updateGoalDir(goalDir: IGoalDir): Promise<void> {
      const index = this.goalDirs.findIndex(d => d.id === goalDir.id);
      if (index >= 0) {
        this.goalDirs[index] = goalDir;
      }
    },

    /**
     * 移除目标目录（不能删除系统文件夹）
     */
    async removeGoalDir(goalDirId: string): Promise<void> {
      // 防止删除系统文件夹
      if (goalDirId === SYSTEM_GOAL_DIRS.ALL ||
          goalDirId === SYSTEM_GOAL_DIRS.DELETED ||
          goalDirId === SYSTEM_GOAL_DIRS.ARCHIVED) {
        console.warn(`不能删除系统文件夹: ${goalDirId}`);
        return;
      }
      
      const index = this.goalDirs.findIndex(d => d.id === goalDirId);
      if (index >= 0) {
        this.goalDirs.splice(index, 1);
      }
    },

    /**
     * 设置所有目标目录（保留系统文件夹）
     */
    async setGoalDirs(goalDirs: IGoalDir[]): Promise<void> {
      // 保留系统文件夹
      const systemDirs = this.goalDirs.filter(dir => 
        dir.id === SYSTEM_GOAL_DIRS.ALL ||
        dir.id === SYSTEM_GOAL_DIRS.DELETED ||
        dir.id === SYSTEM_GOAL_DIRS.ARCHIVED
      );
      
      // 过滤掉传入数据中的系统文件夹，避免重复
      const userDirs = goalDirs.filter(dir => 
        dir.id !== SYSTEM_GOAL_DIRS.ALL &&
        dir.id !== SYSTEM_GOAL_DIRS.DELETED &&
        dir.id !== SYSTEM_GOAL_DIRS.ARCHIVED
      );
      
      // 合并系统文件夹和用户文件夹
      this.goalDirs = [...systemDirs, ...userDirs];
    },

    /**
     * 清空所有目标目录（保留系统文件夹）
     */
    async clearAllGoalDirs(): Promise<void> {
      // 只保留系统文件夹
      this.goalDirs = this.goalDirs.filter(dir => 
        dir.id === SYSTEM_GOAL_DIRS.ALL ||
        dir.id === SYSTEM_GOAL_DIRS.DELETED ||
        dir.id === SYSTEM_GOAL_DIRS.ARCHIVED
      );
    },

    // ========== 临时目录编辑管理 ==========
    
    /**
     * 初始化新的临时目录
     */
    initTempDir(): IGoalDir {
      const now = new Date();
      const tempDir: IGoalDir = {
        id: "", // 新目录暂时无ID
        name: "",
        icon: "mdi-folder",
        parentId: undefined, // 明确设置为 undefined，表示没有父目录
        lifecycle: {
          createdAt: {
            date: {
              year: now.getFullYear(),
              month: now.getMonth() + 1,
              day: now.getDate()
            },
            timestamp: now.getTime(),
            isoString: now.toISOString()
          },
          updatedAt: {
            date: {
              year: now.getFullYear(),
              month: now.getMonth() + 1,
              day: now.getDate()
            },
            timestamp: now.getTime(),
            isoString: now.toISOString()
          },
          status: "active"
        }
      };
      this.tempGoalDir = tempDir;
      return tempDir;
    },

    /**
     * 根据目录ID初始化临时目录（编辑模式）
     */
    initTempDirByDirId(dirId: string): IGoalDir | null {
      const existingDir = this.goalDirs.find(d => d.id === dirId);
      if (existingDir) {
        const now = new Date();
        // 创建深拷贝作为临时目录
        this.tempGoalDir = {
          ...existingDir,
          lifecycle: {
            ...existingDir.lifecycle,
            updatedAt: {
              date: {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                day: now.getDate()
              },
              timestamp: now.getTime(),
              isoString: now.toISOString()
            }
          }
        };
        return this.tempGoalDir;
      }
      return null;
    },

    /**
     * 保存临时目录
     * 注意：这里只是更新本地状态，实际保存需要通过应用服务
     */
    saveTempDir(): IGoalDir | null {
      if (!this.tempGoalDir) {
        return null;
      }

      const tempDir = { ...this.tempGoalDir };
      
      if (tempDir.id) {
        // 更新现有目录
        const index = this.goalDirs.findIndex(d => d.id === tempDir.id);
        if (index >= 0) {
          this.goalDirs[index] = tempDir;
        }
      } else {
        // 新增目录 - 需要通过应用服务分配ID
        // 这里只是临时处理，实际需要通过应用服务
        tempDir.id = `temp_${Date.now()}`;
        this.goalDirs.push(tempDir);
      }
      
      this.tempGoalDir = null;
      return tempDir;
    },

    /**
     * 取消临时目录编辑
     */
    cancelTempDir(): void {
      this.tempGoalDir = null;
    },

    /**
     * 获取临时目录
     */
    getTempGoalDir(): IGoalDir | null {
      return this.tempGoalDir;
    },

    // ========== 批量同步 ==========
    
    /**
     * 同步所有目标数据（保持系统文件夹）
     */
    async syncAllGoalData(data: {
      goals: IGoal[];
      records: IRecord[];
      goalDirs: IGoalDir[];
    }): Promise<void> {
      this.goals = data.goals;
      
      // 保留系统文件夹，只同步用户文件夹
      const systemDirs = this.goalDirs.filter(dir => 
        dir.id === SYSTEM_GOAL_DIRS.ALL ||
        dir.id === SYSTEM_GOAL_DIRS.DELETED ||
        dir.id === SYSTEM_GOAL_DIRS.ARCHIVED
      );
      
      const userDirs = data.goalDirs.filter(dir => 
        dir.id !== SYSTEM_GOAL_DIRS.ALL &&
        dir.id !== SYSTEM_GOAL_DIRS.DELETED &&
        dir.id !== SYSTEM_GOAL_DIRS.ARCHIVED
      );
      
      this.goalDirs = [...systemDirs, ...userDirs];
      // records 已经包含在 goals 中，无需单独处理
    },

    // ========== 领域对象业务方法 ==========
    
    /**
     * 使用领域对象更新目标
     */
    async updateGoalWithEntity(goalEntity: Goal): Promise<void> {
      const goalData = goalEntity.toDTO();
      await this.updateGoal(goalData);
    },

    /**
     * 使用领域对象更新目录
     */
    async updateGoalDirWithEntity(goalDirEntity: GoalDir): Promise<void> {
      const goalDirData = goalDirEntity.toDTO();
      await this.updateGoalDir(goalDirData);
    },
  },
});
