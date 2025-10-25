<template>
  <div class="weight-snapshot-view">
    <v-container fluid>
      <!-- 页面标题 -->
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center mb-4">
            <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" />
            <h1 class="text-h4 ml-4">权重快照历史</h1>
          </div>
        </v-col>
      </v-row>

      <!-- 标签页 -->
      <v-tabs v-model="activeTab" bg-color="transparent" color="primary">
        <v-tab value="list">
          <v-icon start>mdi-format-list-bulleted</v-icon>
          变更历史
        </v-tab>
        <v-tab value="trend">
          <v-icon start>mdi-chart-line</v-icon>
          趋势分析
        </v-tab>
        <v-tab value="comparison">
          <v-icon start>mdi-chart-bar</v-icon>
          权重对比
        </v-tab>
      </v-tabs>

      <v-divider class="mb-6" />

      <!-- 标签页内容 -->
      <v-window v-model="activeTab">
        <!-- 变更历史列表 -->
        <v-window-item value="list">
          <WeightSnapshotList :goal-uuid="goalUuid" />
        </v-window-item>

        <!-- 趋势分析图表 -->
        <v-window-item value="trend">
          <WeightTrendChart :goal-uuid="goalUuid" />
        </v-window-item>

        <!-- 权重对比 -->
        <v-window-item value="comparison">
          <WeightComparison :goal-uuid="goalUuid" />
        </v-window-item>
      </v-window>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import WeightSnapshotList from '../components/weight-snapshot/WeightSnapshotList.vue';
import WeightTrendChart from '../components/weight-snapshot/WeightTrendChart.vue';
import WeightComparison from '../components/weight-snapshot/WeightComparison.vue';

const route = useRoute();
const goalUuid = ref<string>(route.params.goalUuid as string);
const activeTab = ref<string>('list');

onMounted(() => {
  // 从 URL 查询参数获取默认标签页
  if (route.query.tab) {
    activeTab.value = route.query.tab as string;
  }
});
</script>

<style scoped>
.weight-snapshot-view {
  width: 100%;
  min-height: 100vh;
}
</style>
