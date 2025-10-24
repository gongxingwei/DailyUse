<!--
  Error Page Component
  错误页面
-->
<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-card-title class="text-center pa-6">
            <v-icon color="error" size="64" class="mb-4"> mdi-alert-circle </v-icon>
            <h2 class="text-h5">出现错误</h2>
          </v-card-title>

          <v-card-text class="text-center">
            <p class="text-body-1 mb-4">
              {{ errorMessage || '抱歉，发生了一个未知错误。' }}
            </p>

            <v-chip v-if="errorCode" color="error" variant="outlined" class="mb-4">
              错误代码: {{ errorCode }}
            </v-chip>

            <p class="text-body-2 text-medium-emphasis">请尝试刷新页面或联系技术支持。</p>
          </v-card-text>

          <v-card-actions class="justify-center pa-6">
            <v-btn color="primary" variant="elevated" @click="refresh"> 刷新页面 </v-btn>

            <v-btn color="secondary" variant="outlined" @click="goHome"> 回到首页 </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// 从查询参数获取错误信息
const errorMessage = computed(() => route.query.message as string);
const errorCode = computed(() => route.query.code as string);

// 刷新页面
const refresh = () => {
  window.location.reload();
};

// 回到首页
const goHome = () => {
  router.push('/');
};
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
