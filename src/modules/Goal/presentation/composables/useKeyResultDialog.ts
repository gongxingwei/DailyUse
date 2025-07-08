import { ref, computed } from 'vue';
import { createGoalDomainApplicationService } from '../../application/services/goalDomainApplicationService';
import { KeyResultForm } from '../../domain/entities/keyResultForm';
import type { IKeyResult } from '../../domain/types/goal';

/**
 * 关键结果对话框组合式函数 - 使用临时对象模式
 * 处理关键结果的创建和编辑操作
 */
export function useKeyResultDialog() {
    // 使用新的架构组件
    const goalService = createGoalDomainApplicationService();
    
    // 对话框状态
    const showDialog = ref(false);
    const isEditing = ref(false);
    const editingKeyResultId = ref<string>('');
    const currentGoalId = ref<string>('');
    const loading = ref(false);
    
    // 表单临时对象
    const keyResultForm = ref<KeyResultForm>(new KeyResultForm());
    
    // 错误状态
    const errors = ref<Record<string, string>>({});
    
    // 计算属性
    const dialogTitle = computed(() => {
        return isEditing.value ? '编辑关键结果' : '添加关键结果';
    });
    
    const isFormValid = computed(() => {
        return keyResultForm.value.isValid();
    });
    
    // 双向绑定的计算属性
    const name = computed({
        get: () => keyResultForm.value.name,
        set: (value: string) => {
            keyResultForm.value.name = value;
            // 清除相关错误
            const newErrors = { ...errors.value };
            delete newErrors.name;
            errors.value = newErrors;
        }
    });
    
    const startValue = computed({
        get: () => keyResultForm.value.startValue,
        set: (value: number) => {
            keyResultForm.value.startValue = value;
            // 清除相关错误
            const newErrors = { ...errors.value };
            delete newErrors.startValue;
            delete newErrors.targetValue; // 起始值变化可能影响目标值验证
            errors.value = newErrors;
        }
    });
    
    const targetValue = computed({
        get: () => keyResultForm.value.targetValue,
        set: (value: number) => {
            keyResultForm.value.targetValue = value;
            // 清除相关错误
            const newErrors = { ...errors.value };
            delete newErrors.targetValue;
            errors.value = newErrors;
        }
    });
    
    const currentValue = computed({
        get: () => keyResultForm.value.currentValue,
        set: (value: number) => {
            keyResultForm.value.currentValue = value;
        }
    });
    
    const calculationMethod = computed({
        get: () => keyResultForm.value.calculationMethod,
        set: (value: 'sum' | 'average' | 'max' | 'min' | 'custom') => {
            keyResultForm.value.calculationMethod = value;
        }
    });
    
    const weight = computed({
        get: () => keyResultForm.value.weight,
        set: (value: number) => {
            keyResultForm.value.weight = value;
            // 清除相关错误
            const newErrors = { ...errors.value };
            delete newErrors.weight;
            errors.value = newErrors;
        }
    });
    
    const progressPercentage = computed(() => {
        return keyResultForm.value.progressPercentage;
    });
    
    // 表单验证
    const validateForm = (): boolean => {
        const validationErrors = keyResultForm.value.getValidationErrors();
        errors.value = validationErrors;
        return Object.keys(validationErrors).length === 0;
    };
    
    // 重置表单
    const resetForm = () => {
        keyResultForm.value = new KeyResultForm();
        errors.value = {};
        isEditing.value = false;
        editingKeyResultId.value = '';
    };
    
    // 开始创建关键结果
    const startCreateKeyResult = (goalId: string) => {
        resetForm();
        currentGoalId.value = goalId;
        showDialog.value = true;
    };
    
    // 开始编辑关键结果
    const startEditKeyResult = (goalId: string, keyResult: IKeyResult) => {
        resetForm();
        isEditing.value = true;
        editingKeyResultId.value = keyResult.id;
        currentGoalId.value = goalId;
        
        // 从已有关键结果初始化表单
        keyResultForm.value = new KeyResultForm(keyResult);
        
        showDialog.value = true;
    };
    
    // 保存关键结果
    const saveKeyResult = async (goalId: string, keyResult?: IKeyResult): Promise<boolean> => {
        if (!validateForm()) {
            return false;
        }
        
        loading.value = true;
        
        try {
            if (keyResult) {
                // 编辑现有关键结果
                const updateData = keyResultForm.value.toCreateDTO();
                
                const result = await goalService.updateKeyResultOfGoal(
                    goalId,
                    keyResult.id,
                    updateData
                );
                
                if (result.success) {
                    console.log('✅ 关键结果更新成功:', keyResult.id);
                    showDialog.value = false;
                    resetForm();
                    return true;
                } else {
                    console.error('❌ 关键结果更新失败:', result.message);
                    errors.value.submit = result.message || '更新失败';
                    return false;
                }
            } else {
                // 创建新关键结果
                const result = await goalService.addKeyResultToGoal(goalId, keyResultForm.value.toCreateDTO());
                
                if (result.success) {
                    console.log('✅ 关键结果创建成功:', result.data?.keyResultId);
                    showDialog.value = false;
                    resetForm();
                    return true;
                } else {
                    console.error('❌ 关键结果创建失败:', result.message);
                    errors.value.submit = result.message || '创建失败';
                    return false;
                }
            }
        } catch (error) {
            console.error('❌ 保存关键结果时发生错误:', error);
            errors.value.submit = '保存失败，请重试';
            return false;
        } finally {
            loading.value = false;
        }
    };
    
    // 取消操作
    const cancelKeyResultEdit = () => {
        showDialog.value = false;
        resetForm();
    };
    
    // 删除关键结果
    const deleteKeyResult = async (goalId: string, keyResultId: string): Promise<boolean> => {
        loading.value = true;
        
        try {
            const result = await goalService.removeKeyResultFromGoal(goalId, keyResultId);
            
            if (result.success) {
                console.log('✅ 关键结果删除成功:', keyResultId);
                return true;
            } else {
                console.error('❌ 关键结果删除失败:', result.message);
                return false;
            }
        } catch (error) {
            console.error('❌ 删除关键结果时发生错误:', error);
            return false;
        } finally {
            loading.value = false;
        }
    };
    
    return {
        // 对话框状态
        showDialog,
        isEditing,
        loading,
        dialogTitle,
        
        // 表单数据 - 使用计算属性进行双向绑定
        name,
        startValue,
        targetValue,
        currentValue,
        calculationMethod,
        weight,
        progressPercentage,
        
        // 表单状态
        keyResultForm,
        errors,
        isFormValid,
        
        // 操作方法
        startCreateKeyResult,
        startEditKeyResult,
        saveKeyResult,
        cancelKeyResultEdit,
        deleteKeyResult,
        resetForm,
        validateForm,
        
        // 服务访问
        goalService
    };
}
