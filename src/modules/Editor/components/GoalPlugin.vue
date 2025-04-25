<template>
    <v-card class="goal-plugin pa-4" variant="flat">
        <!-- 标题部分 -->
        <div class="d-flex align-center mb-4">
            <v-icon icon="mdi-flag" class="mr-2" />
            <span class="text-h6">关联目标</span>
        </div>

        <!-- 目标信息 -->
        <template v-if="associatedGoal">
            <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-h6">
                    {{ associatedGoal.title }}
                </v-card-title>

                <!-- 备注 -->
                <v-card-text v-if="associatedGoal.note">
                    <div class="subtitle-1 mb-2">备注</div>
                    <p>{{ associatedGoal.note }}</p>
                </v-card-text>

                <!-- 动机 -->
                <v-card-text v-if="associatedGoal.motive">
                    <div class="subtitle-1 mb-2">动机</div>
                    <p>{{ associatedGoal.motive }}</p>
                </v-card-text>

                <!-- 可行性分析 -->
                <v-card-text v-if="associatedGoal.feasibility">
                    <div class="subtitle-1 mb-2">可行性分析</div>
                    <p>{{ associatedGoal.feasibility }}</p>
                </v-card-text>
            </v-card>
        </template>

        <!-- 无关联目标时显示 -->
        <v-card v-else variant="outlined" class="d-flex align-center justify-center pa-4">
            <span class="text-medium-emphasis">暂无关联目标</span>
        </v-card>
    </v-card>
</template>

<script setup lang="ts">
// vue-router
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useGoalStore } from '@/modules/Goal/stores/goalStore'
import { useRepositoryStore } from '@/modules/Repository/stores/repositoryStore'

const route = useRoute()
// 获取仓库ID
const repoTitle = route.params.title as string

const goalStore = useGoalStore()
const repositoryStore = useRepositoryStore()


const repo = computed(() => {
    const repo = repositoryStore.getRepositoryByTitle(repoTitle)
    if (!repo) {
        throw new Error('Repository not found')
    }
    return repo;
})

// 获取关联的目标信息
const associatedGoal = computed(() => {
    const relativeGoal = repo.value.relativeGoalId;
    if (!relativeGoal) {
        return null
    }
    const goal = goalStore.getGoalById(relativeGoal)
    if (!goal) {
        throw new Error('Goal not found')
    }
    return goal
})
</script>

<style scoped>
.goal-plugin {
    max-width: 100%;
    background-color: transparent;
}

.subtitle-1 {
    color: rgba(var(--v-theme-on-surface), 0.7);
    font-weight: 500;
}
</style>