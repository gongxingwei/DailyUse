/**
 * 通用表单校验系统使用示例
 * 展示如何使用核心校验器和内置校验规则
 */

import type { FormConfig, ValidationRule } from './types';
import { FormValidator } from './form-validator';
import { BuiltinValidators } from './builtin-validators';

/**
 * 示例：用户注册表单配置
 */
function createUserRegistrationForm() {
  const config: FormConfig = {
    fields: [
      {
        name: 'username',
        rules: [
          BuiltinValidators.required('用户名不能为空'),
          BuiltinValidators.minLength(3, '用户名至少3个字符'),
          BuiltinValidators.maxLength(20, '用户名最多20个字符'),
          BuiltinValidators.pattern(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
          {
            type: 'async',
            message: '用户名已存在',
            validator: async (value: string) => {
              // 模拟异步检查用户名是否存在
              await new Promise((resolve) => setTimeout(resolve, 500));
              return !['admin', 'test', 'user'].includes(value.toLowerCase());
            },
            debounce: 300,
          },
        ],
      },
      {
        name: 'email',
        rules: [
          BuiltinValidators.required('邮箱不能为空'),
          BuiltinValidators.email('请输入有效的邮箱地址'),
          {
            type: 'async',
            message: '邮箱已被注册',
            validator: async (value: string) => {
              // 模拟异步检查邮箱是否已注册
              await new Promise((resolve) => setTimeout(resolve, 300));
              return !['test@example.com', 'admin@example.com'].includes(value.toLowerCase());
            },
            debounce: 500,
          },
        ],
      },
      {
        name: 'password',
        rules: [
          BuiltinValidators.required('密码不能为空'),
          BuiltinValidators.minLength(8, '密码至少8个字符'),
          BuiltinValidators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            '密码必须包含大小写字母、数字和特殊字符',
          ),
        ],
      },
      {
        name: 'confirmPassword',
        rules: [
          BuiltinValidators.required('请确认密码'),
          {
            type: 'custom',
            message: '两次输入的密码不一致',
            validator: (value: string, formData: any) => {
              return value === formData.password;
            },
            trigger: ['change', 'blur'],
          },
        ],
      },
      {
        name: 'phone',
        rules: [
          BuiltinValidators.phone('请输入有效的手机号码'),
          {
            type: 'custom',
            message: '选择短信验证时手机号不能为空',
            condition: (value: string, formData: any) => {
              // 如果选择了短信验证，则手机号必填
              return formData.verificationMethod === 'sms';
            },
            validator: (value: string) => {
              return value != null && value !== '' && value !== undefined;
            },
          },
        ],
      },
      {
        name: 'age',
        rules: [
          BuiltinValidators.required('年龄不能为空'),
          BuiltinValidators.number(), // Fix: number doesn't take message parameter
          BuiltinValidators.min(18, '年龄不能小于18岁'),
          BuiltinValidators.max(120, '年龄不能大于120岁'),
        ],
      },
      {
        name: 'verificationMethod',
        rules: [
          BuiltinValidators.required('请选择验证方式'),
          {
            type: 'custom',
            message: '请选择有效的验证方式',
            validator: (value: string) => {
              return ['email', 'sms'].includes(value);
            },
          },
        ],
      },
    ],
    globalRules: [
      {
        type: 'custom',
        message: '邮箱和手机号不能同时为空',
        validator: (value: any, formData: any) => {
          return !!(formData.email || formData.phone);
        },
        trigger: ['submit'],
      },
    ],
    defaultTrigger: ['change'],
  };

  return new FormValidator(config);
}

/**
 * 示例：产品信息表单配置
 */
function createProductForm() {
  const config: FormConfig = {
    fields: [
      {
        name: 'name',
        rules: [
          BuiltinValidators.required('产品名称不能为空'),
          BuiltinValidators.minLength(2, '产品名称至少2个字符'),
          BuiltinValidators.maxLength(50, '产品名称最多50个字符'),
        ],
      },
      {
        name: 'price',
        rules: [
          BuiltinValidators.required('价格不能为空'),
          BuiltinValidators.number(),
          BuiltinValidators.min(0.01, '价格必须大于0'),
          BuiltinValidators.max(999999.99, '价格不能超过999999.99'),
          {
            type: 'custom',
            message: '价格最多保留两位小数',
            validator: (value: number) => {
              const str = value.toString();
              const decimalIndex = str.indexOf('.');
              if (decimalIndex === -1) return true;
              return str.length - decimalIndex - 1 <= 2;
            },
          },
        ],
      },
      {
        name: 'category',
        rules: [
          BuiltinValidators.required('请选择分类'),
          {
            type: 'custom',
            message: '请选择有效的分类',
            validator: (value: string) => {
              return ['electronics', 'clothing', 'books', 'food'].includes(value);
            },
          },
        ],
      },
      {
        name: 'description',
        rules: [
          BuiltinValidators.required('产品描述不能为空'),
          BuiltinValidators.minLength(10, '产品描述至少10个字符'),
          BuiltinValidators.maxLength(500, '产品描述最多500个字符'),
        ],
      },
      {
        name: 'tags',
        rules: [
          {
            type: 'custom',
            message: '标签数量不能超过5个',
            validator: (value: string[]) => {
              return Array.isArray(value) && value.length <= 5;
            },
          },
          {
            type: 'custom',
            message: '每个标签长度不能超过20个字符',
            validator: (value: string[]) => {
              if (!Array.isArray(value)) return false;
              return value.every((tag) => typeof tag === 'string' && tag.length <= 20);
            },
          },
        ],
      },
      {
        name: 'images',
        rules: [
          BuiltinValidators.required('请上传至少一张产品图片'),
          {
            type: 'custom',
            message: '最多上传10张图片',
            validator: (value: File[]) => {
              return Array.isArray(value) && value.length <= 10;
            },
          },
          {
            type: 'custom',
            message: '每张图片大小不能超过5MB',
            validator: (value: File[]) => {
              if (!Array.isArray(value)) return false;
              return value.every((file) => file.size <= 5 * 1024 * 1024);
            },
          },
        ],
      },
    ],
  };

  return new FormValidator(config);
}

/**
 * 示例使用方法
 */
async function demonstrateUsage() {
  console.log('=== 用户注册表单校验示例 ===');

  const userForm = createUserRegistrationForm();

  // 模拟用户输入数据
  const userData = {
    username: 'john',
    email: 'john@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    phone: '13800138000',
    age: 25,
    verificationMethod: 'email',
  };

  try {
    // 校验单个字段
    console.log('校验用户名...');
    const usernameResult = await userForm.validateField('username', userData.username, userData);
    console.log('用户名校验结果:', usernameResult);

    // 校验整个表单
    console.log('\\n校验整个表单...');
    const formResult = await userForm.validateForm(userData);
    console.log('表单校验结果:', formResult);

    if (formResult.valid) {
      console.log('✅ 表单校验通过，可以提交');
    } else {
      console.log('❌ 表单校验失败，错误信息:');
      formResult.errors.forEach((error) => console.log(`- ${error}`));
    }
  } catch (error) {
    console.error('校验过程中出现错误:', error);
  }

  console.log('\\n=== 产品信息表单校验示例 ===');

  const productForm = createProductForm();

  // 模拟产品数据
  const productData = {
    name: 'iPhone 15',
    price: 999.99,
    category: 'electronics',
    description: '最新款iPhone，配备强大的A17芯片和先进的摄像系统',
    tags: ['手机', '苹果', '5G', '旗舰'],
    images: [], // 假设这里是File对象数组
  };

  try {
    // 校验价格字段
    console.log('校验产品价格...');
    const priceResult = await productForm.validateField('price', productData.price, productData);
    console.log('价格校验结果:', priceResult);

    // 校验整个产品表单
    console.log('\\n校验整个产品表单...');
    const productFormResult = await productForm.validateForm(productData);
    console.log('产品表单校验结果:', productFormResult);
  } catch (error) {
    console.error('产品表单校验过程中出现错误:', error);
  }

  // 清理资源
  userForm.destroy();
  productForm.destroy();
}

/**
 * 自定义校验规则示例
 */
function createCustomValidationRules() {
  // 身份证号校验
  const idCardRule: ValidationRule = {
    type: 'custom',
    message: '请输入有效的身份证号',
    validator: (value: string) => {
      const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
      return idCardRegex.test(value);
    },
  };

  // 密码强度校验
  const passwordStrengthRule: ValidationRule = {
    type: 'custom',
    message: '密码强度不足',
    validator: (value: string) => {
      let score = 0;

      // 长度评分
      if (value.length >= 8) score += 1;
      if (value.length >= 12) score += 1;

      // 字符类型评分
      if (/[a-z]/.test(value)) score += 1;
      if (/[A-Z]/.test(value)) score += 1;
      if (/\d/.test(value)) score += 1;
      if (/[^a-zA-Z\d]/.test(value)) score += 1;

      return score >= 4; // 至少4分才算强密码
    },
  };

  // 文件类型校验
  const imageFileRule: ValidationRule = {
    type: 'custom',
    message: '只支持JPG、PNG、GIF格式的图片',
    validator: (files: File[]) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      return Array.isArray(files) && files.every((file) => allowedTypes.includes(file.type));
    },
  };

  // 依赖字段校验
  const conditionalRequiredRule: ValidationRule = {
    type: 'custom',
    message: '当选择"其他"时，此字段为必填',
    condition: (value: any, formData: any) => {
      return formData.category === 'other';
    },
    validator: (value: any) => {
      return value != null && value !== '' && value !== undefined;
    },
  };

  return {
    idCardRule,
    passwordStrengthRule,
    imageFileRule,
    conditionalRequiredRule,
  };
}

/**
 * 动态规则管理示例
 */
function demonstrateDynamicRules() {
  const config: FormConfig = {
    fields: [
      {
        name: 'email',
        rules: [
          BuiltinValidators.required('邮箱不能为空'),
          BuiltinValidators.email('请输入有效的邮箱地址'),
        ],
      },
    ],
  };

  const form = new FormValidator(config);

  // 动态添加规则
  form.addRule('email', {
    type: 'async',
    message: '邮箱格式检查中...',
    validator: async (value: string) => {
      // 模拟异步验证
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return value.includes('@gmail.com') || value.includes('@outlook.com');
    },
    debounce: 500,
  });

  // 动态移除规则
  form.removeRule('email', 'email');

  // 清空所有规则
  form.clearRules('email');

  return form;
}

// 导出示例函数
export {
  createUserRegistrationForm,
  createProductForm,
  demonstrateUsage,
  createCustomValidationRules,
  demonstrateDynamicRules,
};
