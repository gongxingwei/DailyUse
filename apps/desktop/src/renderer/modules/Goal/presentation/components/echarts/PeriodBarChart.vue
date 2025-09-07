<template>
  <v-chart class="chart" :option="periodBarOption" autoresize />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { Goal } from '@renderer/modules/Goal/domain/aggregates/goal'
import type { GoalRecord } from '@renderer/modules/Goal/domain/entities/record'
import { useTheme } from 'vuetify'
const props = defineProps<{
  goal: Goal | null
}>()

const theme = useTheme()
const surfaceColor = theme.current.value.colors.surface
const fontColor = theme.current.value.colors.font

type TimePeriod = '早晨' | '下午' | '晚上' | '凌晨'
const timePeriods: TimePeriod[] = ['早晨', '下午', '晚上', '凌晨']

function classifyGoalRecordsByPeriod(records: GoalRecord[]): Record<TimePeriod, number> {
  const stat: Record<TimePeriod, number> = {
    '早晨': 0,
    '下午': 0,
    '晚上': 0,
    '凌晨': 0,
  }
  for (const rec of records) {
    const date = new Date(rec.lifecycle.createdAt)
    const period = getTimePeriod(date)
    stat[period]++
  }
  return stat
}

function getTimePeriod(date: Date): TimePeriod {
  const hour = date.getHours()
  if (hour >= 6 && hour < 12) return '早晨'
  if (hour >= 12 && hour < 18) return '下午'
  if (hour >= 18 && hour < 24) return '晚上'
  return '凌晨'
}

const periodBarOption = computed(() => {
  const records = (props.goal?.records as GoalRecord[]) || []
  const stat = classifyGoalRecordsByPeriod(records)
  const dataArr = timePeriods.map(period => stat[period])

   // 找最大最小值的索引
  const max = Math.max(...dataArr)
  const min = Math.min(...dataArr)
  const maxIdx = dataArr.indexOf(max)
  const minIdx = dataArr.indexOf(min)

  return {
    backgroundColor: surfaceColor,
    title: {
      text: '不同时间段的任务完成数',
      left: 'center',
      top: 10,
      textStyle: { fontSize: 16 }
    },
    tooltip: {
      backgroundColor: surfaceColor,
      borderColor: 'transparent',
      textStyle: {
        color: fontColor,
        fontSize: 14
      },
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    xAxis: {
      type: 'category',
      data: timePeriods,
      axisLabel: { fontSize: 12 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
       splitLine: { show: false }
    },
    series: [
      {
        name: '完成数',
        type: 'bar',
        data: dataArr,
        itemStyle: {
          color: (params: any) => {
            if (params.dataIndex === maxIdx) return '#52c41a' // 绿色
            if (params.dataIndex === minIdx) return '#ff4d4f' // 红色
            return '#5470C6' // 其他
          },
          borderRadius: [8, 8, 8, 8]
        },
        barWidth: 50,
        label: {
          show: true,
          position: 'top',
          formatter: '{c}',
          fontSize: 12,
          color: fontColor
        }
      },
    ],
    grid: { left: 40, right: 30, top: 50, bottom: 30 }
  }
})
</script>

<style scoped>
.chart {
  width: 100%;
  height: 220px;
  min-height: 180px;
  margin-bottom: 24px;

  border-radius: 16px;
  overflow: hidden;
}
</style>
