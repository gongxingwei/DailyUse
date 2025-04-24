<template>
    <v-dialog v-model="props.visible" width="500">
        <v-card>
            <v-card-title class="d-flex justify-space-between pa-4">
                <v-btn variant="text" @click="handleCancel">取消</v-btn>
                <span class="text-h5">添加记录</span>
                <v-btn color="primary" @click="handleSave" :disabled="!isValid">保存</v-btn>
            </v-card-title>

            <v-card-text>
                <v-form>
                    <v-text-field v-model.number="record.value" label="增加值" type="number" :error-messages="errors.value"
                        @blur="validateValue" hide-details="auto" class="mb-4" />
                    <!-- 日期时间显示 -->
                    <v-row>
                        <v-col cols="12">
                            <v-text-field v-model="record.date" label="记录时间" readonly hide-details="auto"
                                class="mb-4" prepend-icon="mdi-clock-outline" />
                        </v-col>
                    </v-row>
                    <v-textarea v-model="record.note" label="备注" rows="3" hide-details="auto" class="mb-4" />
                </v-form>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue';
import type { IRecordCreate } from '../types/goal';
// utils
import { formatDateWithTemplate } from '@/shared/utils/dateUtils';

const props = defineProps<{
    visible: boolean;
}>();

const emit = defineEmits<{
    (e: 'save', record: IRecordCreate): void;
    (e: 'cancel'): void;
}>();

const initalizeRecord = () => {
    return {
        value: 1,
        date: formatDateWithTemplate(new Date(), 'YYYY-MM-DD HH:mm'),
        note: ''
    };
};
const initialRecord = initalizeRecord();
const record = reactive<IRecordCreate>({ ...initialRecord });

const errors = reactive({
    value: ''
});

const validateValue = () => {
    if (!record.value || record.value <= 0) {
        errors.value = '增加值必须大于0';
        return false;
    }
    errors.value = '';
    return true;
};

const isValid = computed(() => {
    return !errors.value && record.value > 0;
});

const handleSave = () => {
    if (validateValue()) {
        emit('save', { ...record });
    }
};

const handleCancel = () => {
    emit('cancel');
};

// 监听对话框的显示状态，重置表单
watch(() => props.visible, (newValue) => {
    if (newValue) {
        initalizeRecord();
        record.value = initialRecord.value;
    } else {
        // 对话框关闭时，重置表单
        Object.assign(record, initialRecord);
        errors.value = '';
    }
});
</script>