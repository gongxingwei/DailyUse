<template>
  <div class="container">
    <h1>Test Echarts</h1>
    <div class="header">
      <span>选择要展示的目标</span>
      <div>
        <v-select v-model="selectedGoal" :items="goalStore.goals" item-text="name" item-value="id" label="Select Goal"
          outlined></v-select>
      </div>
    </div>
    <main>
      <section>
        <h5>当前目标: {{ selectedGoal }}</h5>
        <div>基础数据：</div>
      </section>
    </main>

  </div>

  <v-chart class="chart" :option="option" autoresize />
</template>

<script lang="ts" setup>
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import VChart, { THEME_KEY } from 'vue-echarts';
import { ref, provide, computed } from 'vue';

import { Goal } from '@/modules/Goal/domain/aggregates/goal';
import { Record } from '@/modules/Goal/domain/entities/record';
import { useGoalStore } from '@/modules/Goal/presentation/stores/goalStore';
const goalStore = useGoalStore();

const goal = computed(() => goalStore.getAllGoals);

const selectedGoal = ref<Goal | null>(null);

const getData = (records: Record[]) => {
  return records.map((record) => ({
    value: record.value,
    name: record.name,
  }));
};

type TimePeriod = '早晨' | '下午' | '晚上' | '凌晨';

function classifyRecordsByPeriod(records: Record[]): Record<string, number> {
  const stat: Record<TimePeriod, number> = {
    '早晨': 0,
    '下午': 0,
    '晚上': 0,
    '凌晨': 0,
  };
  for (const rec of records) {
    const date = new Date(rec.completedAt);
    const period = getTimePeriod(date);
    stat[period]++;
  }
  return stat;
}

function getTimePeriod(date: Date): TimePeriod {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return '早晨';
  if (hour >= 12 && hour < 18) return '下午';
  if (hour >= 18 && hour < 24) return '晚上';
  return '凌晨';
}

use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
]);

provide(THEME_KEY, 'dark');

const option = ref({
  title: {
    text: 'Traffic Sources',
    left: 'center',
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b} : {c} ({d}%)',
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    data: ['Direct', 'Email', 'Ad Networks', 'Video Ads', 'Search Engines'],
  },
  series: [
    {
      name: 'Traffic Sources',
      type: 'pie',
      radius: '55%',
      center: ['50%', '60%'],
      data: [
        { value: 335, name: 'Direct' },
        { value: 310, name: 'Email' },
        { value: 234, name: 'Ad Networks' },
        { value: 135, name: 'Video Ads' },
        { value: 1548, name: 'Search Engines' },
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
  ],
});
</script>

<style scoped>
.chart {
  height: 100vh;
}
</style>
