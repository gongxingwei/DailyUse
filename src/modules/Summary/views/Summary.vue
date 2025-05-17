<template>
  <div id="summary">
    <header>
      <h2>摘要</h2>
      <div class="summary-header-content">
        <div class="summary-header-info">
          <div style="color: rgb(var(--v-theme-warning));" class="summary-header-today-layout">
            <div class="summary-header-today-icon-layout">
              <v-icon icon="mdi-list-box" size="20"/>
              <span >{{ tasks.length }}</span>
            </div>
            <span>今日任务</span>
          </div>
          <div style="color: rgb(var(--v-theme-info));" class="summary-header-today-layout">
            <div class="summary-header-today-icon-layout">
              <v-icon icon="mdi-fencing" size="20"/>
              <span>{{ goals.length }}</span>
            </div>
            <span>进行中目标</span>
          </div>
          <div style="color: rgb(var(--v-theme-success));" class="summary-header-today-layout">
            <div class="summary-header-today-icon-layout">
              <v-icon icon="mdi-record" size="20"/>
              <span>{{ todayRecordCount }}</span>
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
      <div class="task-container">
        <TaskInSummaryCard />
      </div>
      <div class="goals-container">
        <GoalInfoShowCard v-for="goal in goals" :key="goal.id" :goal="goal" />
      </div>
      <div class="repository-container">
        <RecentRepoCard />
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
import RecentRepoCard from '@/modules/Repository/components/RecentRepoCard.vue';

const goalStore = useGoalStore();
const taskStore = useTaskStore();
const goals = computed(() => {
  return goalStore.getInProgressGoals;
});
const tasks = computed(() => {
  let tasks = taskStore.getTodayTaskInstances;
  return tasks;
});
const todayRecordCount = computed(() => {
  return goalStore.getTodayRecordCount;
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
  background-color: rgb(var(--v-theme-surface));
  border-radius: 12px;
  min-width: fit-content;
  border-radius: 50px;
  box-shadow: 5px 5px 10px rgb(var(--v-theme-surface)),
    -5px -5px 10px rgb(var(--v-theme-background));
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
}

.motivate-card {
  flex: 1;
  min-width: 0;
  margin: 0;
  overflow: auto;
}

.task-container, .goals-container, .repository-container, .gantt-chart { 
  box-shadow: 5px 5px 10px rgb(var(--v-theme-surface)),
    -5px -5px 10px rgb(var(--v-theme-background));
}

.motivate-card{
  margin-bottom: 1rem;
}
</style>