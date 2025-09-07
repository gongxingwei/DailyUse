<template>
  <div class="container">
    <h1>Test Echarts</h1>
    <div class="header">
      <span>选择要展示的目标</span>
      <div>
        <v-select v-model="selectedGoalUuid" :items="items" item-title="name" item-value="uuid" label="Select Goal"
          outlined></v-select>
      </div>
    </div>
    <main>
      <section>
        <h2>当前完成进度分析</h2>
        <h5>当前目标: {{ selectedGoal?.name }}</h5>
        <div>
          <v-chart class="chart" :option="progressOption" autoresize />
        </div>
      </section>
      <section> 
        <h2>关键结果进度</h2>
        <h5>当前目标: {{ selectedGoal?.name }}</h5>
        <div>
          <v-chart class="chart" :option="krBarOption" autoresize />
        </div>
      </section>
      <section>
        <h2>高效时间段分析</h2>
        <h5>当前目标: {{ selectedGoal?.name }}</h5>
        <div>
          <v-chart class="chart" :option="periodBarOption" autoresize />
        </div>
      </section>
      
    </main>
  </div>

</template>

<script lang="ts" setup>
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ComposeOption } from 'echarts/core'
import type { BarSeriesOption } from 'echarts/charts'
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption
} from 'echarts/components'
import VChart, { THEME_KEY } from 'vue-echarts';
use([TitleComponent, TooltipComponent, GridComponent, BarChart, CanvasRenderer])
provide(THEME_KEY, 'light');
type EChartsOption = ComposeOption<
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | BarSeriesOption>

import { ref, provide, computed } from 'vue';

import { GoalRecord } from '@renderer/modules/Goal/domain/entities/record';
import { useGoalStore } from '@renderer/modules/Goal/presentation/stores/goalStore';
const goalStore = useGoalStore();

const goals = computed(() => goalStore.getAllGoals);

const selectedGoalUuid = ref<string | null>(null);
const selectedGoal = computed(() => selectedGoalUuid.value ? goalStore.getGoalByUuid(selectedGoalUuid.value) : null);

const items = computed(() => {
  return goals.value.map(goal => ({
    uuid: goal.uuid,
    name: goal.name,
  }));
});

type TimePeriod = '早晨' | '下午' | '晚上' | '凌晨';
const timePeriods: TimePeriod[] = ['早晨', '下午', '晚上', '凌晨'];
function classifyGoalRecordsByPeriod(records: GoalRecord[]): Record<TimePeriod, number> {
  const stat: Record<TimePeriod, number> = {
    '早晨': 0,
    '下午': 0,
    '晚上': 0,
    '凌晨': 0,
  };
  for (const rec of records) {
    const date = new Date(rec.lifecycle.createdAt);
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

// 柱形图 option
const periodBarOption = computed<EChartsOption>(() => {
  // 获取当前目标的记录
  const records = (selectedGoal.value?.records as GoalRecord[]) || [];
  const stat = classifyGoalRecordsByPeriod(records);

  return {
    title: {
      text: '不同时间段的任务完成数',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    xAxis: {
      type: 'category',
      data: timePeriods,
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
    },
    series: [
      {
        name: '完成数',
        type: 'bar',
        data: timePeriods.map(period => stat[period]),
        itemStyle: {
          color: '#5470C6',
        },
      },
    ],
  };
});


const danger_threshold = 20;   // 可自定义
const warning_threshold = 10;  // 可自定义
const danger_color = '#ff4d4f';
const warning_color = '#faad14';
const safe_color = '#52c41a';

const progressOption = computed(() => {
  const progress = selectedGoal.value?.progress ?? 0;
  const timeProgress = Math.round((selectedGoal.value?.TimeProgress ?? 0) * 100);

  let bgColor = safe_color;
  if (timeProgress - progress >= danger_threshold) {
    bgColor = danger_color;
  } else if (timeProgress - progress >= warning_threshold) {
    bgColor = warning_color;
  }

  return {
    title: { text: '目标完成进度 vs 时间进度', left: 'center' },
    grid: { left: 40, right: 30, top: 50, bottom: 30 },
    xAxis: {
      max: 100,
      splitLine: { show: false },
      axisLabel: { formatter: '{value}%' },
      axisLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: ['目标完成进度', '时间进度'],
      axisTick: { show: false }
    },
    series: [{
      type: 'bar',
      data: [progress, timeProgress],
      label: {
        show: true,
        position: 'right',
        formatter: '{c}%'
      },
      itemStyle: {
        color: bgColor,
        borderRadius: 8
      },
      barWidth: 30
    }]
  }
});


const krNames = computed(() => selectedGoal.value?.keyResults.map(kr => kr.name) ?? []);
const krProgress = computed(() => selectedGoal.value?.keyResults.map(kr => kr.progress) ?? []);

const krBarOption = computed(() => ({
  title: { text: '关键结果进度', left: 'center' },
  grid: { left: 60, right: 60, top: 40, bottom: 40 },
  xAxis: {
    max: 100,
    splitLine: { show: false },
    axisLabel: { formatter: '{value}%' }
  },
  yAxis: {
    type: 'category',
    data: krNames.value,
    axisTick: { show: false }
  },
  series: [{
    type: 'bar',
    data: krProgress.value,
    label: {
      show: true,
      position: 'right',
      formatter: '{c}%'
    },
    itemStyle: {
      color: '#1890ff',
      borderRadius: 8
    },
    barWidth: 30
  }]
}));

</script>

<style scoped>
.chart {
  height: 100vh;
}
</style>
