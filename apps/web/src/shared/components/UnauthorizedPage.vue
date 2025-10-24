<!--
  Unauthorized Page Component
  无权限访问页面
-->
<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-card-title class="text-center pa-6">
            <v-icon color="warning" size="64" class="mb-4"> mdi-shield-alert </v-icon>
            <h2 class="text-h5">无权限访问</h2>
          </v-card-title>

          <v-card-text class="text-center">
            <p class="text-body-1 mb-4">抱歉，您没有权限访问此页面。</p>

            <v-chip v-if="requiredPermissions" color="warning" variant="outlined" class="mb-4">
              需要权限: {{ requiredPermissions }}
            </v-chip>

            <p class="text-body-2 text-medium-emphasis">如果您认为这是一个错误，请联系管理员。</p>
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
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// 从查询参数获取所需权限
const requiredPermissions = computed(() => {
  const required = route.query.required as string;
  return required ? required.split(',').join(', ') : '';
});

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
