/**
 * IPC 数据序列化工具
 * 用于确保通过 IPC 传输的数据是可序列化的纯对象
 */

/**
 * 序列化对象为可传输的纯对象
 * 处理 toDTO/toJSON 方法、移除函数属性、处理循环引用等
 */
export function serializeForIpc(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // 如果对象有 toDTO 方法，优先使用（业务优先）
  if (typeof obj.toDTO === 'function') {
    try {
      const dtoResult = obj.toDTO();
      try {
        JSON.stringify(dtoResult);
        return dtoResult;
      } catch {
        // 如果toDTO结果不可序列化，继续使用其他方法
      }
    } catch {
      // 如果toDTO失败，继续使用其他方法
    }
  }

  // 如果对象有 toJSON 方法，作为备选
  if (typeof obj.toJSON === 'function') {
    try {
      const jsonResult = obj.toJSON();
      try {
        JSON.stringify(jsonResult);
        return jsonResult;
      } catch {
        // 如果toJSON结果不可序列化，继续使用其他方法
      }
    } catch {
      // 如果toJSON失败，继续使用其他方法
    }
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => serializeForIpc(item));
  }

  // 处理普通对象
  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        // 跳过函数属性
        if (typeof value !== 'function') {
          serialized[key] = serializeForIpc(value);
        }
      }
    }
    try {
      JSON.stringify(serialized);
      return serialized;
    } catch {
      try {
        const safeResult = JSON.parse(JSON.stringify(serialized));
        return safeResult;
      } catch {
        return {};
      }
    }
  }

  // 基本类型直接返回
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
  } catch {
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
    throw new Error(`Object cannot be safely transmitted via IPC${contextInfo}. Check for circular references or non-serializable properties.`);
  }

  return serialized;
}

/**
 * 深度序列化对象为纯JSON数据
 * 这是最安全的序列化方式，确保完全移除所有不可序列化内容
 */
export function deepSerializeForIpc(obj: any): any {
  try {
    // 先尝试常规序列化
    const regularSerialized = serializeForIpc(obj);

    // 然后使用JSON.stringify/parse进行深度清理
    const deepCleaned = JSON.parse(JSON.stringify(regularSerialized, (key, value) => {
      if (typeof value === 'function') {
        return undefined;
      }
      if (typeof value === 'undefined') {
        return null;
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (value && typeof value === 'object') {
        try {
          JSON.stringify(value);
        } catch {
          return null;
        }
      }
      return value;
    }));

    return deepCleaned;

  } catch {
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
      return safeObj;
    }
    return {};
  }
}