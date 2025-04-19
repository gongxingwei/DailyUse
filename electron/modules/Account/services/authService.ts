import { v4 as uuidv4 } from 'uuid';
import type { IUser, ILoginForm, IRegisterForm } from '@/modules/Account/types/auth';
import { localAccountStorageService } from './localAccountStorageService';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

class AuthService {
    private static instance: AuthService;

    private constructor() {}

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    private hashPassword(password: string): string {
        return crypto
            .createHash('sha256')
            .update(password)
            .digest('hex');
    }

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
            console.error('Registration failed:', error);
            throw new Error(error instanceof Error ? error.message : '注册失败');
        }
    }

    async login(credentials: ILoginForm): Promise<IUser> {
        const users = await localAccountStorageService.readUsers();
        const user = users[credentials.username];

        if (!user || user.passwordHash !== this.hashPassword(credentials.password)) {
            throw new Error('用户名或密码错误');
        }

        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async logout(): Promise<void> {
        // 本地登出不需要特殊处理
        return;
    }

    async checkAuth(): Promise<IUser | null> {
        // 从持久化存储中检查用户状态
        return null;
    }
}
export const authService = AuthService.getInstance();