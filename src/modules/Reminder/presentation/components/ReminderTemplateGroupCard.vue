<template>
    <v-dialog v-bind:model-value="show" width="400" persistent>
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" color="primary">mdi-folder</v-icon>
                <span>{{ name }}</span>
                <v-spacer />
                <v-switch v-model="enableMode" :label="enableMode ? '整组控制' : '个体控制'" inset hide-details color="primary"
                    class="mr-2" />
                <v-switch v-model="enabled" :label="enabled ? '启用' : '禁用'" :disabled="!enableMode" inset hide-details
                    color="primary" />
            </v-card-title>
            <v-card-text class="scroll-area">
                <reminder-grid :items="templates" :grid-size="100" />
            </v-card-text>
            <v-card-actions>
                <v-btn color="primary" @click="handleBack">返回</v-btn>
            </v-card-actions>
        </v-card>

    </v-dialog>
</template>

<script setup lang="ts">
import { ReminderTemplateGroup } from "../../domain/aggregates/reminderTemplateGroup";
import { ref, computed, watch, inject } from "vue";
// components

import ReminderGrid from "./grid/ReminderGrid.vue";

const props = defineProps<{
    show: boolean;
    templateGroup: ReminderTemplateGroup | null;
}>();

const onSetGroupEnabled = inject<((uuid: string, enabled: boolean) => void) | undefined>('onSetGroupEnabled');
const onSetGroupEnableMode = inject<((uuid: string, mode: 'group' | 'individual') => void) | undefined>('onSetGroupEnableMode');

const emit = defineEmits<{
    (e: 'back'): void;

}>();

const name = computed({
    get: () => props.templateGroup?.name ?? '',
    set: (val) => {
        if (props.templateGroup) {
            props.templateGroup.name = val;
        }
    }
});

const enableMode = computed({
    get: () => {
        return props.templateGroup?.enableMode === 'group' ? true : false;
    },
    set: (val) => {
        if (props.templateGroup) {
            onSetGroupEnableMode?.(props.templateGroup.uuid, val ? 'group' : 'individual');
            props.templateGroup.enableMode = val ? 'group' : 'individual';
        }
    }
})

const enabled = computed({
    get: () => props.templateGroup?.enabled ?? false,
    set: (val) => {
        if (props.templateGroup) {
            onSetGroupEnabled?.(props.templateGroup.uuid, val);
            props.templateGroup.enabled = val;
        }
    }
});

const templates = computed(() => {
    return props.templateGroup?.templates || [];
});


const handleBack = () => {
    emit('back');
};

</script>

<style scoped>
.scroll-area {
  flex: 1 1 auto;
  overflow: auto;
  min-height: 0; /* 防止内容撑开父容器 */
}
</style>