/**
 * 防抖工具函数
 * @module debounce
 * @description 提供防抖功能，延迟执行函数直到停止调用一段时间
 */

/**
 * 防抖函数 - 纯函数版本（框架无关）
 * @description 在指定延迟后执行函数，如果在延迟期间再次调用则重新计时
 *
 * @template T - 函数类型
 * @param fn - 需要防抖的函数
 * @param delay - 延迟时间（毫秒），默认 300ms
 * @returns 包含防抖函数和取消函数的对象
 *
 * @example
 * ```typescript
 * const { debouncedFn, cancel } = createDebounce((value: string) => {
 *   console.log('搜索:', value)
 * }, 500)
 *
 * // 用户输入时调用
 * input.addEventListener('input', (e) => debouncedFn(e.target.value))
 *
 * // 组件卸载时取消
 * onUnmounted(() => cancel())
 * ```
 */
export function createDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay = 300,
): {
  debouncedFn: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
} {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debouncedFn = (...args: Parameters<T>) => {
    lastArgs = args;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
      lastArgs = null;
    }, delay);
  };

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      lastArgs = null;
    }
  };

  // 立即执行最后一次调用
  const flush = () => {
    if (timer && lastArgs) {
      clearTimeout(timer);
      fn(...lastArgs);
      timer = null;
      lastArgs = null;
    }
  };

  return { debouncedFn, cancel, flush };
}

/**
 * 防抖装饰器 - 用于类方法
 * @description 将类方法包装为防抖版本
 *
 * @param delay - 延迟时间（毫秒）
 * @returns 方法装饰器
 *
 * @example
 * ```typescript
 * class SearchService {
 *   @debounce(500)
 *   search(keyword: string) {
 *     console.log('搜索:', keyword)
 *   }
 * }
 * ```
 */
export function debounce(delay = 300) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const debounceMap = new WeakMap<any, ReturnType<typeof createDebounce>>();

    descriptor.value = function (...args: any[]) {
      if (!debounceMap.has(this)) {
        debounceMap.set(this, createDebounce(originalMethod.bind(this), delay));
      }
      const { debouncedFn } = debounceMap.get(this)!;
      debouncedFn(...args);
    };

    return descriptor;
  };
}

/**
 * Promise 防抖 - 用于异步操作
 * @description 只保留最后一次调用的 Promise 结果
 *
 * @template T - Promise 返回类型
 * @param fn - 返回 Promise 的函数
 * @param delay - 延迟时间（毫秒）
 * @returns 包含防抖函数的对象
 *
 * @example
 * ```typescript
 * const { debouncedFn } = createDebouncePromise(
 *   async (keyword: string) => {
 *     return await searchApi(keyword)
 *   },
 *   500
 * )
 *
 * // 只有最后一次调用会真正执行
 * const result = await debouncedFn('keyword')
 * ```
 */
export function createDebouncePromise<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay = 300,
): {
  debouncedFn: (...args: Parameters<T>) => Promise<ReturnType<T>>;
  cancel: () => void;
} {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let latestResolve: ((value: any) => void) | null = null;
  let latestReject: ((reason?: any) => void) | null = null;

  const debouncedFn = (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      // 取消之前的 Promise
      if (latestReject) {
        latestReject(new Error('Cancelled by new call'));
      }

      latestResolve = resolve;
      latestReject = reject;

      if (timer) clearTimeout(timer);

      timer = setTimeout(async () => {
        try {
          const result = await fn(...args);
          if (latestResolve === resolve) {
            resolve(result);
          }
        } catch (error) {
          if (latestReject === reject) {
            reject(error);
          }
        } finally {
          timer = null;
          if (latestResolve === resolve) {
            latestResolve = null;
            latestReject = null;
          }
        }
      }, delay);
    });
  };

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (latestReject) {
      latestReject(new Error('Cancelled'));
      latestResolve = null;
      latestReject = null;
    }
  };

  return { debouncedFn, cancel };
}

/**
 * 批量防抖 - 收集多次调用，一次性处理
 * @description 在延迟时间内收集所有调用参数，然后一次性处理
 *
 * @template T - 参数类型
 * @param fn - 处理函数，接收所有收集的参数数组
 * @param delay - 延迟时间（毫秒）
 * @returns 包含防抖函数和取消函数的对象
 *
 * @example
 * ```typescript
 * const { debouncedFn } = createBatchDebounce(
 *   (ids: number[]) => {
 *     console.log('批量删除:', ids)
 *     return batchDeleteApi(ids)
 *   },
 *   1000
 * )
 *
 * // 用户快速点击多个删除按钮
 * debouncedFn(1)
 * debouncedFn(2)
 * debouncedFn(3)
 * // 1秒后一次性处理: [1, 2, 3]
 * ```
 */
export function createBatchDebounce<T>(
  fn: (items: T[]) => void | Promise<void>,
  delay = 300,
): {
  debouncedFn: (item: T) => void;
  cancel: () => void;
  flush: () => void;
} {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let batch: T[] = [];

  const debouncedFn = (item: T) => {
    batch.push(item);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (batch.length > 0) {
        fn([...batch]);
        batch = [];
      }
      timer = null;
    }, delay);
  };

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    batch = [];
  };

  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (batch.length > 0) {
      fn([...batch]);
      batch = [];
    }
  };

  return { debouncedFn, cancel, flush };
}
