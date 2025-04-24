<template>
    <v-container>
        <v-row class="d-flex justify-space-between align-center ">
            <v-col cols="4">
                {{ record.value }}
            </v-col>
            <v-col cols="4">
                {{ record.date || 'error' }}
            </v-col>
        </v-row>
    </v-container>
</template>
<script setup lang="ts">
import { IRecord } from '../types/goal';

defineProps<{
    record: IRecord;
}>();
</script>