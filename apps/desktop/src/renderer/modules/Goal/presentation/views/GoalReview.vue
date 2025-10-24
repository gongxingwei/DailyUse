<template>
  <div v-if="loading" class="d-flex justify-center align-center" style="height: 200px">
    <span>加载中...</span>
  </div>
  <div
    v-else-if="!localGoalReview"
    class="d-flex justify-center align-center"
    style="height: 200px"
  >
    <span>加载失败,未获取目标信息</span>
  </div>
  <div v-else id="goal-review" class="h-100 w-100 d-flex flex-column">
    <!-- header -->
    <header class="goal-review-header d-flex justify-space-between align-center px-4 py-2">
      <div>
        <v-btn @click="router.back()" variant="tonal"> 取消 </v-btn>
      </div>
      <div class="goal-review-header-content d-flex flex-column align-center text-center">
        <span class="font-weight-bold" style="font-size: 2rem">目标复盘</span>
        <span class="font-weight-medium">{{ goal.name }}</span>
        <span class="font-weight-light"
          >{{ format(goal.startTime, 'yyyy-MM-dd') }} 到
          {{ format(goal.endTime, 'yyyy-MM-dd') }}</span
        >
      </div>
      <div>
        <v-btn
          color="primary"
          size="large"
          @click="handleAddReviewToGoal(localGoalReview as GoalReview)"
        >
          完成复盘
        </v-btn>
      </div>
    </header>
    <main class="goal-review-main pt-4">
      <!-- 目标基本相关信息 -->
      <section class="goal-analysis">
        <div class="goal-review-card-container d-flex flex-row gap-6 mb-8 justify-center">
          <!-- 目标信息卡片 -->
          <div class="goal-review-card goal-info">
            <div class="card-header pa-4 d-flex flex-column align-start">
              <div>
                <span class="font-weight-light">进度</span>
                <span class="font-weight-bold" style="font-size: 2rem">{{
                  localGoalReview.snapshot.weightedProgress
                }}</span>
                <span class="font-weight-light">%</span>
              </div>
              <div>
                <span>{{ goal.name }}</span>
              </div>
            </div>
            <div class="card-content d-flex flex-column">
              <div
                v-for="kr in localGoalReview.snapshot.keyResultsSnapshot || []"
                :key="kr.uuid"
                class="card-content-item d-flex justify-space-between align-center pa-3"
              >
                <span class="item-name">{{ kr.name }}</span>
                <span class="item-value">{{ kr.currentValue }} -> {{ kr.targetValue }}</span>
              </div>
            </div>
          </div>
          <!-- 任务信息卡片 -->
          <div class="goal-review-card task-info">
            <div class="card-header pa-4 d-flex flex-column align-start">
              <div>
                <span class="font-weight-bold" style="font-size: 2rem">{{
                  taskStatus.overall.incomplete
                }}</span>
                <span class="font-weight-light">条任务未完成</span>
              </div>
              <div>
                <span>共有{{ taskStatus.overall.total }}条任务</span>
              </div>
            </div>
            <div class="card-content d-flex flex-column">
              <div
                v-for="task in taskStatus.taskDetails as any[]"
                :key="task.templateId"
                class="card-content-item d-flex justify-space-between align-center pa-3"
              >
                <span class="item-name">{{ task.title }}</span>
                <span class="item-value">{{ task.completed }}/{{ task.total }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section class="goal-review-charts">
        <v-row>
          <v-col cols="12" md="6">
            <GoalProgressChart :goal="goal as Goal" />
          </v-col>
          <v-col cols="12" md="6">
            <KrProgressChart :goal="goal as Goal" />
          </v-col>
          <v-col cols="12">
            <PeriodBarChart :goal="goal as Goal" />
          </v-col>
        </v-row>
      </section>

      <!-- Self Diagnosis -->
      <section class="self-diagnosis mt-8">
        <div class="diagnosis-container pa-10">
          <h2 class="diagnosis-title text-center mb-8">自我诊断</h2>
          <div
            class="diagnosis-grid"
            style="
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 1.5rem;
              max-width: 1200px;
              margin: 0 auto;
            "
          >
            <div class="diagnosis-card">
              <div class="diagnosis-card-header d-flex align-center gap-3 pa-6">
                <v-icon class="diagnosis-icon" color="success">mdi-trophy</v-icon>
                <h3>主要成就</h3>
              </div>
              <div class="diagnosis-card-content pa-6">
                <textarea
                  v-model="localGoalReview.content.achievements"
                  placeholder="列出这段时间的主要成就..."
                  class="diagnosis-textarea"
                ></textarea>
              </div>
            </div>
            <div class="diagnosis-card">
              <div class="diagnosis-card-header d-flex align-center gap-3 pa-6">
                <v-icon class="diagnosis-icon" color="warning">mdi-alert-circle</v-icon>
                <h3>遇到的挑战</h3>
              </div>
              <div class="diagnosis-card-content pa-6">
                <textarea
                  v-model="localGoalReview.content.challenges"
                  placeholder="记录遇到的主要挑战..."
                  class="diagnosis-textarea"
                ></textarea>
              </div>
            </div>
            <div class="diagnosis-card">
              <div class="diagnosis-card-header d-flex align-center gap-3 pa-6">
                <v-icon class="diagnosis-icon" color="info">mdi-lightbulb</v-icon>
                <h3>经验总结</h3>
              </div>
              <div class="diagnosis-card-content pa-6">
                <textarea
                  v-model="localGoalReview.content.learnings"
                  placeholder="总结经验教训..."
                  class="diagnosis-textarea"
                ></textarea>
              </div>
            </div>
            <div class="diagnosis-card">
              <div class="diagnosis-card-header d-flex align-center gap-3 pa-6">
                <v-icon class="diagnosis-icon" color="primary">mdi-arrow-right-circle</v-icon>
                <h3>下一步计划</h3>
              </div>
              <div class="diagnosis-card-content pa-6">
                <textarea
                  v-model="localGoalReview.content.nextSteps"
                  placeholder="制定下一步计划..."
                  class="diagnosis-textarea"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGoalStore } from '../stores/goalStore';
import { useGoalServices } from '../composables/useGoalService';
import GoalProgressChart from '../components/echarts/GoalProgressChart.vue';
import KrProgressChart from '../components/echarts/KrProgressChart.vue';
import PeriodBarChart from '../components/echarts/PeriodBarChart.vue';
import { GoalReview } from '../../domain/entities/goalReview';
import { Goal } from '../../domain/aggregates/goal';
import { format } from 'date-fns';

const loading = ref(true);
const route = useRoute();
const router = useRouter();
const goalStore = useGoalStore();

const goalUuid = route.params.goalUuid as string;
const goal = goalStore.getGoalByUuid(goalUuid) as Goal;
const localGoalReview = ref<GoalReview>(GoalReview.forCreate(goal, 'custom'));
const { handleAddReviewToGoal } = useGoalServices();

const taskStatus = ref({
  overall: { incomplete: 0, total: 0 },
  taskDetails: [],
});

onMounted(async () => {
  loading.value = false;
});
</script>

<style scoped>
#goal-review {
  background: linear-gradient(
    120deg,
    rgba(var(--v-theme-primary), 0.08) 0%,
    rgba(var(--v-theme-background), 0.95) 100%
  );

  overflow: hidden;
}
.goal-review-header {
  background-color: rgba(var(--v-theme-surface-light), 0.5);
}
.goal-review-main {
  padding: 0 2rem;
  flex: 1 1 auto;
  overflow-y: auto;
}
.goal-review-card {
  width: 600px;
  max-width: 600px;
  min-width: 400px;
  height: 400px;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  padding: 0;
}
.goal-review-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
.goal-info {
  background: rgba(var(--v-theme-blue), 0.6);
  color: var(--text-light);
  padding: 0;
  overflow: hidden;
}
.goal-info .card-header {
  background-color: rgb(var(--v-theme-deep-blue));
  margin-bottom: 0;
}
.task-info {
  background: linear-gradient(135deg, rgba(var(--v-theme-red), 0.6), rgb(var(--v-theme-deep-red)));
  color: var(--text-light);
  padding: 0;
  overflow: hidden;
}
.task-info .card-header {
  background-color: rgb(var(--v-theme-deep-red));
  margin-bottom: 0;
}
.card-content-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: background-color 0.2s ease;
}
.card-content-item:hover {
  background: rgba(255, 255, 255, 0.15);
}
.item-name {
  font-weight: 500;
  flex: 1;
}
.item-value {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: bold;
  min-width: 80px;
  text-align: center;
}
.self-diagnosis {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-surface), 0.95),
    rgba(var(--v-theme-background), 0.98)
  );
  border-radius: 16px;
  margin: 2rem 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
.diagnosis-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  overflow: hidden;
}
.diagnosis-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  border-color: rgba(var(--v-theme-primary), 0.3);
}
.diagnosis-textarea {
  width: 100%;
  height: 140px;
  padding: 1rem;
  background: rgba(var(--v-theme-surface), 0.8);
  border: 2px solid rgba(var(--v-theme-outline), 0.15);
  border-radius: 8px;
  resize: none;
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgb(var(--v-theme-on-surface));
  transition: all 0.3s ease;
  font-family: inherit;
}
.diagnosis-textarea:focus {
  outline: none;
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.1);
  background: rgb(var(--v-theme-surface));
}
.diagnosis-textarea::placeholder {
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-size: 0.9rem;
}
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--primary-blue);
  font-size: 1.2rem;
}
</style>
