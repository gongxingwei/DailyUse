<!-- Reminder List View -->
<template>
    <v-container fluid>
        <h1 class="text-h4 mb-4"><v-icon class="mr-2">mdi-bell</v-icon>提醒管理</h1>
        <v-card>
            <v-card-title>
                <div class="d-flex justify-space-between align-center w-100">
                    <span>提醒列表</span>
                    <v-btn color="primary" @click="$router.push('/reminders/create')">
                        <v-icon class="mr-2">mdi-plus</v-icon>创建提醒
                    </v-btn>
                </div>
            </v-card-title>
            <v-card-text>
                <p class="text-center text-medium-emphasis py-8">提醒管理功能开发中...</p>
            </v-card-text>
        </v-card>
    </v-container>
</template>
