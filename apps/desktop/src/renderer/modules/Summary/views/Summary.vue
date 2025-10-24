<template>
  <div class="summary-page">
    <!-- 页面头部 -->
    <header class="summary-header">
      <!-- 标题区域 -->
      <div class="header-title">
        <div class="d-flex align-center">
          <v-avatar size="48" color="primary" variant="tonal" class="mr-4">
            <v-icon size="24">mdi-view-dashboard</v-icon>
          </v-avatar>
          <div>
            <h1 class="text-h4 font-weight-bold text-primary mb-1">摘要面板</h1>
            <p class="text-subtitle-1 text-medium-emphasis mb-0">
              {{ getCurrentDateString() }}
            </p>
          </div>
        </div>
      </div>

      <!-- 统计卡片和激励卡片 -->
      <div class="summary-header-content">
        <!-- 统计信息卡片 -->
        <v-card class="stats-card" elevation="2">
          <v-card-text class="pa-4">
            <div class="stats-grid">
              <!-- 今日任务 -->
              <div class="stat-item">
                <div
                  class="stat-icon-wrapper"
                  style="background: rgba(var(--v-theme-warning), 0.1)"
                >
                  <v-icon icon="mdi-list-box" size="24" color="warning" />
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ tasks.length }}</div>
                  <div class="stat-label">今日任务</div>
                </div>
              </div>

              <!-- 进行中目标 -->
              <div class="stat-item">
                <div class="stat-icon-wrapper" style="background: rgba(var(--v-theme-info), 0.1)">
                  <v-icon icon="mdi-target" size="24" color="info" />
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ goals.length }}</div>
                  <div class="stat-label">进行中目标</div>
                </div>
              </div>

              <!-- 今日记录 -->
              <div class="stat-item">
                <div
                  class="stat-icon-wrapper"
                  style="background: rgba(var(--v-theme-success), 0.1)"
                >
                  <v-icon icon="mdi-chart-line" size="24" color="success" />
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ todayGoalRecordCount }}</div>
                  <div class="stat-label">今日记录</div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- 激励卡片 -->
        <div class="motivate-section">
          <MotivateCard />
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="summary-main">
      <!-- 今日任务区域 -->
      <section class="content-section">
        <TaskInSummaryCard />
      </section>

      <!-- 目标概览区域 -->
      <section class="content-section">
        <div v-if="goals.length === 0" class="no-goal-tip">
          <v-icon size="48" color="primary" class="mb-2">mdi-target-off</v-icon>
          <div class="tip-title">还没有进行中的目标</div>
          <div class="tip-desc">
            目标可以帮你更好地规划和追踪进度，快去<span
              class="tip-link"
              @click="$router.push('/goal-management')"
              >目标模块</span
            >创建一个吧！
          </div>
        </div>
        <div v-else class="goals-grid">
          <GoalInfoShowCard
            v-for="goal in goals"
            :key="goal.uuid"
            :goal="goal as Goal"
            class="goal-card-item"
          />
        </div>
      </section>

      <!-- 时间线图表区域 -->
      <section>
        <GoalGanttChart />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGoalStore } from '@renderer/modules/Goal/presentation/stores/goalStore';
import { useTaskStore } from '@renderer/modules/Task/presentation/stores/taskStore';
// components
import GoalInfoShowCard from '@renderer/modules/Goal/presentation/components/cards/GoalInfoShowCard.vue';
import MotivateCard from '@renderer/modules/Goal/presentation/components/cards/MotivateCard.vue';
import GoalGanttChart from '@renderer/modules/Goal/presentation/components/echarts/GoalGanttChart.vue';
import TaskInSummaryCard from '@renderer/modules/Task/presentation/components/TaskInSummaryCard.vue';
// domains
import { Goal } from '@renderer/modules/Goal/index';

const goalStore = useGoalStore();
const taskStore = useTaskStore();

const goals = computed(() => {
  return goalStore.getInProgressGoals;
});

const tasks = computed(() => {
  let tasks = taskStore.getTodayTaskInstances;
  return tasks;
});

const todayGoalRecordCount = computed(() => {
  return goalStore.getTodayGoalRecordCount;
});

const getCurrentDateString = () => {
  const today = new Date();
  return today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
};
</script>

<style scoped>
.summary-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
  width: 100%;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.02) 0%,
    rgba(var(--v-theme-surface), 0.91) 100%
  );
}

/* 头部样式 */
.summary-header {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex-shrink: 0;
}

.header-title {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.05) 0%,
    rgba(var(--v-theme-secondary), 0.05) 100%
  );
  border-radius: 20px;
  padding: 1.5rem 2rem;
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.summary-header-content {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.5rem;
  align-items: stretch;
}

/* 统计卡片样式 */
.stats-card {
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  background: rgb(var(--v-theme-surface));
  min-width: fit-content;
}

.stats-grid {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
}

.stat-icon-wrapper {
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
  color: rgb(var(--v-theme-on-surface));
}

.stat-label {
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  white-space: nowrap;
}

/* 激励卡片样式 */
.motivate-section {
  flex: 1;
  min-width: 0;
}

/* 主要内容样式 */
.summary-main {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  flex: 1;
  min-height: 0;
}

.content-section {
  background: rgb(var(--v-theme-surface));
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  width: 100%;
  overflow: visible;
}

.content-section:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.content-section.full-width {
  grid-column: 1 / -1;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid rgba(var(--v-theme-primary), 0.1);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.goals-grid {
  display: grid;
  grid-template-rows: repeat(auto-fill, minmax(300px, 1fr));
}

.goal-card-item {
  flex: 0 0 400px;
  /* 固定宽度 400px，不会收缩 */
  transition: all 0.3s ease;
  overflow: visible;
}

.goal-card-item:hover {
  transform: scale(1.02);
}

.no-goal-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 1.1rem;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.03),
    rgba(var(--v-theme-secondary), 0.03)
  );
  border-radius: 12px;
}

.tip-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: rgb(var(--v-theme-primary));
}

.tip-desc {
  font-size: 1rem;
  margin-bottom: 4px;
}

.tip-link {
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  text-decoration: underline;
  font-weight: 500;
  transition: color 0.2s;
}
.tip-link:hover {
  color: rgb(var(--v-theme-secondary));
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .summary-page {
    padding: 1.5rem;
  }

  .goal-card-item {
    flex: 0 0 350px;
  }
}

@media (max-width: 1200px) {
  .summary-header-content {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    justify-content: space-around;
  }

  .goal-card-item {
    flex: 0 0 320px;
  }
}

@media (max-width: 768px) {
  .summary-page {
    padding: 1rem;
    gap: 1.5rem;
  }

  .header-title {
    padding: 1rem 1.5rem;
  }

  .stats-grid {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .stat-item {
    width: 100%;
    justify-content: flex-start;
  }

  .content-section {
    padding: 1rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .goal-card-item {
    flex: 0 0 280px;
  }
}

@media (max-width: 600px) {
  .summary-header-content {
    gap: 1rem;
  }

  .section-header {
    margin-bottom: 1rem;
  }

  .goal-card-item {
    flex: 0 0 260px;
  }
}
</style>
