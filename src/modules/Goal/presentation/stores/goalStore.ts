import { defineStore } from "pinia";
import { Goal } from "../../domain/aggregates/goal";
import { GoalDir } from "../../domain/aggregates/goalDir";
import { Record } from "../../domain/entities/record";
import { SYSTEM_GOAL_DIRS } from "@common/modules/goal/types/goal";
/**
 * 精简的目标 Pinia Store - 纯状态管理版本
 */
export const useGoalStore = defineStore("goal", {
  state: () => ({
    goals: [] as Goal[],
    goalDirs: [] as GoalDir[],
  }),

  getters: {
    // ========== 目标查询 ==========

    /**
     * 获取所有目标
     */
    getAllGoals(): Goal[] {
      const goalsInState = this.goals;
      const goals: Goal[] = [];
      for (const goal of goalsInState) {
        const ensuredGoal = Goal.ensureGoal(goal);
        if (ensuredGoal) {
          goals.push(ensuredGoal);
        }
      }
      return goals.length > 0 ? goals : [];
    },

    getGoalByUuid:
      (state) =>
      (uuid: string): Goal | null => {
        const goal = state.goals.find((g) => g.uuid === uuid);
        return goal ? Goal.ensureGoal(goal) : null;
      },

    /**
     * 根据目录ID获取目标
     */
    getGoalsByDirUuid: (state) => (dirUuid: string) => {
      if (dirUuid === SYSTEM_GOAL_DIRS.ALL || dirUuid === "all") {
        // "全部" 文件夹显示所有活跃和完成的目标，排除已归档的
        return state.goals.filter(
          (g) =>
            g.lifecycle.status === "active" ||
            g.lifecycle.status === "completed" ||
            g.lifecycle.status === "paused"
        );
      }

      if (dirUuid === SYSTEM_GOAL_DIRS.ARCHIVED) {
        // "已归档" 文件夹只显示已归档的目标
        return state.goals.filter((g) => g.lifecycle.status === "archived");
      }

      if (dirUuid === SYSTEM_GOAL_DIRS.DELETED) {
        // "已删除" 文件夹 - 预留功能，当前返回空数组
        // 当类型支持 'deleted' 状态时，可以返回已删除的目标
        return [];
      }

      // 用户自定义文件夹，显示该文件夹下的非归档目标
      return state.goals.filter(
        (g) => g.dirUuid === dirUuid && g.lifecycle.status !== "archived"
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
      return state.goals.filter(
        (g) =>
          g.lifecycle.status === "active" || g.lifecycle.status === "paused"
      );
    },

    /**
     * 获取今天的记录数量
     */
    getTodayRecordCount: (state) => {
      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      ).getTime();
      const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1; // 23:59:59.999

      let todayRecordCount = 0;
      for (const goal of state.goals) {
        for (const record of goal.records) {
          if (
            record.lifecycle.createdAt.getTime() >= todayStart &&
            record.lifecycle.createdAt.getTime() <= todayEnd
          ) {
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
    getAllRecords(): Record[] | null {
      const records = this.goals.flatMap((g) => g.records);
      const ensuredRecords = records.map((record) =>
        Record.ensureRecordNeverNull(record)
      );
      return ensuredRecords.length > 0 ? ensuredRecords : null;
    },

    /**
     * 根据目标ID获取记录
     */
    getRecordsBygoalUuid: (state) => (goalUuid: string) => {
      const goal = state.goals.find((g) => g.uuid === goalUuid);
      return goal?.records || [];
    },

    /**
     * 根据关键结果ID获取记录
     */
    getRecordsByKeyResultId: (state) => (keyResultId: string) => {
      return state.goals
        .flatMap((g) => g.records)
        .filter((r) => r.keyResultUuid === keyResultId);
    },

    // ========== 目标目录查询 ==========

    /**
     * 获取所有目标目录（按显示规则排序）
     * - "全部" 文件夹始终显示在最上方
     * - 用户自定义文件夹显示在中间
     * - "已删除" 和 "已归档" 文件夹在有数据时显示在最下方
     */
    getAllGoalDirs(): GoalDir[] {
      const systemDirs = this.goalDirs.filter(
        (dir) =>
          dir.uuid === SYSTEM_GOAL_DIRS.ALL ||
          dir.uuid === SYSTEM_GOAL_DIRS.DELETED ||
          dir.uuid === SYSTEM_GOAL_DIRS.ARCHIVED
      );

      const userDirs = this.goalDirs.filter(
        (dir) =>
          dir.uuid !== SYSTEM_GOAL_DIRS.ALL &&
          dir.uuid !== SYSTEM_GOAL_DIRS.DELETED &&
          dir.uuid !== SYSTEM_GOAL_DIRS.ARCHIVED
      );

      // 检查是否有已归档的目标
      // 注意：根据类型定义，目标状态包括 "active" | "completed" | "paused" | "archived"
      // 暂时没有 "deleted" 状态，可能需要在未来扩展
      const hasArchivedGoals = this.goals.some(
        (goal) => goal.lifecycle.status === "archived"
      );
      // 预留：检查已删除目标的逻辑，当类型支持时可以启用
      // const hasDeletedGoals = this.goals.some(goal => goal.lifecycle.status === 'deleted');

      const result: GoalDir[] = [];

      // 1. 添加 "全部" 文件夹（始终显示在最上方）
      const allDir = systemDirs.find(
        (dir) => dir.uuid === SYSTEM_GOAL_DIRS.ALL
      );
      if (allDir) {
        result.push(GoalDir.ensureGoalDirNeverNull(allDir));
      }

      // 2. 添加用户自定义文件夹（按名称排序）
      result.push(
        ...userDirs
          .sort((a, b) => {
            const nameA = a.name || "";
            const nameB = b.name || "";
            return nameA.localeCompare(nameB);
          })
          .map((dir) => GoalDir.ensureGoalDirNeverNull(dir))
      );

      // 3. 添加系统文件夹（仅在有数据时显示，显示在最下方）
      if (hasArchivedGoals) {
        const archivedDir = systemDirs.find(
          (dir) => dir.uuid === SYSTEM_GOAL_DIRS.ARCHIVED
        );
        if (archivedDir) {
          result.push(GoalDir.ensureGoalDirNeverNull(archivedDir));
        }
      }

      // 预留：当支持删除状态时启用
      // if (hasDeletedGoals) {
      //   const deletedDir = systemDirs.find(dir => dir.uuid === SYSTEM_GOAL_DIRS.DELETED);
      //   if (deletedDir) {
      //     result.push(deletedDir);
      //   }
      // }

      return result;
    },

    /**
     * 根据ID获取目标目录
     */
    getGoalDirById: (state) => (uuid: string) => {
      return state.goalDirs.find((d) => d.uuid === uuid);
    },

    // ========== 系统文件夹相关 ==========

    /**
     * 判断是否为系统文件夹
     */
    isSystemGoalDir: () => (dirUuid: string) => {
      return (
        dirUuid === SYSTEM_GOAL_DIRS.ALL ||
        dirUuid === SYSTEM_GOAL_DIRS.DELETED ||
        dirUuid === SYSTEM_GOAL_DIRS.ARCHIVED
      );
    },

    /**
     * 获取系统文件夹列表
     */
    getSystemGoalDirs(): GoalDir[] {
      return this.goalDirs.filter(
        (dir) =>
          dir.uuid === SYSTEM_GOAL_DIRS.ALL ||
          dir.uuid === SYSTEM_GOAL_DIRS.DELETED ||
          dir.uuid === SYSTEM_GOAL_DIRS.ARCHIVED
      ).map((dir) =>
        GoalDir.ensureGoalDirNeverNull(dir)
      );
    },

    /**
     * 获取用户自定义文件夹列表
     */
    getUserGoalDirs(): GoalDir[] {
      return this.goalDirs.filter(
        (dir) =>
          dir.uuid !== SYSTEM_GOAL_DIRS.ALL &&
          dir.uuid !== SYSTEM_GOAL_DIRS.DELETED &&
          dir.uuid !== SYSTEM_GOAL_DIRS.ARCHIVED
      ).map((dir) =>
        GoalDir.ensureGoalDirNeverNull(dir)
        );
    },
  },

  actions: {
    async syncGoalState(goal: Goal): Promise<void> {
      try {
        console.log("[目标 Store] 同步目标状态:", goal);
        await this.$patch((state) => {
          const index = state.goals.findIndex((g) => g.uuid === goal.uuid);
          if (index !== -1) {
            state.goals[index] = goal;
          } else {
            state.goals.push(goal);
          }
        });
      } catch (error) {
        console.warn("⚠️ 同步目标状态失败:", error);
      }
    },
    async syncGoalsState(goals: Goal[]): Promise<void> {
      try {
        console.log("[目标 Store] 同步目标状态:", goals);
        await this.$patch((state) => {
          state.goals = goals;
        });
      } catch (error) {
        console.warn("⚠️ 同步目标状态失败:", error);
      }
    },

    async syncGoalDirState(goalDir: GoalDir): Promise<void> {
      try {
        console.log("[目标 Store] 同步目标目录状态:", goalDir);
        await this.$patch((state) => {
          const index = state.goalDirs.findIndex(
            (d) => d.uuid === goalDir.uuid
          );
          if (index !== -1) {
            state.goalDirs[index] = goalDir;
          } else {
            state.goalDirs.push(goalDir);
          }
        });
      } catch (error) {
        console.warn("⚠️ 同步目标目录状态失败:", error);
      }
    },
    async syncGoalDirsState(goalDirs: GoalDir[]): Promise<void> {
      try {
        console.log("[目标 Store] 同步目标目录状态:", goalDirs);
        await this.$patch((state) => {
          state.goalDirs = goalDirs;
        });
      } catch (error) {
        console.warn("⚠️ 同步目标目录状态失败:", error);
      }
    },

    removeGoal(goalUuid: string): void {
      this.goals = this.goals.filter((goal) => goal.uuid !== goalUuid);
    },
    removeGoalDir(dirUuid: string): void {
      this.goalDirs = this.goalDirs.filter((dir) => dir.uuid !== dirUuid);
    },

    getGoalsCountByDirUuid(dirUuid: string): number {
      return this.goals.filter((goal) => goal.dirUuid === dirUuid).length;
    },
  },
});
