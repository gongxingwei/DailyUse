<template>
  <div id="summary">
    <header>
      <h3>摘要</h3>
      <div class="summary-header-info">
        <div class="summary-header-today-layout">
          <div class="summary-header-today-icon-layout">
            <v-icon icon="mdi-list-box" size="20" style="color: #db6b6b" />
            <span>{{ tasks.length }}</span>
          </div>
          <span>今日任务</span>
        </div>
        <div class="summary-header-today-layout">
          <div class="summary-header-today-icon-layout">
            <v-icon icon="mdi-fencing" size="20" style="color: #db6b6b" />
            <span>{{ goals.length }}</span>
          </div>
          <span>进行中目标</span>
        </div>
        <div class="summary-header-today-layout">
          <div class="summary-header-today-icon-layout">
            <v-icon icon="mdi-record" size="20" style="color: #db6b6b" />
            <span>1</span>
          </div>
          <span>今日添加记录</span>
        </div>
      </div>
    </header>
    <main>
      <div class="goals-container">
        <GoalInfoShowCard v-for="goal in goals" :key="goal.id" :goal="goal" />
      </div>
      <div class="motivate-card">
        <MotivateCard />
      </div>
      <div class="gantt-chart">
        <GoalGanttChart />
      </div>
    </main>

  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useGoalStore } from '@/modules/Goal/stores/goalStore';
import { useTaskStore } from '@/modules/Task/stores/taskStore';
// components
import GoalInfoShowCard from '@/modules/Goal/components/GoalInfoShowCard.vue';
import MotivateCard from '@/modules/Goal/components/MotivateCard.vue';
import GoalGanttChart from '@/modules/Goal/components/GoalGanttChart.vue';

const goalStore = useGoalStore();
const taskStore = useTaskStore();
const goals = computed(() => {
  return goalStore.getInProgressGoals;
});
const tasks = computed(() => {
  let tasks = taskStore.getTodayTaskInstances;
  console.log(tasks);
  return tasks;
});
</script>
<style scoped>
#summary {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 150px;
  height: 100%;
  width: 100%;
}

.summary-header-info {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  background-color: #2b2b2b;
  border-radius: 12px;
}
/* header最上方样式 */
.summary-header-today-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: auto;
  width: auto;
  font-size: 0.8rem;

}
.summary-header-today-icon-layout {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  flex: 1;

  width: 100%;
  font-size: 1.5rem;
  gap: 0.25rem;
  color: #db6b6b;
}
/* 颜色变化 */
.summary-header-today-task {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: auto;
  width: auto;
  font-size: 0.8rem;

}
.summary-header-today-task-icon {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  flex: 1;

  width: 100%;
  font-size: 1.5rem;
  gap: 0.25rem;
  color: #db6b6b;
}
</style>