<template>
    <div class="modal-overlay" v-if="visible">
        <div class="modal-container">
            <div class="modal-header">

                <button class="btn btn-secondary" @click="handleCancel">取消</button>
                <h2>{{ mode === 'create' ? '添加关键结果' : '编辑关键结果' }}</h2>
                <button class="btn btn-primary" @click="handleSave" :disabled="!isValid">保存</button>
            </div>

            <div class="modal-content">

                <!-- 关键结果名称 -->
                <div class="icon-span form-part">
                    <div class="kr-name-icon">
                        <Icon icon="mdi:goal" width="48" height="48" />
                    </div>
                    <div class="form-group kr-name-group">
                        <input type="text" id="kr-name" class="kr-name-input" v-model="tempKeyResult.name"
                            placeholder="例如：完成leetcode题目数量">
                    </div>
                </div>

                <!-- 量化值 -->
                <div class="form-part">
                    <h3>进度量化</h3>
                    <div>
                        <div class="kr-start-group">
                            <label for="kr-start">起始值</label>
                            <span class="error-message" v-if="errors.startValue">{{ errors.startValue }}</span>
                            <input type="number" id="kr-start" v-model.number="tempKeyResult.startValue"
                                @blur="validateStartValue" :class="{ 'invalid': errors.startValue }">

                        </div>
                    </div>
                    <div>
                        <div class="kr-target-group">
                            <label for="kr-target">目标值</label>
                            <span class="error-message" v-if="errors.targetValue">{{
                                    errors.targetValue }}</span>
                            <input type="number" id="kr-target" v-model.number="tempKeyResult.targetValue"
                                @blur="validateTargetValue" :class="{ 'invalid': errors.targetValue }">

                        </div>
                    </div>
                </div>

                <!-- 计算方式 -->
                <div class="form-part">
                    <div class="kr-calculation-group">
                        <label for="kr-calc">计算方式</label>
                        <select id="kr-calc" v-model="tempKeyResult.calculationMethod">
                            <option value="sum">求和</option>
                            <option value="average">平均值</option>
                            <option value="max">最大值</option>
                            <option value="min">最小值</option>
                            <option value="custom">自定义</option>
                        </select>
                    </div>

                </div>

                <div class="form-group">
                    <label for="kr-weight">权重 (0-10)</label>
                    <input type="number" id="kr-weight" v-model.number="tempKeyResult.weight" min="0" max="10"
                        @blur="validateWeight" :class="{ 'invalid': errors.weight }">
                    <span class="error-message" v-if="errors.weight">{{ errors.weight }}</span>
                </div>

                <!-- 备忘 -->
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue';
import { useGoalStore } from '../stores/goalStore';

const goalStore = useGoalStore();

const props = withDefaults(defineProps<{
    visible: boolean;
    goalId: string;
    keyResultId: string;  
    mode: 'create' | 'edit';
}>(), {
    keyResultId: 'temp'  
});

const emit = defineEmits<{
    (e: 'save'): void;
    (e: 'cancel'): void;
}>();



watch(
    () => props.visible,
    (newVal) => {
        if (newVal) {
            if (props.keyResultId === 'temp') {
                goalStore.initTempKeyResult();
            } else {
                goalStore.initTempKeyResultByKeyResultId(props.goalId, props.keyResultId);
            }
        }
    },
    { immediate: true }
)
const tempKeyResult = computed(() => {
    return goalStore.tempKeyResult;
});

// 表单合法性检验
const errors = reactive({
    name: '',
    startValue: '',
    targetValue: '',
    weight: ''
});
const validateName = () => {
    if (!tempKeyResult.value.name.trim()) {
        errors.name = '不能为空';
    } else {
        errors.name = '';
    }
};
const validateStartValue = () => {
    if (tempKeyResult.value.startValue === undefined) {
        errors.startValue = '请输入起始值';
    } else if (tempKeyResult.value.startValue < 0) {
        errors.startValue = '起始值不能小于0';
    } else {
        errors.startValue = '';
    }
};
const validateTargetValue = () => {
    if (tempKeyResult.value.targetValue === undefined) {
        errors.targetValue = '请输入目标值';
    } else if (tempKeyResult.value.targetValue <= tempKeyResult.value.startValue) {
        errors.targetValue = '目标值必须大于起始值';
    } else {
        errors.targetValue = '';
    }
};
const validateWeight = () => {
    if (tempKeyResult.value.weight === undefined) {
        errors.weight = '请输入权重';
    } else if (tempKeyResult.value.weight < 0 || tempKeyResult.value.weight > 10) {
        errors.weight = '权重必须在0-10之间';
    } else {
        errors.weight = '';
    }
};
const validateAll = () => {
    validateName();
    validateStartValue();
    validateTargetValue();
    validateWeight();
};
const isValid = computed(() => {
    return !Object.values(errors).some(error => error) &&
        tempKeyResult.value.name.trim() !== '' &&
        tempKeyResult.value.startValue !== undefined &&
        tempKeyResult.value.targetValue !== undefined &&
        tempKeyResult.value.weight !== undefined;
});


// 传回数据并关闭窗口
const handleSave = () => {
    validateAll();
    if (isValid.value) {
        emit('save')
        emit('cancel');
    }
};

const handleCancel = () => {
    emit('cancel');
};
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-container {
    background-color: rgb(41, 41, 41);
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    height: 500px;

    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    overflow: hidden;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    flex-shrink: 0;
}

.modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
}

.modal-content {
    display: flex;
    flex-direction: column;
    padding: 16px 24px;
    flex-grow: 1;
    overflow-y: auto;
}

.form-part {
    margin-bottom: 1rem;
}

.kr-name-icon {
    background-color: rgb(70, 66, 62);
}

.kr-name-group {
    width: 100%;
    display: flex;
    gap: 16px;
    align-items: flex-end;
    /* Changed from center to flex-start */
}

.kr-name-span {
    margin-left: 8px;
    font-size: 12px;
    color: #ff4444;
    bottom: 0;
}

.kr-name-input {
    width: 100%;
    height: 48px;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
    transition: border-color 0.2s;
}

.kr-start-group {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    gap: 8px;
}

#kr-start {
    width: 5rem;
}

.kr-target-group {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    gap: 8px;
}

#kr-target {
    width: 5rem;
}

.kr-calculation-group {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    gap: 8px;
}

.invalid {
    border-color: #ff4444 !important;
}

.error-message {
    color: #ff4444;
    font-size: 12px;
    margin-top: 4px;
    display: block;
}
</style>