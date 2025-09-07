<!--
  Dashboard View
  仪表盘页面
-->
<template>
    <v-container fluid>
        <!-- 页面标题 -->
        <v-row>
            <v-col cols="12">
                <h1 class="text-h4 mb-4">
                    <v-icon class="mr-2">mdi-view-dashboard</v-icon>
                    仪表盘
                </h1>
            </v-col>
        </v-row>

        <!-- 快速统计卡片 -->
        <v-row>
            <v-col cols="12" sm="6" md="3">
                <v-card color="primary" dark>
                    <v-card-text>
                        <div class="d-flex justify-space-between">
                            <div>
                                <h3 class="text-h5">{{ stats.tasks || 0 }}</h3>
                                <p class="text-body-2">任务总数</p>
                            </div>
                            <v-icon size="40">mdi-check-circle</v-icon>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="3">
                <v-card color="success" dark>
                    <v-card-text>
                        <div class="d-flex justify-space-between">
                            <div>
                                <h3 class="text-h5">{{ stats.goals || 0 }}</h3>
                                <p class="text-body-2">目标总数</p>
                            </div>
                            <v-icon size="40">mdi-target</v-icon>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="3">
                <v-card color="warning" dark>
                    <v-card-text>
                        <div class="d-flex justify-space-between">
                            <div>
                                <h3 class="text-h5">{{ stats.reminders || 0 }}</h3>
                                <p class="text-body-2">提醒总数</p>
                            </div>
                            <v-icon size="40">mdi-bell</v-icon>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="3">
                <v-card color="info" dark>
                    <v-card-text>
                        <div class="d-flex justify-space-between">
                            <div>
                                <h3 class="text-h5">{{ stats.repositories || 0 }}</h3>
                                <p class="text-body-2">仓储总数</p>
                            </div>
                            <v-icon size="40">mdi-source-repository</v-icon>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- 快速操作 -->
        <v-row class="mt-4">
            <v-col cols="12">
                <v-card>
                    <v-card-title>
                        <v-icon class="mr-2">mdi-lightning-bolt</v-icon>
                        快速操作
                    </v-card-title>
                    <v-card-text>
                        <v-row>
                            <v-col cols="12" sm="6" md="3">
                                <v-btn color="primary" block size="large" @click="$router.push('/tasks/create')">
                                    <v-icon class="mr-2">mdi-plus</v-icon>
                                    创建任务
                                </v-btn>
                            </v-col>
                            <v-col cols="12" sm="6" md="3">
                                <v-btn color="success" block size="large" @click="$router.push('/goals/create')">
                                    <v-icon class="mr-2">mdi-plus</v-icon>
                                    创建目标
                                </v-btn>
                            </v-col>
                            <v-col cols="12" sm="6" md="3">
                                <v-btn color="warning" block size="large" @click="$router.push('/reminders/create')">
                                    <v-icon class="mr-2">mdi-plus</v-icon>
                                    创建提醒
                                </v-btn>
                            </v-col>
                            <v-col cols="12" sm="6" md="3">
                                <v-btn color="info" block size="large" @click="$router.push('/repositories/create')">
                                    <v-icon class="mr-2">mdi-plus</v-icon>
                                    添加仓储
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- 最近活动 -->
        <v-row class="mt-4">
            <v-col cols="12" md="8">
                <v-card>
                    <v-card-title>
                        <v-icon class="mr-2">mdi-clock-outline</v-icon>
                        最近活动
                    </v-card-title>
                    <v-card-text>
                        <v-list>
                            <v-list-item v-for="activity in recentActivities" :key="activity.id"
                                :prepend-icon="activity.icon">
                                <v-list-item-title>{{ activity.title }}</v-list-item-title>
                                <v-list-item-subtitle>{{ activity.time }}</v-list-item-subtitle>
                            </v-list-item>

                            <v-list-item v-if="recentActivities.length === 0">
                                <v-list-item-title class="text-center text-medium-emphasis">
                                    暂无最近活动
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="4">
                <v-card>
                    <v-card-title>
                        <v-icon class="mr-2">mdi-calendar-today</v-icon>
                        今日待办
                    </v-card-title>
                    <v-card-text>
                        <v-list>
                            <v-list-item v-for="todo in todayTodos" :key="todo.id">
                                <template #prepend>
                                    <v-checkbox v-model="todo.completed" @change="toggleTodo(todo)" />
                                </template>
                                <v-list-item-title :class="{ 'text-decoration-line-through': todo.completed }">
                                    {{ todo.title }}
                                </v-list-item-title>
                            </v-list-item>

                            <v-list-item v-if="todayTodos.length === 0">
                                <v-list-item-title class="text-center text-medium-emphasis">
                                    今日无待办事项
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 统计数据
const stats = reactive({
    tasks: 0,
    goals: 0,
    reminders: 0,
    repositories: 0
});

// 最近活动
const recentActivities = ref([
    {
        id: 1,
        title: '创建了新任务：完成项目文档',
        time: '2小时前',
        icon: 'mdi-check-circle'
    },
    {
        id: 2,
        title: '更新了目标：学习Vue3',
        time: '4小时前',
        icon: 'mdi-target'
    },
    {
        id: 3,
        title: '设置了提醒：明天的会议',
        time: '1天前',
        icon: 'mdi-bell'
    }
]);

// 今日待办
const todayTodos = ref([
    {
        id: 1,
        title: '检查邮件',
        completed: false
    },
    {
        id: 2,
        title: '完成代码审查',
        completed: true
    },
    {
        id: 3,
        title: '准备周会材料',
        completed: false
    }
]);

// 切换待办状态
const toggleTodo = (todo: any) => {
    console.log('Toggle todo:', todo);
    // TODO: 实现待办状态更新
};

// 加载数据
const loadData = async () => {
    try {
        // TODO: 从API加载实际数据
        stats.tasks = 12;
        stats.goals = 5;
        stats.reminders = 8;
        stats.repositories = 3;
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
};

onMounted(() => {
    loadData();
});
</script>

<style scoped>
.text-decoration-line-through {
    text-decoration: line-through;
}
</style>
