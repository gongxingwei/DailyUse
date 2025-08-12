// import type { IUserRepository } from '../../domain/repositories/IUserRepository';
// import { User } from '../../domain/models/User';
// import { ApiClient } from '../api/ApiClient';
// // import type { UserAggregate } from '@dailyuse/domain-client/account';

// /**
//  * 用户仓储实现 - Web端
//  * 实现用户仓储接口，封装API调用
//  */
// export class UserRepository implements IUserRepository {
//   constructor(private apiClient: ApiClient) {}

//   /**
//    * 根据ID获取用户
//    */
//   async findById(id: string): Promise<User | null> {
//     try {
//       const userData = await this.apiClient.getUserById(id);
//       return this.mapResponseToUser(userData);
//     } catch (error) {
//       if (this.isNotFoundError(error)) {
//         return null;
//       }
//       throw new Error(`获取用户失败: ${error instanceof Error ? error.message : '未知错误'}`);
//     }
//   }

//   /**
//    * 根据用户名获取用户
//    */
//   async findByUsername(username: string): Promise<User | null> {
//     try {
//       const userData = await this.apiClient.getUserByUsername(username);
//       return this.mapResponseToUser(userData);
//     } catch (error) {
//       if (this.isNotFoundError(error)) {
//         return null;
//       }
//       throw new Error(`获取用户失败: ${error instanceof Error ? error.message : '未知错误'}`);
//     }
//   }

//   /**
//    * 根据邮箱获取用户
//    */
//   async findByEmail(email: string): Promise<User | null> {
//     try {
//       const userData = await this.apiClient.getUserByEmail(email);
//       return this.mapResponseToUser(userData);
//     } catch (error) {
//       if (this.isNotFoundError(error)) {
//         return null;
//       }
//       throw new Error(`获取用户失败: ${error instanceof Error ? error.message : '未知错误'}`);
//     }
//   }

//   /**
//    * 获取当前登录用户
//    */
//   async getCurrentUser(): Promise<User | null> {
//     try {
//       const userData = await this.apiClient.getCurrentUser();
//       return this.mapResponseToUser(userData);
//     } catch (error) {
//       if (this.isNotFoundError(error)) {
//         return null;
//       }
//       throw new Error(`获取当前用户失败: ${error instanceof Error ? error.message : '未知错误'}`);
//     }
//   }

//   /**
//    * 更新用户信息
//    */
//   async update(user: any): Promise<void> {
//     try {
//       // 这里需要将领域对象转换为API所需的格式
//       const updateData = this.mapUserAggregateToUpdateDto(user);
//       await this.apiClient.updateUserProfile(user.id.value, updateData);
//     } catch (error) {
//       throw new Error(`更新用户失败: ${error instanceof Error ? error.message : '未知错误'}`);
//     }
//   }

//   /**
//    * 更新用户头像
//    */
//   async updateAvatar(userId: string, avatar: string): Promise<void> {
//     try {
//       await this.apiClient.updateAvatarUrl(userId, avatar);
//     } catch (error) {
//       throw new Error(`更新头像失败: ${error instanceof Error ? error.message : '未知错误'}`);
//     }
//   }

//   /**
//    * 停用用户账号
//    */
//   async deactivate(userId: string): Promise<void> {
//     try {
//       await this.apiClient.deactivateUser(userId);
//     } catch (error) {
//       throw new Error(`停用用户失败: ${error instanceof Error ? error.message : '未知错误'}`);
//     }
//   }

//   /**
//    * 激活用户账号
//    */
//   async activate(userId: string): Promise<void> {
//     try {
//       await this.apiClient.activateUser(userId);
//     } catch (error) {
//       throw new Error(`激活用户失败: ${error instanceof Error ? error.message : '未知错误'}`);
//     }
//   }

//   /**
//    * 检查用户名是否可用
//    */
//   async isUsernameAvailable(username: string): Promise<boolean> {
//     try {
//       const result = await this.apiClient.checkUsernameAvailability(username);
//       return result.available;
//     } catch (error) {
//       throw new Error(
//         `检查用户名可用性失败: ${error instanceof Error ? error.message : '未知错误'}`,
//       );
//     }
//   }

//   /**
//    * 检查邮箱是否已被使用
//    */
//   async isEmailTaken(email: string): Promise<boolean> {
//     try {
//       const result = await this.apiClient.checkEmailAvailability(email);
//       return !result.available;
//     } catch (error) {
//       throw new Error(`检查邮箱可用性失败: ${error instanceof Error ? error.message : '未知错误'}`);
//     }
//   }

//   /**
//    * 将API响应映射为User领域模型
//    */
//   private mapResponseToUser(userData: any): User {
//     // 这里需要根据实际的domain-client结构来构建UserAggregate
//     // 现在先用一个简化的映射
//     const mockAggregate = {
//       id: { value: userData.id },
//       username: { value: userData.username },
//       status: userData.status,
//       personalInfo: {
//         firstName: userData.firstName,
//         lastName: userData.lastName,
//         displayName: userData.displayName,
//         email: userData.email ? { value: userData.email } : undefined,
//         phoneNumber: userData.phoneNumber ? { value: userData.phoneNumber } : undefined,
//         bio: userData.bio,
//         avatar: userData.avatar,
//         sex: userData.sex,
//         birthday: userData.birthday,
//       },
//     } as any; // 临时类型断言，实际应该构建真正的UserAggregate

//     return new User(mockAggregate);
//   }

//   /**
//    * 将UserAggregate映射为更新DTO
//    */
//   private mapUserAggregateToUpdateDto(aggregate: any): any {
//     return {
//       firstName: aggregate.personalInfo?.firstName,
//       lastName: aggregate.personalInfo?.lastName,
//       displayName: aggregate.personalInfo?.displayName,
//       email: aggregate.personalInfo?.email?.value,
//       phoneNumber: aggregate.personalInfo?.phoneNumber?.value,
//       bio: aggregate.personalInfo?.bio,
//       sex: aggregate.personalInfo?.sex,
//       birthday: aggregate.personalInfo?.birthday,
//     };
//   }

//   /**
//    * 检查是否为404错误
//    */
//   private isNotFoundError(error: any): boolean {
//     return error?.response?.status === 404;
//   }
// }
