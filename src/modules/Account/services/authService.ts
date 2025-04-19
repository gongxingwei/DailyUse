import { IUser, ILoginForm, IRegisterForm } from '../types/auth';

/**
 * 认证服务类
 * 负责处理用户认证相关的操作，包括注册、登录、登出和认证状态检查
 */
class AuthService {
    // 单例实例
    private static instance: AuthService;

    /**
     * 私有构造函数，确保只能通过 getInstance 方法创建实例
     */
    private constructor() { }

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
     * 用户注册
     * @param form - 注册表单数据
     * @returns 注册成功的用户信息
     * @throws 注册失败时抛出错误
     */
    async register(form: IRegisterForm): Promise<IUser> {
        try {
            // 创建一个可序列化的对象
            const registrationData = {
                username: form.username,
                password: form.password,
                email: form.email,
                // 只包含必要的基本类型数据
            };
            // 调用后端 API 进行注册
            const response = await window.shared.ipcRenderer.invoke('auth:register', registrationData);

            if (response.success) {
                return response.user;
            }
            throw new Error(response.message || '注册失败');
        } catch (error) {
            console.error('注册失败:', error);
            throw error;
        }
    }

    /**
     * 用户登录
     * @param credentials - 登录凭证
     * @returns 登录成功的用户信息
     * @throws 登录失败时抛出错误
     */
    async login(credentials: ILoginForm): Promise<IUser> {
        try {
            // 创建一个可序列化的对象
            const loginData = {
                username: credentials.username,
                password: credentials.password,
                // 只包含必要的基本类型数据
            };
            // 调用后端 API 进行登录验证
            const response = await window.shared.ipcRenderer.invoke('auth:login', loginData);

            if (response.success) {
                return response.user;
            }
            throw new Error(response.message || '登录失败');
        } catch (error) {
            console.error('登录失败:', error);
            throw error;
        }
    }

    /**
     * 用户登出
     * 清除用户的登录状态
     */
    async logout(): Promise<void> {
        await window.shared.ipcRenderer.invoke('auth:logout');
    }

    /**
     * 检查用户认证状态
     * @returns 当前登录的用户信息，如果未登录则返回 null
     */
    async checkAuth(): Promise<IUser | null> {
        try {
            const response = await window.shared.ipcRenderer.invoke('auth:check');
            return response.user || null;
        } catch (error) {
            return null;
        }
    }
}

// 导出 AuthService 的单例实例
export const authService = AuthService.getInstance();