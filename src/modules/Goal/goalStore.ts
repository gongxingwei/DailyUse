import { defineStore } from "pinia";
import { Todo } from "@/modules/Todo/todoStore";
import { Repository } from "../Repository/repositoryStore";

export interface Goal {
    id: number;
    name: string;
    relativeTodos?: Todo[];
    relativeRepositories?: Repository[];
    createTime: string;
    updateTime: string;
}

export const useGoalStore = defineStore('goal', {
  state: () => ({
    goals: [] as Goal[],
  }),
  actions: {
    addGoal(goalName: string) {
        const now = new Date().toISOString();
        this.goals.push({
            id: Date.now(),
            name: goalName,
            relativeTodos: [],
            relativeRepositories: [],
            createTime: now,
            updateTime: now,
        });
    },

    // 添加关联的 Todo
    addTodoToGoal(goalId: number, todo: Todo) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            if (!goal.relativeTodos) {
                goal.relativeTodos = [];
            }
            if (!goal.relativeTodos.some(t => t.id === todo.id)) {
                goal.relativeTodos.push(todo);
                goal.updateTime = new Date().toISOString();
            }
        }
    },

    // 添加关联的 Repository
    addRepositoryToGoal(goalId: number, repository: Repository) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            if (!goal.relativeRepositories) {
                goal.relativeRepositories = [];
            }
            if (!goal.relativeRepositories.some(r => r.title === repository.title)) {
                goal.relativeRepositories.push(repository);
                goal.updateTime = new Date().toISOString();
            }
        }
    },

    // 移除关联的 Todo
    removeTodoFromGoal(goalId: number, todoId: number) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            if (!goal.relativeTodos) {
                goal.relativeTodos = [];
            }
            goal.relativeTodos = goal.relativeTodos.filter(t => t.id !== todoId);
            goal.updateTime = new Date().toISOString();
        }
    },

    // 移除关联的 Repository
    removeRepositoryFromGoal(goalId: number, repositoryTitle: string) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            if (!goal.relativeRepositories) {
                goal.relativeRepositories = [];
            }
            goal.relativeRepositories = goal.relativeRepositories.filter(r => r.title !== repositoryTitle);
            goal.updateTime = new Date().toISOString();
        }
    },

    // 删除目标
    removeGoal(goalId: number) {
        this.goals = this.goals.filter(g => g.id !== goalId);
    },

    // 更新目标名称
    updateGoalName(oldName: string, newName: string) {
        const goal = this.goals.find(g => g.name === oldName);
        if (goal) {
            goal.name = newName;
            goal.updateTime = new Date().toISOString();
        }
    },

    // 获取目标
    getGoalById(goalId: number) {
        return this.goals.find(g => g.id === goalId);
    },
  },

  persist: true,
});