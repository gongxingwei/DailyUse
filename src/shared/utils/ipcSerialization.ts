/**
 * IPC 数据序列化工具
 * 用于确保通过 IPC 传输的数据是可序列化的纯对象
 */

/**
 * 序列化对象为可传输的纯对象
 * 处理 toDTO/toJSON 方法、移除函数属性、处理循环引用等
 */
export function serializeForIpc(obj: any): any {
  console.log('🔄 [渲染进程-序列化] 开始序列化对象，类型:', typeof obj);
  
  if (obj === null || obj === undefined) {
    console.log('✅ [渲染进程-序列化] 对象为null/undefined，直接返回');
    return obj;
  }
  
  // 如果对象有 toDTO 方法，优先使用（业务优先）
  if (typeof obj.toDTO === 'function') {
    console.log('🔄 [渲染进程-序列化] 对象有toDTO方法，使用toDTO()');
    try {
      const dtoResult = obj.toDTO();
      console.log('✅ [渲染进程-序列化] toDTO()调用成功，结果类型:', typeof dtoResult);
      console.log('📋 [渲染进程-序列化] toDTO()结果:', dtoResult);
      
      // 验证toDTO结果是否可序列化
      try {
        JSON.stringify(dtoResult);
        console.log('✅ [渲染进程-序列化] toDTO()结果可序列化');
        return dtoResult;
      } catch (error) {
        console.error('❌ [渲染进程-序列化] toDTO()结果不可序列化:', error);
        // 如果toDTO结果不可序列化，继续使用其他方法
      }
    } catch (error) {
      console.error('❌ [渲染进程-序列化] toDTO()调用失败:', error);
      // 如果toDTO失败，继续使用其他方法
    }
  }
  
  // 如果对象有 toJSON 方法，作为备选
  if (typeof obj.toJSON === 'function') {
    console.log('🔄 [渲染进程-序列化] 对象有toJSON方法，使用toJSON()');
    try {
      const jsonResult = obj.toJSON();
      console.log('✅ [渲染进程-序列化] toJSON()调用成功，结果类型:', typeof jsonResult);
      
      // 验证toJSON结果是否可序列化
      try {
        JSON.stringify(jsonResult);
        console.log('✅ [渲染进程-序列化] toJSON()结果可序列化');
        return jsonResult;
      } catch (error) {
        console.error('❌ [渲染进程-序列化] toJSON()结果不可序列化:', error);
        // 如果toJSON结果不可序列化，继续使用其他方法
      }
    } catch (error) {
      console.error('❌ [渲染进程-序列化] toJSON()调用失败:', error);
      // 如果toJSON失败，继续使用其他方法
    }
  }
  
  // 处理数组
  if (Array.isArray(obj)) {
    console.log('🔄 [渲染进程-序列化] 对象是数组，递归序列化元素，长度:', obj.length);
    return obj.map((item, index) => {
      console.log(`🔄 [渲染进程-序列化] 序列化数组元素[${index}]`);
      return serializeForIpc(item);
    });
  }
  
  // 处理普通对象
  if (typeof obj === 'object') {
    console.log('🔄 [渲染进程-序列化] 对象是普通对象，逐属性序列化');
    const serialized: any = {};
    const keys = Object.keys(obj);
    console.log('🔍 [渲染进程-序列化] 对象属性列表:', keys);
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        console.log(`🔍 [渲染进程-序列化] 处理属性 ${key}:`, typeof value);
        
        // 跳过函数属性
        if (typeof value !== 'function') {
          serialized[key] = serializeForIpc(value);
        } else {
          console.log(`⚠️ [渲染进程-序列化] 跳过函数属性 ${key}`);
        }
      }
    }
    
    // 验证序列化结果
    try {
      JSON.stringify(serialized);
      console.log('✅ [渲染进程-序列化] 普通对象序列化成功');
      return serialized;
    } catch (error) {
      console.error('❌ [渲染进程-序列化] 普通对象序列化失败:', error);
      // 尝试更安全的序列化
      try {
        const safeResult = JSON.parse(JSON.stringify(serialized));
        console.log('🔄 [渲染进程-序列化] 使用深拷贝修复序列化问题');
        return safeResult;
      } catch (deepError) {
        console.error('❌ [渲染进程-序列化] 深拷贝也无法修复序列化问题:', deepError);
        return {}; // 返回空对象作为最后的回退
      }
    }
  }
  
  // 基本类型直接返回
  console.log('✅ [渲染进程-序列化] 基本类型，直接返回:', obj);
  return obj;
}

/**
 * 安全的 IPC 调用包装器
 * 自动序列化参数
 */
export function safeIpcInvoke(channel: string, ...args: any[]): Promise<any> {
  const serializedArgs = args.map(arg => serializeForIpc(arg));
  return window.shared.ipcRenderer.invoke(channel, ...serializedArgs);
}

/**
 * 检查对象是否可以安全地通过 IPC 传输
 */
export function isIpcSafe(obj: any): boolean {
  try {
    JSON.stringify(obj);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 验证并序列化 IPC 数据
 * 如果数据不安全，会抛出错误并提供诊断信息
 */
export function validateAndSerializeForIpc(obj: any, context?: string): any {
  const serialized = serializeForIpc(obj);
  
  if (!isIpcSafe(serialized)) {
    const contextInfo = context ? ` in ${context}` : '';
    console.error(`IPC serialization failed${contextInfo}:`, obj);
    throw new Error(`Object cannot be safely transmitted via IPC${contextInfo}. Check for circular references or non-serializable properties.`);
  }
  
  return serialized;
}

/**
 * 深度序列化对象为纯JSON数据
 * 这是最安全的序列化方式，确保完全移除所有不可序列化内容
 */
export function deepSerializeForIpc(obj: any): any {
  console.log('🔄 [渲染进程-深度序列化] 开始深度序列化，类型:', typeof obj);
  
  try {
    // 先尝试常规序列化
    const regularSerialized = serializeForIpc(obj);
    
    // 然后使用JSON.stringify/parse进行深度清理
    const deepCleaned = JSON.parse(JSON.stringify(regularSerialized, (key, value) => {
      // 自定义替换函数，确保所有值都是可序列化的
      if (typeof value === 'function') {
        console.log(`⚠️ [渲染进程-深度序列化] 移除函数属性: ${key}`);
        return undefined;
      }
      if (typeof value === 'undefined') {
        return null; // 将undefined转为null
      }
      if (value instanceof Date) {
        console.log(`🔄 [渲染进程-深度序列化] 转换Date对象: ${key}`);
        return value.toISOString();
      }
      if (value && typeof value === 'object') {
        // 检查循环引用
        try {
          JSON.stringify(value);
        } catch (error) {
          console.error(`❌ [渲染进程-深度序列化] 检测到不可序列化对象: ${key}`, error);
          return null;
        }
      }
      return value;
    }));
    
    console.log('✅ [渲染进程-深度序列化] 深度序列化成功');
    return deepCleaned;
    
  } catch (error) {
    console.error('❌ [渲染进程-深度序列化] 深度序列化失败:', error);
    
    // 最后的备选方案：返回基本信息
    if (obj && typeof obj === 'object') {
      const safeObj: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            safeObj[key] = value;
          } else if (value === null) {
            safeObj[key] = null;
          }
        }
      }
      console.log('🔄 [渲染进程-深度序列化] 使用安全备选方案');
      return safeObj;
    }
    
    return {};
  }
}
