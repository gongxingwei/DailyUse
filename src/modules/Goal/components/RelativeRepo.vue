<script setup lang="ts">
import { computed } from 'vue'
import { useRepositoryStore } from '@/modules/Repository/repositoryStore'
import { useGoalStore } from '../goalStore'
import { useI18n } from 'vue-i18n'
import type { Repository } from '@/modules/Repository/repositoryStore'

const props = defineProps<{
    modelValue: boolean,
    goalId: number
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const { t } = useI18n()
const repositoryStore = useRepositoryStore()
const goalStore = useGoalStore()
const goal = computed(() => goalStore.getGoalById(props.goalId))

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

// 计算未关联的仓库列表
const unrelatedRepos = computed(() => {
    return repositoryStore.repositories.filter(repo =>
        !goal.value?.relativeRepositories?.some(r => r.title === repo.title)
    )
})

// 计算已关联的仓库列表
const relatedRepos = computed(() => {
    return goal.value?.relativeRepositories || []
})

// 添加关联仓库
const addRepository = (repo: Repository) => {
    if (!goal.value) return
    goalStore.addRepositoryToGoal(goal.value.id, repo)
}

// 移除关联仓库
const removeRepository = (repo: Repository) => {
    if (!goal.value) return
    goalStore.removeRepositoryFromGoal(goal.value.id, repo.title)
}
</script>

<template>
    <v-dialog v-model="dialogVisible" max-width="900px">
        <v-card>
            <v-card-title class="text-h5 pa-4">
                {{ t('goal.8') }} - {{ goal?.name }}
            </v-card-title>

            <v-card-text>
                <v-row>
                    <!-- 左侧：未关联仓库列表 -->
                    <v-col cols="6">
                        <div class="text-subtitle-1 mb-3">{{ t('common.21') }}</div>
                        <v-list density="compact" border>
                            <v-list-item v-for="repo in unrelatedRepos" :key="repo.title" :title="repo.title"
                                @click="addRepository(repo)" class="cursor-pointer">
                                <template v-slot:prepend>
                                    <v-icon color="primary">mdi-database</v-icon>
                                </template>
                                <template v-slot:append>
                                    <v-icon color="success">mdi-plus</v-icon>
                                </template>
                            </v-list-item>
                            <v-list-item v-if="unrelatedRepos.length === 0" density="compact">
                                <v-list-item-title class="text-medium-emphasis">
                                    {{ t('common.10') }}
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-col>

                    <!-- 右侧：已关联仓库列表 -->
                    <v-col cols="6">
                        <div class="text-subtitle-1 mb-3">{{ t('common.22') }}</div>
                        <v-list density="compact" border>
                            <v-list-item v-for="repo in relatedRepos" :key="repo.title" :title="repo.title"
                                @click="removeRepository(repo)" class="cursor-pointer">
                                <template v-slot:prepend>
                                    <v-icon color="success">mdi-database</v-icon>
                                </template>
                                <template v-slot:append>
                                    <v-icon color="error">mdi-minus</v-icon>
                                </template>
                            </v-list-item>
                            <v-list-item v-if="relatedRepos.length === 0" density="compact">
                                <v-list-item-title class="text-medium-emphasis">
                                    {{ t('common.10') }}
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="$emit('update:modelValue', false)">
                    {{ t('common.1') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.cursor-pointer {
    cursor: pointer;
}

.cursor-pointer:hover {
    background-color: rgba(var(--v-theme-primary), 0.05);
}
</style>