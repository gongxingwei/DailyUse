<template>
    <v-dialog v-bind:model-value="show" width="400" persistent>
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" color="primary">mdi-folder</v-icon>
                <span>{{ name }}</span>
                <v-spacer />
                <v-switch v-model="enableMode" :label="enableMode ? '整组控制' : '个体控制'" inset hide-details color="primary"
                    class="mr-2" />
                <v-switch v-model="enabled" :label="enabled ? '启用' : '禁用'" :disabled="!enableMode" inset hide-details color="primary"
                    />
            </v-card-title>
            <v-card-text>
                <reminder-grid-for-group :items="templates"
                    :grid-size="80" />
            </v-card-text>
            <v-card-actions>
                <v-btn color="primary" @click="handleBack">返回</v-btn>
            </v-card-actions>
        </v-card>

    </v-dialog>
</template>

<script setup lang="ts">
import { ReminderTemplateGroup } from "../../domain/aggregates/reminderTemplateGroup";
import type { ReminderTemplate } from "../../domain/aggregates/reminderTemplate";
import type { IReminderTemplateGroup } from "@electron/modules/Reminder";
import { ref, computed, watch } from "vue";
// components
import ReminderGridForGroup from './grid/ReminderGridForGroup.vue';

const props = defineProps<{
    show: boolean;
    templateGroup: ReminderTemplateGroup | null;
}>();

    const emit = defineEmits<{
        (e: 'back'): void;
    (e: 'click-template', template: ReminderTemplate): void;
}>();

const expanded = ref(false);
const editing = ref(false);

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
            props.templateGroup.enableMode = val ? 'group' : 'individual';
        }
    }
})

const enabled = computed({
    get: () => props.templateGroup?.enabled ?? false,
    set: (val) => {
        if (props.templateGroup) {
            props.templateGroup.enabled = val;
        }
    }
});

const templates = computed(() => {
    return props.templateGroup?.templates || [];
});


const toggleExpand = () => {
    expanded.value = !expanded.value;
};
const toggleEdit = () => {
    if (editing.value) {
        // 保存逻辑，可 emit('update', localTemplate.value) 或调用 API
    }
    editing.value = !editing.value;
};
const toggleEnabled = () => {


    // 可 emit('update', localTemplate.value) 或调用 API
    // emit('update', localTemplate.value);
};

const getImportanceText = (level: string) => {
    switch (level) {
        case "critical": return "重要";
        case "low": return "低";
        default: return "普通";
    }
};
const getImportanceColor = (level: string) => {
    switch (level) {
        case "critical": return "error";
        case "low": return "success";
        default: return "info";
    }
};

const handleBack = () => {
    emit('back');
};

const handleClickTemplate = (template: ReminderTemplate) => {
    emit('click-template', template);
};
</script>