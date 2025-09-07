<!--
  Task List View
  任务列表页面
-->
<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12">
                <h1 class="text-h4 mb-4">
                    <v-icon class="mr-2">mdi-check-circle</v-icon>
                    任务管理
                </h1>

                <v-card>
                    <v-card-title>
                        <div class="d-flex justify-space-between align-center w-100">
                            <span>任务列表</span>
                            <v-btn color="primary" @click="$router.push('/tasks/create')">
                                <v-icon class="mr-2">mdi-plus</v-icon>
                                创建任务
                            </v-btn>
                        </div>
                    </v-card-title>

                    <v-card-text>
                        <p class="text-center text-medium-emphasis py-8">
                            任务管理功能开发中...
                        </p>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
// Task list implementation here
</script>
