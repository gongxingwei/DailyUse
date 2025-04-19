<template>

    <v-container class="recent-repo" fluid>
        <div class="text-h6 font-weight-light">最近打开仓库</div>
        <v-row>
            <v-col v-for="repository in getRecentRepositories" :key="repository?.title || ''" cols="12" md="3">
                <RepoInfoCard v-if="repository" :repository="repository" />
            </v-col>

            <v-col v-if="getRecentRepositories.length === 0" cols="12">
                <div class="text-center text-medium-emphasis py-4">
                    <v-icon size="large" color="grey-lighten-1">mdi-folder-open</v-icon>
                    <div class="text-body-2 mt-2">暂无最近访问的仓库</div>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRepositoryStore } from '../stores/repositoryStore'
import type { Repository } from '../stores/repositoryStore'
import RepoInfoCard from '../components/RepoInfoCard.vue'

const repositoryStore = useRepositoryStore()

// 获取最近的仓库
const getRecentRepositories = computed<Repository[]>(() => {
    const repositories = repositoryStore.getRecentRepositories()
    // 过滤掉 undefined 值
    return repositories.filter((repo): repo is Repository => repo !== undefined)
})
</script>

<style scoped>
.recent-repo {
    background-color: rgb(var(--v-theme-surface));
}
</style>