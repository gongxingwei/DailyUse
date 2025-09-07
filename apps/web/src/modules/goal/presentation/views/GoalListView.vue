<!--
  Goal List View
  目标列表页面
-->
<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12">
                <h1 class="text-h4 mb-4">
                    <v-icon class="mr-2">mdi-target</v-icon>
                    目标管理
                </h1>

                <v-card>
                    <v-card-title>
                        <div class="d-flex justify-space-between align-center w-100">
                            <span>目标列表</span>
                            <v-btn color="primary" @click="$router.push('/goals/create')">
                                <v-icon class="mr-2">mdi-plus</v-icon>
                                创建目标
                            </v-btn>
                        </div>
                    </v-card-title>

                    <v-card-text>
                        <p class="text-center text-medium-emphasis py-8">
                            目标管理功能开发中...
                        </p>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
// Goal list implementation here
</script>
