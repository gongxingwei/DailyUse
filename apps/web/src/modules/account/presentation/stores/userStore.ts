import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ApplicationService } from '../../application/services/ApplicationService';
import type {
    AccountResponseDto,
} from '../../application/dtos/UserDtos';

/**
 * 用户状态管理Store
 */
export const useUserStore = defineStore('user', () => {
  // 状态
  const currentUser = ref<AccountResponseDto | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
//   const recommendedActions = ref<RecommendedActionDto[]>([]);

  // 注入依赖 (在setup时通过provide/inject机制注入)
  let userApplicationService: ApplicationService;

  // Getters
  const isAuthenticated = computed(() => !!currentUser.value);

  const userStatus = computed(() => currentUser.value?.status || 'unknown');

  const isActive = computed(() => userStatus.value === 'active');

//   const highPriorityActions = computed(() =>
//     recommendedActions.value.filter((action) => action.priority === 'high'),
//   );

  // Actions
  const setUserApplicationService = (service: ApplicationService) => {
    userApplicationService = service;
  };

//   /**
//    * 获取当前用户信息
//    */
//   const fetchCurrentUser = async () => {
//     if (!userApplicationService) {
//       throw new Error('UserApplicationService not initialized');
//     }

//     loading.value = true;
//     error.value = null;

//     try {
//       const result = await userApplicationService.getCurrentUser();

//       if (result.success && result.user) {
//         currentUser.value = result.user;
//         // 获取推荐操作
//         await fetchRecommendedActions(result.user.id);
//       } else {
//         error.value = result.message;
//         currentUser.value = null;
//       }
//     } catch (err) {
//       error.value = err instanceof Error ? err.message : '获取用户信息失败';
//       currentUser.value = null;
//     } finally {
//       loading.value = false;
//     }
//   };

//   /**
//    * 根据ID获取用户
//    */
//   const fetchUserById = async (userId: string) => {
//     if (!userApplicationService) {
//       throw new Error('UserApplicationService not initialized');
//     }

//     loading.value = true;
//     error.value = null;

//     try {
//       const result = await userApplicationService.getUserById(userId);

//       if (!result.success || !result.user) {
//         error.value = result.message;
//         return null;
//       }

//       return result.user;
//     } catch (err) {
//       error.value = err instanceof Error ? err.message : '获取用户信息失败';
//       return null;
//     } finally {
//       loading.value = false;
//     }
//   };

//   /**
//    * 更新用户资料
//    */
//   const updateProfile = async (profileData: UpdateUserProfileDto) => {
//     if (!userApplicationService || !currentUser.value) {
//       throw new Error('Service not initialized or user not logged in');
//     }

//     loading.value = true;
//     error.value = null;

//     try {
//       const result = await userApplicationService.updateUserProfile(
//         currentUser.value.id,
//         profileData,
//       );

//       if (result.success && result.user) {
//         currentUser.value = result.user;
//         // 重新获取推荐操作
//         await fetchRecommendedActions(result.user.id);
//         return { success: true, message: result.message };
//       } else {
//         error.value = result.message;
//         return { success: false, message: result.message, errors: result.errors };
//       }
//     } catch (err) {
//       const message = err instanceof Error ? err.message : '更新资料失败';
//       error.value = message;
//       return { success: false, message };
//     } finally {
//       loading.value = false;
//     }
//   };

//   /**
//    * 上传头像
//    */
//   const uploadAvatar = async (file: File) => {
//     if (!userApplicationService || !currentUser.value) {
//       throw new Error('Service not initialized or user not logged in');
//     }

//     loading.value = true;
//     error.value = null;

//     try {
//       const result = await userApplicationService.uploadAvatar({
//         userId: currentUser.value.id,
//         file,
//       });

//       if (result.success && result.user) {
//         currentUser.value = result.user;
//         return { success: true, message: result.message };
//       } else {
//         error.value = result.message;
//         return { success: false, message: result.message };
//       }
//     } catch (err) {
//       const message = err instanceof Error ? err.message : '上传头像失败';
//       error.value = message;
//       return { success: false, message };
//     } finally {
//       loading.value = false;
//     }
//   };

//   /**
//    * 获取推荐操作
//    */
//   const fetchRecommendedActions = async (userId: string) => {
//     if (!userApplicationService) return;

//     try {
//       const result = await userApplicationService.getUserRecommendedActions(userId);

//       if (result.success && result.actions) {
//         recommendedActions.value = result.actions;
//       }
//     } catch (err) {
//       console.warn('获取推荐操作失败:', err);
//     }
//   };

//   /**
//    * 停用账号
//    */
//   const deactivateAccount = async () => {
//     if (!userApplicationService || !currentUser.value) {
//       throw new Error('Service not initialized or user not logged in');
//     }

//     loading.value = true;
//     error.value = null;

//     try {
//       const result = await userApplicationService.deactivateUser(currentUser.value.id);

//       if (result.success) {
//         // 停用成功后清除当前用户状态
//         currentUser.value = null;
//         recommendedActions.value = [];
//         return { success: true, message: result.message };
//       } else {
//         error.value = result.message;
//         return { success: false, message: result.message };
//       }
//     } catch (err) {
//       const message = err instanceof Error ? err.message : '停用账号失败';
//       error.value = message;
//       return { success: false, message };
//     } finally {
//       loading.value = false;
//     }
//   };

//   /**
//    * 检查用户名可用性
//    */
//   const checkUsernameAvailability = async (username: string) => {
//     if (!userApplicationService) {
//       throw new Error('UserApplicationService not initialized');
//     }

//     try {
//       return await userApplicationService.checkUsernameAvailability(username);
//     } catch (err) {
//       return {
//         success: false,
//         message: err instanceof Error ? err.message : '检查用户名失败',
//       };
//     }
//   };

//   /**
//    * 清除错误信息
//    */
//   const clearError = () => {
//     error.value = null;
//   };

//   /**
//    * 清除用户状态
//    */
//   const clearUser = () => {
//     currentUser.value = null;
//     recommendedActions.value = [];
//     error.value = null;
//   };

//   /**
//    * 设置用户信息 (用于登录后设置)
//    */
//   const setCurrentUser = (user: UserResponseDto) => {
//     currentUser.value = user;
//     fetchRecommendedActions(user.id);
//   };

  return {
    // 状态
    currentUser,
    loading,
    error,
    // Getters
    isAuthenticated,

    userStatus,
    isActive,
    // highPriorityActions,

    // Actions
    setUserApplicationService,
    // fetchCurrentUser,
    // fetchUserById,
    // updateProfile,
    // uploadAvatar,
    // fetchRecommendedActions,
    // deactivateAccount,
    // checkUsernameAvailability,
    // clearError,
    // clearUser,
    // setCurrentUser,
  };
});
