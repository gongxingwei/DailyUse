<template>
  <div id="summary">
    <header>
      <h2>摘要</h2>
      <div class="summary-header-content">
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
        <div class="motivate-card">
          <MotivateCard />
        </div>
      </div>
    </header>
    <main>
      <div>
        <TaskInSummaryCard />
      </div>
      <div class="goals-container">
        <GoalInfoShowCard v-for="goal in goals" :key="goal.id" :goal="goal" />
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
import TaskInSummaryCard from '@/modules/Task/components/TaskInSummaryCard.vue';

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

/* header最上方样式 */
.summary-header-content {
  display: flex;
  gap: 1rem;
  width: 100%;
}
.summary-header-info {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 1rem;
  padding: 0 1.5rem;
  background-color: #2b2b2b;
  border-radius: 12px;
  min-width: fit-content; /* Prevent shrinking below content size */
}
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
.motivate-card { 
  flex: 1;  
  min-width: 0; 
  margin: 0; 
  overflow: auto;
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
.motivate-card { 
  margin-bottom: 1rem;
}
</style>