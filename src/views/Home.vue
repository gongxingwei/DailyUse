<template>
    <v-navigation-drawer :width="240" permanent>
        <v-container>
            <v-row align="center">
                <v-col>My Goals</v-col>
                <v-col><v-btn color="#4CAF50" prepend-icon="mdi-plus" id="addGoal">New</v-btn></v-col>
            </v-row>
        </v-container>
        <v-list align="left">
            <v-list-item 
                v-for="goal in goalStore.goals" 
                :key="goal.id"
                :title="goal.title" 
                :to="`/goal/${goal.id}/maindoc`"
            >
                {{ goal.title }}
            </v-list-item>
        </v-list>
    </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useGoalStore } from '../stores/goal'

const goalStore = useGoalStore()
</script>

