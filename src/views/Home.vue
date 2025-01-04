<template>
    <v-navigation-drawer :width="240" permanent>
        <v-container>
            <v-row align="center">
                <v-col>My Repos</v-col>
                <v-col><v-btn color="#4CAF50" prepend-icon="mdi-plus" @click="showCreateDialog = true">New</v-btn></v-col>
            </v-row>
        </v-container>
        <v-list align="left">
            <v-list-item 
                v-for="repo in repoStore.repos"
                :key="repo.title"
                :title="repo.title"
                :to="`/repo/${encodeURIComponent(repo.title)}`"
            >
                {{ repo.title }}
            </v-list-item>
        </v-list>
        <CreateRepo v-model="showCreateDialog" />
    </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRepoStore } from '../stores/repo'
import CreateRepo from '../components/goals/CreateRepo.vue'

const repoStore = useRepoStore()
const showCreateDialog = ref(false)
</script>

