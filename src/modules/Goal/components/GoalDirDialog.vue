<template>
    <v-dialog v-model="props.modelValue" max-width="400">
        <v-card>
            <v-card-title class="pa-4">
                <v-icon size="24" class="mr-2">mdi-folder-plus</v-icon>
                {{ tempDir.id === 'temp' ? '创建目标节点' : '编辑目标节点' }}
            </v-card-title>

            <v-card-text class="pa-4">
                <v-text-field v-model="tempDir.name" label="节点名称" variant="outlined" density="compact"
                    :rules="[v => !!v || '名称不能为空']" @keyup.enter="handleSave"></v-text-field>

                <v-select v-model="tempDir.icon" :items="iconOptions" label="选择图标" variant="outlined" density="compact"
                    item-title="text" item-value="value">
                    <template v-slot:item="{ props, item }">
                        <v-list-item v-bind="props">
                            <template v-slot:prepend>
                                <v-icon>{{ item.raw.value }}</v-icon>
                            </template>
                            <v-list-item-title>{{ item.raw.text }}</v-list-item-title>
                        </v-list-item>
                    </template>
                </v-select>
            </v-card-text>

            <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn variant="outlined" @click="handleCancel">取消</v-btn>
                <v-btn color="primary" class="ml-2" @click="handleSave" :disabled="!tempDir.name">
                    确定
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useGoalDirStore } from '../stores/goalDirStore';
import { storeToRefs } from 'pinia';
const { tempDir } = storeToRefs(useGoalDirStore());

const props = defineProps<{
    modelValue: boolean;
}>();

const emit = defineEmits<{
    (e: 'save'): void;
    (e: 'cancel'): void;
}>();

const iconOptions = [
    { text: '文件夹', value: 'mdi-folder' },
    { text: '目标', value: 'mdi-target' },
    { text: '学习', value: 'mdi-school' },
    { text: '工作', value: 'mdi-briefcase' },
    { text: '生活', value: 'mdi-home' },
    { text: '健康', value: 'mdi-heart' },
];

const handleSave = () => {
    emit('save');
};
const handleCancel = () => {
    emit('cancel');
};
</script>