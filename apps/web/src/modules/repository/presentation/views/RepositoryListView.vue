<!-- Repository List View -->
<template>
    <v-container fluid>
        <h1 class="text-h4 mb-4">
            <v-icon class="mr-2">mdi-source-repository</v-icon>仓储管理
        </h1>
        <v-card>
            <v-card-title>
                <div class="d-flex justify-space-between align-center w-100">
                    <span>仓储列表</span>
                    <v-btn color="primary" @click="$router.push('/repositories/create')">
                        <v-icon class="mr-2">mdi-plus</v-icon>添加仓储
                    </v-btn>
                </div>
            </v-card-title>
            <v-card-text>
                <p class="text-center text-medium-emphasis py-8">仓储管理功能开发中...</p>
            </v-card-text>
        </v-card>
    </v-container>
</template>
