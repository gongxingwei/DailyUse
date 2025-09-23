import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ValidationRule,
  FieldValidationResult,
  FormValidationResult,
  ValidationTrigger,
  FormConfig,
} from '../types';
import { FormValidator } from '../form-validator';

/**
 * React 字段状态
 */
export interface ReactFieldState {
  value: any;
  error?: string;
  errors: string[];
  warnings: string[];
  valid: boolean;
  touched: boolean;
  dirty: boolean;
  validating: boolean;
}

/**
 * React 表单状态
 */
export interface ReactFormState {
  values: Record<string, any>;
  fields: Record<string, ReactFieldState>;
  valid: boolean;
  validating: boolean;
  touched: boolean;
  dirty: boolean;
  errors: string[];
  warnings: string[];
  summary: string;
}

/**
 * React 表单方法
 */
export interface ReactFormMethods {
  validateField: (fieldName: string, trigger?: ValidationTrigger) => Promise<FieldValidationResult>;
  validateForm: (trigger?: ValidationTrigger) => Promise<FormValidationResult>;
  resetField: (fieldName: string) => void;
  resetForm: () => void;
  setFieldValue: (fieldName: string, value: any) => void;
  setFieldError: (fieldName: string, error: string) => void;
  clearFieldError: (fieldName: string) => void;
  handleFieldChange: (fieldName: string) => (event: any) => void;
  handleFieldBlur: (fieldName: string) => (event: any) => void;
  addRule: (fieldName: string, rule: ValidationRule) => void;
  removeRule: (fieldName: string, ruleType: string) => void;
}

/**
 * React 表单返回类型
 */
export interface ReactFormReturn {
  state: ReactFormState;
  methods: ReactFormMethods;
}

/**
 * React 表单校验Hook选项
 */
export interface UseFormValidationOptions {
  config: FormConfig;
  initialValues?: Record<string, any>;
  validateOnMount?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

/**
 * React 表单校验Hook
 */
export function useFormValidation(options: UseFormValidationOptions): ReactFormReturn {
  const {
    config,
    initialValues = {},
    validateOnMount = false,
    validateOnChange = true,
    validateOnBlur = true,
  } = options;

  // 创建校验器实例
  const validatorRef = useRef<FormValidator | null>(null);
  if (!validatorRef.current) {
    validatorRef.current = new FormValidator(config);
  }

  // 初始化状态
  const [state, setState] = useState<ReactFormState>(() => {
    const fields: Record<string, ReactFieldState> = {};
    const values: Record<string, any> = {};

    config.fields.forEach((fieldConfig) => {
      const fieldName = fieldConfig.name;
      const initialValue = initialValues[fieldName];

      values[fieldName] = initialValue;
      fields[fieldName] = {
        value: initialValue,
        error: undefined,
        errors: [],
        warnings: [],
        valid: true,
        touched: false,
        dirty: false,
        validating: false,
      };
    });

    return {
      values,
      fields,
      valid: true,
      validating: false,
      touched: false,
      dirty: false,
      errors: [],
      warnings: [],
      summary: '',
    };
  });

  /**
   * 更新字段状态
   */
  const updateFieldState = useCallback((fieldName: string, updates: Partial<ReactFieldState>) => {
    setState((prevState) => ({
      ...prevState,
      fields: {
        ...prevState.fields,
        [fieldName]: {
          ...prevState.fields[fieldName],
          ...updates,
        },
      },
      values: {
        ...prevState.values,
        [fieldName]: updates.value !== undefined ? updates.value : prevState.values[fieldName],
      },
    }));
  }, []);

  /**
   * 更新全局状态
   */
  const updateGlobalState = useCallback((updates: Partial<ReactFormState>) => {
    setState((prevState) => ({
      ...prevState,
      ...updates,
    }));
  }, []);

  /**
   * 校验单个字段
   */
  const validateField = useCallback(
    async (
      fieldName: string,
      trigger: ValidationTrigger = 'change',
    ): Promise<FieldValidationResult> => {
      if (!validatorRef.current) {
        throw new Error('Validator not initialized');
      }

      updateFieldState(fieldName, { validating: true });

      try {
        const currentValues = state.values;
        const result = await validatorRef.current.validateField(
          fieldName,
          currentValues[fieldName],
          currentValues,
          trigger,
        );

        // 更新字段状态
        updateFieldState(fieldName, {
          valid: result.valid,
          errors: result.errors,
          warnings: result.warnings,
          error: result.firstError,
          validating: false,
        });

        // 更新全局状态
        setState((prevState) => {
          const allValid = Object.values(prevState.fields).every((field) =>
            field.valid || field === prevState.fields[fieldName] ? result.valid : field.valid,
          );

          return {
            ...prevState,
            valid: allValid,
          };
        });

        return result;
      } catch (error) {
        updateFieldState(fieldName, {
          validating: false,
          valid: false,
          error: 'Validation failed',
        });
        throw error;
      }
    },
    [state.values, updateFieldState],
  );

  /**
   * 校验整个表单
   */
  const validateForm = useCallback(
    async (trigger: ValidationTrigger = 'submit'): Promise<FormValidationResult> => {
      if (!validatorRef.current) {
        throw new Error('Validator not initialized');
      }

      updateGlobalState({ validating: true });

      try {
        const result = await validatorRef.current.validateForm(state.values, trigger);

        // 更新所有字段状态
        const updatedFields: Record<string, ReactFieldState> = { ...state.fields };
        Object.keys(result.fields).forEach((fieldName) => {
          const fieldResult = result.fields[fieldName];
          updatedFields[fieldName] = {
            ...updatedFields[fieldName],
            valid: fieldResult.valid,
            errors: fieldResult.errors,
            warnings: fieldResult.warnings,
            error: fieldResult.firstError,
          };
        });

        setState((prevState) => ({
          ...prevState,
          fields: updatedFields,
          valid: result.valid,
          errors: result.errors,
          warnings: result.warnings,
          summary: result.summary,
          validating: false,
        }));

        return result;
      } catch (error) {
        updateGlobalState({
          validating: false,
          valid: false,
          summary: 'Validation failed',
        });
        throw error;
      }
    },
    [state.values, state.fields, updateGlobalState],
  );

  /**
   * 重置字段
   */
  const resetField = useCallback(
    (fieldName: string) => {
      const initialValue = initialValues[fieldName];
      updateFieldState(fieldName, {
        value: initialValue,
        error: undefined,
        errors: [],
        warnings: [],
        valid: true,
        touched: false,
        dirty: false,
        validating: false,
      });
    },
    [initialValues, updateFieldState],
  );

  /**
   * 重置整个表单
   */
  const resetForm = useCallback(() => {
    const fields: Record<string, ReactFieldState> = {};
    const values: Record<string, any> = {};

    config.fields.forEach((fieldConfig) => {
      const fieldName = fieldConfig.name;
      const initialValue = initialValues[fieldName];

      values[fieldName] = initialValue;
      fields[fieldName] = {
        value: initialValue,
        error: undefined,
        errors: [],
        warnings: [],
        valid: true,
        touched: false,
        dirty: false,
        validating: false,
      };
    });

    setState({
      values,
      fields,
      valid: true,
      validating: false,
      touched: false,
      dirty: false,
      errors: [],
      warnings: [],
      summary: '',
    });
  }, [config.fields, initialValues]);

  /**
   * 设置字段值
   */
  const setFieldValue = useCallback(
    (fieldName: string, value: any) => {
      updateFieldState(fieldName, {
        value,
        dirty: true,
      });

      // 标记全局为已修改
      updateGlobalState({ dirty: true });

      // 根据配置决定是否触发校验
      if (validateOnChange && state.fields[fieldName]?.touched) {
        validateField(fieldName, 'change');
      }
    },
    [updateFieldState, updateGlobalState, validateOnChange, state.fields, validateField],
  );

  /**
   * 设置字段错误
   */
  const setFieldError = useCallback(
    (fieldName: string, error: string) => {
      updateFieldState(fieldName, {
        error,
        errors: [error],
        valid: false,
      });
    },
    [updateFieldState],
  );

  /**
   * 清除字段错误
   */
  const clearFieldError = useCallback(
    (fieldName: string) => {
      updateFieldState(fieldName, {
        error: undefined,
        errors: [],
        valid: true,
      });
    },
    [updateFieldState],
  );

  /**
   * 处理字段变化
   */
  const handleFieldChange = useCallback(
    (fieldName: string) => {
      return (event: any) => {
        const value = event?.target?.value ?? event;
        setFieldValue(fieldName, value);
      };
    },
    [setFieldValue],
  );

  /**
   * 处理字段失焦
   */
  const handleFieldBlur = useCallback(
    (fieldName: string) => {
      return async (event: any) => {
        // 标记为已触摸
        updateFieldState(fieldName, { touched: true });
        updateGlobalState({ touched: true });

        if (validateOnBlur) {
          await validateField(fieldName, 'blur');
        }
      };
    },
    [updateFieldState, updateGlobalState, validateOnBlur, validateField],
  );

  /**
   * 添加规则
   */
  const addRule = useCallback((fieldName: string, rule: ValidationRule) => {
    validatorRef.current?.addRule(fieldName, rule);
  }, []);

  /**
   * 移除规则
   */
  const removeRule = useCallback((fieldName: string, ruleType: string) => {
    validatorRef.current?.removeRule(fieldName, ruleType);
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      validatorRef.current?.destroy();
    };
  }, []);

  // 初始校验
  useEffect(() => {
    if (validateOnMount) {
      validateForm('change');
    }
  }, [validateOnMount, validateForm]);

  const methods: ReactFormMethods = {
    validateField,
    validateForm,
    resetField,
    resetForm,
    setFieldValue,
    setFieldError,
    clearFieldError,
    handleFieldChange,
    handleFieldBlur,
    addRule,
    removeRule,
  };

  return {
    state,
    methods,
  };
}

/**
 * React 字段校验Hook
 */
export function useFieldValidation(fieldName: string, rules: ValidationRule[], initialValue?: any) {
  const config: FormConfig = {
    fields: [{ name: fieldName, rules }],
  };

  const form = useFormValidation({
    config,
    initialValues: { [fieldName]: initialValue },
  });

  const field = form.state.fields[fieldName];

  return {
    value: field?.value,
    error: field?.error,
    errors: field?.errors || [],
    warnings: field?.warnings || [],
    valid: field?.valid ?? true,
    touched: field?.touched ?? false,
    dirty: field?.dirty ?? false,
    validating: field?.validating ?? false,
    validate: (trigger?: ValidationTrigger) => form.methods.validateField(fieldName, trigger),
    reset: () => form.methods.resetField(fieldName),
    setValue: (value: any) => form.methods.setFieldValue(fieldName, value),
    setError: (error: string) => form.methods.setFieldError(fieldName, error),
    clearError: () => form.methods.clearFieldError(fieldName),
    onChange: form.methods.handleFieldChange(fieldName),
    onBlur: form.methods.handleFieldBlur(fieldName),
  };
}
