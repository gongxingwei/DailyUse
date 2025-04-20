/**
 * 认证服务类
 * 负责处理用户认证相关的所有操作，包括：
 * - 用户注册
 * - 用户登录
 * - 用户登出
 * - 认证状态检查
 * - 密码加密
 */
import { v4 as uuidv4 } from 'uuid';
import type { IUser, ILoginForm, IRegisterForm } from '@/modules/Account/types/auth';
import { localAccountStorageService } from './localAccountStorageService';
import crypto from 'crypto';

class AuthService {
    // 单例实例
    private static instance: AuthService;

    /**
     * 私有构造函数，确保单例模式
     */
    private constructor() {}

    /**
     * 获取 AuthService 的单例实例
     * @returns AuthService 实例
     */
    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    /**
     * 密码加密方法
     * 使用 SHA-256 算法对密码进行单向加密
     * @param password 原始密码
     * @returns 加密后的密码哈希值
     */
    private hashPassword(password: string): string {
        return crypto
            .createHash('sha256')
            .update(password)
            .digest('hex');
    }

    /**
     * 用户注册
     * @param form 注册表单数据，包含用户名、密码和邮箱
     * @returns 注册成功的用户信息（不包含密码）
     * @throws 当用户名已存在或注册过程出错时抛出错误
     */
    async register(form: IRegisterForm): Promise<IUser> {
        try {
            // 读取现有用户数据
            const users = await localAccountStorageService.readUsers();

            // 检查用户名是否已存在
            if (users[form.username]) {
                throw new Error('用户名已存在');
            }

            const userId = uuidv4();
            const now = new Date().toISOString();

            // 创建新用户对象
            const newUser = {
                id: userId,
                username: form.username,
                email: form.email,
                passwordHash: this.hashPassword(form.password),
                createdAt: now,
                updatedAt: now
            };
            // 保存用户数据
            users[form.username] = newUser;
            await localAccountStorageService.writeUsers(users);

            // 创建用户目录
            await localAccountStorageService.createUserDirectory(userId);

            // 返回用户信息（不包含密码）
            const { passwordHash, ...userWithoutPassword } = newUser;
            return userWithoutPassword;
        } catch (error) {
            console.error('注册失败:', error);
            throw new Error(error instanceof Error ? error.message : '注册失败');
        }
    }

    /**
     * 用户登录
     * @param credentials 登录凭证，包含用户名和密码
     * @returns 登录成功的用户信息（不包含密码）
     * @throws 当用户名或密码错误时抛出错误
     */
    async login(credentials: ILoginForm): Promise<IUser> {
        const users = await localAccountStorageService.readUsers();
        const user = users[credentials.username];

        if (!user || user.passwordHash !== this.hashPassword(credentials.password)) {
            throw new Error('用户名或密码错误');
        }

        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    /**
     * 用户登出
     * 目前为本地登出，无需特殊处理
     */
    async logout(): Promise<void> {
        return;
    }

    /**
     * 检查用户认证状态
     * @returns 当前登录的用户信息，如果未登录则返回 null
     * TODO: 实现持久化存储的认证状态检查
     */
    async checkAuth(): Promise<IUser | null> {
        // 从持久化存储中检查用户状态
        return null;
    }
}

// 导出 AuthService 的单例实例
export const authService = AuthService.getInstance();