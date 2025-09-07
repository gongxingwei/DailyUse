<!--
  Goal Edit View
  编辑目标页面
-->
<template>
    <v-container fluid>
        <h1 class="text-h4 mb-4">编辑目标 - {{ $route.params.id }}</h1>
        <v-card>
            <v-card-text>
                <p class="text-center py-8">目标编辑功能开发中...</p>
            </v-card-text>
            <v-card-actions>
                <v-btn @click="$router.back()">取消</v-btn>
                <v-btn color="primary">保存</v-btn>
            </v-card-actions>
        </v-card>
    </v-container>
</template>
