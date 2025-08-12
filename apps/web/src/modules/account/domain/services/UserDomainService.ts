// import type { User } from '../models/User';

// /**
//  * 用户领域服务 - Web端
//  * 封装复杂的用户相关业务逻辑
//  */
// export class UserDomainService {
//   /**
//    * 验证用户个人信息的完整性
//    */
// //   validateProfileCompleteness(user: User): {
// //     isComplete: boolean;
// //     missingFields: string[];
// //   } {
// //     const missingFields: string[] = [];

// //     if (!user.displayName) {
// //       missingFields.push('显示名称');
// //     }

// //     return {
// //       isComplete: missingFields.length === 0,
// //       missingFields,
// //     };
// //   }

//   /**
//    * 生成用户展示名称的建议
//    */
//   generateDisplayNameSuggestions(user: User): string[] {
//     const suggestions: string[] = [];
//     const personalInfo = user.userAggregate.personalInfo;

//     // 基于姓名的建议
//     if (personalInfo?.firstName && personalInfo?.lastName) {
//       suggestions.push(`${personalInfo.firstName}${personalInfo.lastName}`);
//       suggestions.push(`${personalInfo.firstName} ${personalInfo.lastName}`);
//       suggestions.push(`${personalInfo.firstName}.${personalInfo.lastName}`);
//     }

//     // 基于用户名的建议
//     if (user.username.length > 3) {
//       suggestions.push(user.username);
//       suggestions.push(this.capitalizeFirst(user.username));
//     }

//     // 基于邮箱的建议
//     if (user.email) {
//       const emailPrefix = user.email.split('@')[0];
//       if (emailPrefix !== user.username) {
//         suggestions.push(emailPrefix);
//         suggestions.push(this.capitalizeFirst(emailPrefix));
//       }
//     }

//     return [...new Set(suggestions)]; // 去重
//   }

//   /**
//    * 检查用户是否可以执行敏感操作
//    */
//   canPerformSensitiveOperation(user: User): {
//     canPerform: boolean;
//     reason?: string;
//   } {
//     if (!user.isActive) {
//       return {
//         canPerform: false,
//         reason: '账户已被停用',
//       };
//     }

//     if (!user.isProfileComplete) {
//       return {
//         canPerform: false,
//         reason: '请先完善个人信息',
//       };
//     }

//     return { canPerform: true };
//   }

//   /**
//    * 生成用户状态描述
//    */
//   getUserStatusDescription(user: User): string {
//     switch (user.status) {
//       case 'active':
//         return '活跃';
//       case 'inactive':
//         return '未激活';
//       case 'suspended':
//         return '已暂停';
//       case 'deactivated':
//         return '已停用';
//       default:
//         return '未知状态';
//     }
//   }

//   /**
//    * 获取用户下一步推荐操作
//    */
//   getRecommendedActions(user: User): Array<{
//     action: string;
//     description: string;
//     priority: 'high' | 'medium' | 'low';
//   }> {
//     const actions: Array<{
//       action: string;
//       description: string;
//       priority: 'high' | 'medium' | 'low';
//     }> = [];

//     if (!user.avatar) {
//       actions.push({
//         action: 'upload_avatar',
//         description: '上传头像让其他人更容易识别你',
//         priority: 'medium',
//       });
//     }

//     const validation = this.validateProfileCompleteness(user);
//     if (!validation.isComplete) {
//       actions.push({
//         action: 'complete_profile',
//         description: `完善个人信息：${validation.missingFields.join('、')}`,
//         priority: 'high',
//       });
//     }

//     return actions.sort((a, b) => {
//       const priorities = { high: 3, medium: 2, low: 1 };
//       return priorities[b.priority] - priorities[a.priority];
//     });
//   }

//   private capitalizeFirst(str: string): string {
//     return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
//   }
// }
