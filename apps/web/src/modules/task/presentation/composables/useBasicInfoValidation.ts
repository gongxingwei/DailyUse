import { ref, computed, readonly } from 'vue';

export function useBasicInfoValidation() {
    const validationErrors = ref<string[]>([]);
    const isValid = computed(() => validationErrors.value.length === 0);

    const validate = (title: string, description: string): void => {
        validationErrors.value = [];
        validationErrors.value.push(...validateTitle(title));
        validationErrors.value.push(...validateDescription(description));
    };

    const validateTitle = (title: string): string[] => {
        const errors: string[] = [];
        if (!title || title.trim() === '') {
            errors.push('任务标题不能为空');
        } else if (title.length < 1 || title.length > 100) {
            errors.push('任务标题长度必须在1到100个字符之间');
        } else if (title.trim() !== title) {
            errors.push('任务标题不能以空格开头或结尾');
        }
        return errors;
    }

    const validateDescription = (description: string): string[] => {
        const errors: string[] = [];
        if (description && description.length > 500) {
            errors.push('任务描述不能超过500个字符');
        }
        return errors;
    };

    return {
        validationErrors: readonly(validationErrors),
        isValid,
        validate,
        validateTitle,
        validateDescription
    }
}
