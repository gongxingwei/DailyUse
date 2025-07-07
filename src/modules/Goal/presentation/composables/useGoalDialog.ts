import { ref, computed } from 'vue';
import { createGoalDomainApplicationService } from '../../application/services/goalDomainApplicationService';
import { useGoalStore } from '../../presentation/stores/goalStore';
import type { IGoal, IGoalCreateDTO } from '../../domain/types/goal';

/**
 * 目标对话框组合式函数 - 新架构版本
 * 处理目标的创建和编辑操作
 */
export function useGoalDialog() {
    // 使用新的架构组件
    const goalService = createGoalDomainApplicationService();
    const goalStore = useGoalStore();
    
    // 对话框状态
    const showGoalDialog = ref(false);
    const isEditing = ref(false);
    const editingGoalId = ref<string>('');
    const loading = ref(false);
    
    // 表单数据
    const formData = ref<Partial<IGoalCreateDTO>>({
        title: '',
        description: '',
        color: '#FF5733',
        dirId: '',
        startTime: undefined,
        endTime: undefined,
        note: '',
        keyResults: [],
        analysis: {
            motive: '',
            feasibility: ''
        }
    });
    
    // 错误状态
    const errors = ref<Record<string, string>>({});
    
    // 计算属性
    const dialogTitle = computed(() => {
        return isEditing.value ? '编辑目标' : '创建目标';
    });
    
    const isFormValid = computed(() => {
        return formData.value.title && 
               formData.value.title.trim().length > 0 &&
               formData.value.startTime &&
               formData.value.endTime &&
               formData.value.dirId;
    });
    
    // 验证表单
    const validateForm = (): boolean => {
        errors.value = {};
        
        if (!formData.value.title || formData.value.title.trim().length === 0) {
            errors.value.title = '目标标题不能为空';
        }
        
        if (!formData.value.startTime) {
            errors.value.startTime = '开始时间不能为空';
        }
        
        if (!formData.value.endTime) {
            errors.value.endTime = '结束时间不能为空';
        }
        
        if (!formData.value.dirId) {
            errors.value.dirId = '请选择目标目录';
        }
        
        if (formData.value.startTime && formData.value.endTime) {
            const start = new Date(formData.value.startTime.timestamp);
            const end = new Date(formData.value.endTime.timestamp);
            if (start >= end) {
                errors.value.endTime = '结束时间必须晚于开始时间';
            }
        }
        
        return Object.keys(errors.value).length === 0;
    };
    
    // 重置表单
    const resetForm = () => {
        formData.value = {
            title: '',
            description: '',
            color: '#FF5733',
            dirId: '',
            startTime: undefined,
            endTime: undefined,
            note: '',
            keyResults: [],
            analysis: {
                motive: '',
                feasibility: ''
            }
        };
        errors.value = {};
        isEditing.value = false;
        editingGoalId.value = '';
    };
    
    // 开始创建目标
    const startCreateGoal = () => {
        resetForm();
        showGoalDialog.value = true;
    };
    
    // 开始编辑目标
    const startEditGoal = (goal: IGoal) => {
        resetForm();
        isEditing.value = true;
        editingGoalId.value = goal.id;
        
        // 填充表单数据
        formData.value = {
            title: goal.title,
            description: goal.description,
            color: goal.color,
            dirId: goal.dirId,
            startTime: goal.startTime,
            endTime: goal.endTime,
            note: goal.note,
            keyResults: goal.keyResults.map(kr => ({
                name: kr.name,
                startValue: kr.startValue,
                targetValue: kr.targetValue,
                currentValue: kr.currentValue,
                calculationMethod: kr.calculationMethod,
                weight: kr.weight
            })),
            analysis: {
                motive: goal.analysis.motive,
                feasibility: goal.analysis.feasibility
            }
        };
        
        showGoalDialog.value = true;
    };
    
    // 保存目标
    const saveGoal = async (): Promise<boolean> => {
        if (!validateForm()) {
            return false;
        }
        
        loading.value = true;
        
        try {
            if (isEditing.value) {
                // 编辑现有目标 - 需要获取完整的目标对象进行更新
                const existingGoal = goalStore.goals.find((g: IGoal) => g.id === editingGoalId.value);
                if (!existingGoal) {
                    errors.value.submit = '找不到要编辑的目标';
                    return false;
                }
                
                // 创建更新后的目标对象
                const updatedGoal: IGoal = {
                    ...existingGoal,
                    title: formData.value.title!,
                    description: formData.value.description,
                    color: formData.value.color!,
                    dirId: formData.value.dirId!,
                    startTime: formData.value.startTime!,
                    endTime: formData.value.endTime!,
                    note: formData.value.note,
                    keyResults: formData.value.keyResults!.map((kr, index) => ({
                        id: existingGoal.keyResults[index]?.id || `kr-${Date.now()}-${index}`,
                        name: kr.name,
                        startValue: kr.startValue,
                        targetValue: kr.targetValue,
                        currentValue: kr.currentValue,
                        calculationMethod: kr.calculationMethod,
                        weight: kr.weight,
                        lifecycle: existingGoal.keyResults[index]?.lifecycle || {
                            createdAt: existingGoal.lifecycle.createdAt,
                            updatedAt: existingGoal.lifecycle.updatedAt,
                            status: 'active'
                        }
                    })),
                    analysis: formData.value.analysis!,
                    lifecycle: {
                        ...existingGoal.lifecycle,
                        updatedAt: existingGoal.lifecycle.updatedAt // Will be updated by the service
                    }
                };
                
                const result = await goalService.updateGoal(updatedGoal);
                
                if (result.success) {
                    console.log('✅ 目标更新成功:', result.data?.goal.id);
                    showGoalDialog.value = false;
                    resetForm();
                    return true;
                } else {
                    console.error('❌ 目标更新失败:', result.message);
                    errors.value.submit = result.message || '更新失败';
                    return false;
                }
            } else {
                // 创建新目标
                const result = await goalService.createGoal(formData.value as IGoalCreateDTO);
                
                if (result.success) {
                    console.log('✅ 目标创建成功:', result.data?.goal.id);
                    showGoalDialog.value = false;
                    resetForm();
                    return true;
                } else {
                    console.error('❌ 目标创建失败:', result.message);
                    errors.value.submit = result.message || '创建失败';
                    return false;
                }
            }
        } catch (error) {
            console.error('❌ 保存目标时发生错误:', error);
            errors.value.submit = '保存失败，请重试';
            return false;
        } finally {
            loading.value = false;
        }
    };
    
    // 取消操作
    const cancelGoalEdit = () => {
        showGoalDialog.value = false;
        resetForm();
    };
    
    // 添加关键结果
    const addKeyResult = () => {
        if (!formData.value.keyResults) {
            formData.value.keyResults = [];
        }
        
        formData.value.keyResults.push({
            name: '',
            startValue: 0,
            targetValue: 100,
            currentValue: 0,
            calculationMethod: 'sum',
            weight: 5
        });
    };
    
    // 移除关键结果
    const removeKeyResult = (index: number) => {
        if (formData.value.keyResults && index >= 0 && index < formData.value.keyResults.length) {
            formData.value.keyResults.splice(index, 1);
        }
    };
    
    // 更新关键结果
    const updateKeyResult = (index: number, field: string, value: any) => {
        if (formData.value.keyResults && index >= 0 && index < formData.value.keyResults.length) {
            (formData.value.keyResults[index] as any)[field] = value;
        }
    };
    
    return {
        // 对话框状态
        showGoalDialog,
        isEditing,
        loading,
        dialogTitle,
        
        // 表单数据
        formData,
        errors,
        isFormValid,
        
        // 方法
        startCreateGoal,
        startEditGoal,
        saveGoal,
        cancelGoalEdit,
        resetForm,
        validateForm,
        
        // 关键结果管理
        addKeyResult,
        removeKeyResult,
        updateKeyResult,
        
        // 服务访问
        goalService,
        goalStore
    };
}
