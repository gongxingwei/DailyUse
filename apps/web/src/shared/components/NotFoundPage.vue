<!--
  Not Found Page Component
  404页面
-->
<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-card-title class="text-center pa-6">
            <v-icon color="info" size="64" class="mb-4"> mdi-compass-off </v-icon>
            <h1 class="text-h4 mb-2">404</h1>
            <h2 class="text-h6">页面不存在</h2>
          </v-card-title>

          <v-card-text class="text-center">
            <p class="text-body-1 mb-4">抱歉，您访问的页面不存在或已被移除。</p>

            <v-chip color="info" variant="outlined" class="mb-4">
              {{ route.path }}
            </v-chip>

            <p class="text-body-2 text-medium-emphasis">
              请检查URL是否正确，或通过导航菜单访问其他页面。
            </p>
          </v-card-text>

          <v-card-actions class="justify-center pa-6">
            <v-btn color="primary" variant="elevated" @click="goBack"> 返回上一页 </v-btn>

            <v-btn color="secondary" variant="outlined" @click="goHome"> 回到首页 </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
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
