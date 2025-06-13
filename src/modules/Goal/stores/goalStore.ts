import { defineStore } from "pinia";
import type {
  Goal,
  KeyResult,
  KeyResultCreate,
  IRecord,
  IRecordCreate,
} from "../types/goal";
import { v4 as uuidv4 } from "uuid";
import { useStoreSave } from "@/shared/composables/useStoreSave";


interface GoalState {
  goals: Goal[];
  records: IRecord[];
  tempGoal: Goal;
  tempKeyResult: KeyResult;
  _autoSave: any;
}

export const useGoalStore = defineStore("goal", {
  state: () =>
    ({
      goals: [] as Goal[],
      tempGoal: {
        id: "tempGoal", // 临时目标 ID
        title: "",
        color: "#FF5733",
        dirId: "",
        startTime: new Date().toISOString().split("T")[0],
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        note: "",
        keyResults: [],
        motive: "",
        feasibility: "",
      } as Goal,
      tempKeyResult: {
        id: "temp", // 临时关键结果 ID
        name: "",
        startValue: 0,
        currentValue: 0,
        targetValue: 10,
        calculationMethod: "sum",
        weight: 5,
      } as KeyResult,
      records: [] as IRecord[],
      _autoSave: null as ReturnType<typeof useStoreSave> | null,
    } as GoalState),
  getters: {
    getAllGoals(): Goal[] {
      return this.goals;
    },
    getGoalsByDirId: (state) => (dirId: string) => {
      if (dirId === "all") {
        return state.goals.filter(
          (g) => g.dirId !== "archive" && g.dirId !== "trash"
        );
      }
      return state.goals.filter((g) => g.dirId === dirId);
    },
    getGoalById: (state) => (id: string) => {
      return state.goals.find((g) => g.id === id);
    },
    // 获取进行中的目标
    getInProgressGoals: (state) => {
      const now = new Date();
      return state.goals.filter(
        (g) => new Date(g.startTime) <= now && new Date(g.endTime) >= now
      );
    },
    // 获取目标进度
    getGoalProgress: (state) => (goalId: string) => {
      const goal = state.goals.find((g) => g.id === goalId);
      if (!goal || !goal.keyResults || goal.keyResults.length === 0) return 0;
      const totalWeight = goal.keyResults.reduce(
        (acc, kr) => acc + kr.weight,
        0
      );
      const totalProgress = goal.keyResults.reduce(
        (acc, kr) => acc + (kr.currentValue / kr.targetValue) * kr.weight,
        0
      );
      return Number(((totalProgress / totalWeight) * 100).toFixed(1));
    },
    getKeyResultProgress: (state) => (goalId: string, keyResultId: string) => {
      const goal = state.goals.find((g) => g.id === goalId);
      if (!goal) return null;
      const keyResult = goal.keyResults.find((kr) => kr.id === keyResultId);
      if (!keyResult) return null;
      return Number(
        ((keyResult.currentValue / keyResult.targetValue) * 100).toFixed(1)
      );
    },
    // 记录相关
    // 获取今日记录
    getTodayRecords: (state) => {
      const today = new Date().toISOString().split("T")[0];
      return state.records.filter((r) => {
        if (!r.date) return false; // 过滤掉没有日期的记录
        const recordDate = r.date.split(" ")[0];
        return recordDate === today;
      });
    },
    // 获取今日记录数量
    getTodayRecordCount: (state) => {
      const today = new Date().toISOString().split("T")[0];
      return state.records.filter((r) => {
        if (!r.date) return false; // 过滤掉没有日期的记录
        const recordDate = r.date.split(" ")[0];
        return recordDate === today;
      }).length;
    },
    // 获取关键结果的所有记录
    getRecordsByKeyResultId:
      (state) => (goalId: string, keyResultId: string) => {
        const goal = state.goals.find((g) => g.id === goalId);
        if (!goal) return null;
        const keyResult = goal.keyResults.find((kr) => kr.id === keyResultId);
        if (!keyResult) return null;
        return state.records.filter(
          (r) => r.goalId === goalId && r.keyResultId === keyResultId
        );
      },
    // 获取今日该目标的提升进度
    getTodayGoalProgress: (state) => (goalId: string) => {
      const today = new Date().toISOString().split("T")[0];
      const goal = state.goals.find((g) => g.id === goalId);
      if (!goal) return null;
      const totalWeight = goal.keyResults.reduce(
        (acc, kr) => acc + kr.weight,
        0
      ); // 总权重（总分数）
      // 获取今日该目标的记录
      const todayRecords = state.records.filter((r) => {
        if (!r.date) return false; // 过滤掉没有日期的记录
        return r.goalId === goalId && r.date.split(" ")[0] === today;
      });

      // 今日进度（今日分数）
      let todayProgress = 0;
      for (const record of todayRecords) {
        const keyResult = goal.keyResults.find(
          (kr) => kr.id === record.keyResultId
        );
        if (keyResult) {
          todayProgress +=
            (record.value / (keyResult.targetValue - keyResult.startValue)) *
            keyResult.weight;
        }
      }
      return Number(((todayProgress / totalWeight) * 100).toFixed(1));
    },
  },
  actions: {
    // 初始化自动保存（在需要时调用）
    _initAutoSave() {
      if (!this._autoSave) {
        this._autoSave = useStoreSave({
          onSuccess: (storeName) => console.log(`✓ ${storeName} 数据保存成功`),
          onError: (storeName, error) =>
            console.error(`✗ ${storeName} 数据保存失败:`, error),
        });
      }
      return this._autoSave;
    },

    // 自动保存方法
    async saveGoals() {
      const autoSave = this._initAutoSave();
      return autoSave.debounceSave("goals", this.goals);
    },

    async saveRecords() {
      const autoSave = this._initAutoSave();
      return autoSave.debounceSave("records", this.records);
    },

    async saveGoalsImmediately() {
      const autoSave = this._initAutoSave();
      return autoSave.saveImmediately("goals", this.goals);
    },

    async saveRecordsImmediately() {
      const autoSave = this._initAutoSave();
      return autoSave.saveImmediately("records", this.records);
    },

    // 检查保存状态
    isSavingGoals() {
      const autoSave = this._initAutoSave();
      return autoSave.isSaving("goals");
    },

    isSavingRecords() {
      const autoSave = this._initAutoSave();
      return autoSave.isSaving("records");
    },

    isSavingAny() {
      const autoSave = this._initAutoSave();
      return autoSave.isSaving();
    },

    // 临时目标相关方法（用于新建目标）
    initTempGoal() {
      this.tempGoal = {
        id: "tempGoal", // 临时目标 ID
        title: "",
        color: "#FF5733",
        dirId: "",
        startTime: new Date().toISOString().split("T")[0],
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        note: "",
        keyResults: [],
        motive: "",
        feasibility: "",
      };
      return this.tempGoal;
    },
    // 生成已有目标的临时副本
    initTempGoalByGoalId(goalId: string) {
      const goal = this.goals.find((g) => g.id === goalId);
      this.tempGoal = {
        ...goal,
        id: goal?.id || "tempGoal",
        keyResults: goal?.keyResults || [],
        title: goal?.title || "",
        color: goal?.color || "#FF5733",
        dirId: goal?.dirId || "",
        startTime: goal?.startTime || new Date().toISOString().split("T")[0],
        endTime:
          goal?.endTime ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        motive: goal?.motive || "",
        feasibility: goal?.feasibility || "",
        meta: goal?.meta || undefined,
      };
      return this.tempGoal;
    },
    // 清空临时目标
    clearTempGoal() {
      this.initTempGoal();
    },
    // 保存临时目标的修改
    async saveTempGoal() {
      if (!this.tempGoal || !this.tempGoal.id) return null;

      // 如果是新建目标，则添加到 goals 数组中
      if (this.tempGoal.id === "tempGoal") {
        const newGoal: Goal = {
          ...this.tempGoal,
          id: uuidv4(),
          meta: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
        this.clearTempGoal();

        this.goals.push(newGoal);

        const success = await this.saveGoals();
        if (!success) {
          console.error("目标保存失败，请稍后再试");
          return null;
        }

        return newGoal;
      }
      // 如果是编辑目标，则更新 goals 数组中的目标
      const index = this.goals.findIndex((g) => g.id === this.tempGoal.id);
      if (index === -1) return null;

      const updatedGoal = {
        ...this.tempGoal,
        meta: {
          createdAt: this.tempGoal.meta?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
      this.clearTempGoal();

      this.goals.splice(index, 1, updatedGoal);

      const success = await this.saveGoals();
      if (!success) {
        console.error("目标保存失败，请稍后再试");
        return null;
      }

      return updatedGoal;
    },
    // // 获取临时目标
    // getTempGoal(): Goal {
    //     if (!this.tempGoal) {
    //       this.initTempGoal();
    //     }
    //     return this.tempGoal!;
    // },
    // 关键结果相关方法
    // 生成临时关键结果
    initTempKeyResult() {
      const defaultKeyResult: KeyResult = {
        id: "temp", // 临时关键结果 ID
        name: "",
        startValue: 0,
        currentValue: 0,
        targetValue: 10,
        calculationMethod: "sum",
        weight: 5,
      };

      this.tempKeyResult = defaultKeyResult;
      return defaultKeyResult;
    },
    // 生成已有关键结果的临时副本
    initTempKeyResultByKeyResultId(goalId: string, keyResultId: string) {
      const goal = this.goals.find((g) => g.id === goalId);
      if (!goal) return null;
      const keyResult = goal.keyResults.find((kr) => kr.id === keyResultId);
      if (!keyResult) return null;
      this.tempKeyResult = {
        ...keyResult,
        id: keyResultId,
      };
      return this.tempKeyResult;
    },
    // 清空临时关键结果
    clearTempKeyResult() {
      this.initTempKeyResult();
    },
    //  保存临时关键结果的修改(增加和修改)
    saveTempKeyResultChanges() {
      if (!this.tempKeyResult) return null;
      // 如果是新建关键结果，则添加到临时目标中
      if (this.tempKeyResult.id === "temp") {
        const keyResult: KeyResult = {
          ...this.tempKeyResult,
          id: uuidv4(),
          currentValue: this.tempKeyResult.startValue, // 新建时 currentValue 等于 startValue
        };
        this.tempGoal.keyResults.push(keyResult);
        this.clearTempKeyResult();
        return this.tempKeyResult;
      }
      // 如果是编辑关键结果，则更新临时目标中的关键结果
      if (this.tempKeyResult.id !== "temp") {
        const index = this.tempGoal.keyResults.findIndex(
          (kr) => kr.id === this.tempKeyResult.id
        );

        if (index !== -1) {
          const keyResult: KeyResult = {
            ...this.tempKeyResult,
            id: this.tempKeyResult.id,
          };
          this.tempGoal.keyResults[index] = keyResult;
          this.clearTempKeyResult();
          return keyResult;
        }
      }
      return null;
    },
    //  删除临时关键结果
    deleteTempKeyResult(keyResultId: string) {
      if (!this.tempKeyResult) return null;
      const index = this.tempGoal.keyResults.findIndex(
        (kr) => kr.id === keyResultId
      );
      if (index !== -1) {
        this.tempGoal.keyResults.splice(index, 1);
        // this.clearTempKeyResult();
      }
    },
    // 删除已有关键结果
    deleteKeyResult(goalId: string, keyResultId: string) {
      const goal = this.goals.find((g) => g.id === goalId);
      if (goal) {
        const index = goal.keyResults.findIndex((kr) => kr.id === keyResultId);
        goal.keyResults.splice(index, 1);
      }
    },
    getKeyResultById(goalId: string, keyResultId: string) {
      // 在临时目标中查找关键结果
      if (goalId === "temp") {
        return this.tempGoal.keyResults.find((kr) => kr.id === keyResultId);
      }
      const goal = this.goals.find((g) => g.id === goalId);
      if (goal) {
        return goal.keyResults.find((kr) => kr.id === keyResultId);
      }
      return null;
    },
    // 获取目标下所有关键结果
    getAllKeyResultsByGoalId(goalId: string) {
      // 在临时目标中查找关键结果
      if (goalId === "tempGoal") {
        return this.tempGoal.keyResults;
      }
      const goal = this.goals.find((g) => g.id === goalId);
      if (goal) {
        return goal.keyResults;
      }
      return [];
    },
    updateKeyResult(
      goalId: string,
      keyResultId: string,
      keyResultCreate: KeyResultCreate
    ) {
      if (goalId === "tempGoal") {
        // 如果在新建目标，则更新临时目标的关键结果
        const index = this.tempGoal.keyResults.findIndex(
          (kr) => kr.id === keyResultId
        );
        if (index !== -1) {
          this.tempGoal.keyResults[index] = {
            ...keyResultCreate,
            id: keyResultId,
          };
        }
      } else {
        // 如果在已有目标中，则更新已有目标的关键结果
        const goal = this.goals.find((g) => g.id === goalId);
        if (goal) {
          const index = goal.keyResults.findIndex(
            (kr) => kr.id === keyResultId
          );
          if (index !== -1) {
            goal.keyResults[index] = {
              ...keyResultCreate,
              id: keyResultId,
            };
          }
        }
      }
    },
    // 修改关键结果 startValue 值
    async updateKeyResultCurrentValue(
      goalId: string,
      keyResultId: string,
      startValue: number
    ) {
      const goal = this.goals.find((g) => g.id === goalId);
      if (goal) {
        const keyResult = goal.keyResults.find((kr) => kr.id === keyResultId);
        if (keyResult) {
          keyResult.startValue += startValue;
        }
      }
    },
    // 目标归档
    archiveGoalById(goalId: string) {
      const goal = this.goals.find((g) => g.id === goalId);
      if (goal) {
        goal.dirId = "archive";
      }
    },
    // 目标取消归档
    unarchiveGoalById(goalId: string) {
      const goal = this.goals.find((g) => g.id === goalId);
      if (goal) {
        goal.dirId = "";
      }
    },
    // 目标删除（逻辑删除，将目标放入删除文件夹）
    deleteGoalById(goalId: string) {
      const goal = this.goals.find((g) => g.id === goalId);
      if (goal) {
        goal.dirId = "trash";
      }
    },
    // 目标恢复（逻辑恢复，将目标放入当前目录）
    restoreGoalById(goalId: string) {
      const goal = this.goals.find((g) => g.id === goalId);
      if (goal) {
        goal.dirId = "";
      }
    },

    // 记录相关方法
    // 添加记录
    addRecord(record: IRecordCreate, goalId: string, keyResultId: string) {
      if (!record || !keyResultId || !goalId) return { message: "参数错误" };
      // 生成记录 ID
      const recordId = uuidv4();
      // 创建记录对象
      const newRecord: IRecord = {
        id: recordId,
        goalId: goalId,
        keyResultId: keyResultId,
        value: record.value,
        date: record.date,
        note: record.note,
      };
      this.records.push(newRecord);

      // 更新关键结果的当前值
      const goal = this.goals.find((g) => g.id === goalId);
      if (goal) {
        const keyResult = goal.keyResults.find((kr) => kr.id === keyResultId);
        if (keyResult) {
          keyResult.currentValue += record.value;
        }
      }

      this.saveRecords();
      this.saveGoals();

      return { message: "记录添加成功" };
    },
  },
});
