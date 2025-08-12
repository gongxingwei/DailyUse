<template>
    <v-snackbar :model-value="snackbar.show" @update:model-value="$emit('update:show', $event)" :color="snackbar.color"
        :timeout="snackbar.timeout" :location="location" :variant="variant" :elevation="elevation">
        <div class="d-flex align-center">
            <v-icon v-if="showIcon" :icon="iconName" class="me-2" />
            {{ snackbar.message }}
        </div>

        <template v-slot:actions v-if="showCloseButton">
            <v-btn variant="text" @click="$emit('update:show', false)" size="small">
                关闭
            </v-btn>
        </template>
    </v-snackbar>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SnackbarOptions } from '../../types';

interface Props {
    snackbar: SnackbarOptions;
    location?: 'top' | 'bottom' | 'left' | 'right';
    variant?: 'flat' | 'elevated' | 'tonal' | 'outlined' | 'text' | 'plain';
    elevation?: string | number;
    showIcon?: boolean;
    showCloseButton?: boolean;
}

interface Emits {
    (e: 'update:show', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
    location: 'top',
    variant: 'tonal',
    elevation: 4,
    showIcon: true,
    showCloseButton: false
});

defineEmits<Emits>();

const iconName = computed(() => {
    switch (props.snackbar.color) {
        case 'success':
            return 'mdi-check-circle';
        case 'error':
            return 'mdi-alert-circle';
        case 'warning':
            return 'mdi-alert';
        case 'info':
        default:
            return 'mdi-information';
    }
});
</script>
