<!-- Reminder Detail View -->
<template><v-container fluid>
        <h1 class="text-h4 mb-4">提醒详情 - {{ $route.params.id }}</h1><v-card><v-card-text>
                <p class="text-center py-8">提醒详情功能开发中...</p>
            </v-card-text><v-card-actions><v-btn @click="$router.back()">返回</v-btn><v-btn color="primary"
                    @click="$router.push(`/reminders/${$route.params.id}/edit`)">编辑</v-btn></v-card-actions></v-card>
    </v-container></template>
