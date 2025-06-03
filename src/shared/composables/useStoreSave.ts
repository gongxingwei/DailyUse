// src/shared/composables/useStoreSave.ts
import { UserStoreService } from "@/shared/services/userStoreService";
import { ref, type Ref } from "vue";

interface StoreSaveOptions {
  delay?: number; // 防抖延迟，默认 1000ms
  onSuccess?: (storeName: string) => void; // 保存成功回调
  onError?: (storeName: string, error: any) => void; // 保存失败回调
}

export function useStoreSave(options: StoreSaveOptions = {}) {
  const { delay = 1000, onSuccess, onError } = options;
  const timeouts = new Map<string, NodeJS.Timeout>();
  const saving = ref<Set<string>>(new Set());

  /**
   * 防抖保存数据
   */
  const debounceSave = async <T>(
    storeName: string,
    data: T
  ): Promise<boolean> => {
    // 清除之前的定时器
    if (timeouts.has(storeName)) {
      clearTimeout(timeouts.get(storeName)!);
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(async () => {
        try {
          saving.value.add(storeName);
          let JSON_data = JSON.stringify(data);
          const response = await UserStoreService.write(storeName, JSON_data);

          if (response.success) {
            onSuccess?.(storeName);
            resolve(true);
          } else {
            onError?.(storeName, response.message);
            resolve(false);
          }
        } catch (error) {
          onError?.(storeName, error);
          resolve(false);
        } finally {
          saving.value.delete(storeName);
          timeouts.delete(storeName);
        }
      }, delay);

      timeouts.set(storeName, timeout);
    });
  };

  /**
   * 立即保存数据
   */
  const saveImmediately = async <T>(
    storeName: string,
    data: T
  ): Promise<boolean> => {
    try {
      saving.value.add(storeName);

      let JSON_data = JSON.stringify(data);
      const response = await UserStoreService.write(storeName, JSON_data);

      if (response.success) {
        onSuccess?.(storeName);
        return true;
      } else {
        onError?.(storeName, response.message);
        return false;
      }
    } catch (error) {
      onError?.(storeName, error);
      return false;
    } finally {
      saving.value.delete(storeName);
    }
  };

  /**
   * 检查是否正在保存
   */
  const isSaving = (storeName?: string): boolean => {
    if (storeName) {
      return saving.value.has(storeName);
    }
    return saving.value.size > 0;
  };

  /**
   * 清理定时器
   */
  const cleanup = () => {
    timeouts.forEach((timeout) => clearTimeout(timeout));
    timeouts.clear();
    saving.value.clear();
  };

  return {
    debounceSave,
    saveImmediately,
    isSaving,
    cleanup,
    saving: saving as Ref<ReadonlySet<string>>,
  };
}
