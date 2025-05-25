import { app } from "electron";
import fs from 'fs/promises';
// import fsSync from 'fs';
import path from 'path';

/**
 * 本地数据服务类
 * 负责管理用户的本地数据存储，包括创建、读取、更新、删除用户数据文件
 * 采用单例模式确保全局只有一个实例
 * 
 * 数据存储结构：
 * - userData/localData/用户名/文件名.json
 * 
 * 主要功能：
 * - 用户数据的 CRUD 操作
 * - 自动创建必要的目录和文件
 * - 支持多文件分类存储
 * - 异步操作避免阻塞主进程
 */
export class LocalDataService {
    /** 类的单例实例 */
    private static instance: LocalDataService;
    
    /** 用户本地数据根目录路径 */
    private userLocalDataPath: string;
    
    /** 当前用户的数据目录路径 */
    private currentUserLocalDataPath: string;
    
    /** 当前用户名 */
    private currentUsername: string;

    /**
     * 私有构造函数，防止外部直接实例化
     * 初始化数据路径并创建必要的目录结构
     * 
     * @param username - 用户名，用于创建用户专属的数据目录
     */
    private constructor(username: string) {
        // 设置用户数据根目录为 Electron 应用的 userData 目录下的 localData 文件夹
        this.userLocalDataPath = path.join(app.getPath("userData"), "localData");
        
        // 保存当前用户名
        this.currentUsername = username;
        
        // 创建当前用户的数据目录路径（每个用户有独立的文件夹）
        this.currentUserLocalDataPath = path.join(this.userLocalDataPath, `${username}`);
        
        // 初始化存储结构（异步执行，不等待完成）
        this.initStorage();
    }
    
    /**
     * 获取 LocalDataService 的单例实例
     * 如果实例不存在则创建新实例，否则返回现有实例
     * 
     * @param username - 用户名，仅在首次创建实例时使用
     * @returns LocalDataService 实例
     */
    public static getInstance(username: string): LocalDataService {
        if (!LocalDataService.instance) {
            LocalDataService.instance = new LocalDataService(username);
        }
        return LocalDataService.instance;
    }

    /**
     * 设置当前操作的用户
     * 切换用户时会重新设置数据路径并初始化存储结构
     * 
     * @param username - 新的用户名
     * @throws 当初始化存储失败时抛出错误
     */
    public async setCurrentUser(username: string): Promise<void> {
        // 更新当前用户名
        this.currentUsername = username;
        
        // 重新设置用户数据目录路径（注意：这里应该是目录而不是 .json 文件）
        this.currentUserLocalDataPath = path.join(this.userLocalDataPath, `${username}`);
        
        // 重新初始化存储结构
        await this.initStorage();
    }

    /**
     * 异步初始化存储结构
     * 确保用户数据目录存在，为后续文件操作做准备
     * 
     * @throws 当目录创建失败时抛出错误
     */
    private async initStorage(): Promise<void> {
        try {
            // 确保当前用户的数据目录存在
            await this.ensureDirectoryExists(this.currentUserLocalDataPath);
        } catch (error) {
            console.error('初始化存储失败:', error);
            throw error;
        }
    }

    /**
     * 确保指定目录存在
     * 如果目录不存在则递归创建整个路径
     * 
     * @param dirPath - 需要确保存在的目录路径
     */
    private async ensureDirectoryExists(dirPath: string): Promise<void> {
        try {
            // 尝试访问目录，如果不存在会抛出错误
            await fs.access(dirPath);
        } catch {
            // 目录不存在，递归创建目录及其父目录
            await fs.mkdir(dirPath, { recursive: true });
            console.log(`创建目录: ${dirPath}`);
        }
    }

    /**
     * 确保指定的 JSON 文件存在
     * 如果文件不存在则创建一个空的 JSON 对象文件
     * 
     * @param fileName - 文件名（不包含 .json 扩展名）
     */
    private async ensureFileExists(fileName: string): Promise<void> {
        try {
            // 构造完整的文件路径
            const filePath = path.join(this.currentUserLocalDataPath, `${fileName}.json`);
            
            // 尝试访问文件，如果不存在会抛出错误
            await fs.access(filePath);
        } catch {
            // 文件不存在，创建包含空 JSON 对象的文件
            const filePath = path.join(this.currentUserLocalDataPath, `${fileName}.json`);
            await fs.writeFile(filePath, JSON.stringify({}));
            console.log(`创建文件: ${fileName}.json`);
        }
    }

    /**
     * 读取用户的本地数据文件
     * 支持按文件名分类读取不同类型的数据
     * 
     * @param fileName - 要读取的文件名（不包含 .json 扩展名）
     * @returns 解析后的 JSON 数据对象，读取失败时返回空对象
     */
    public async readUserData(fileName: string): Promise<any> {
        try {
            // 检查是否设置了当前用户
            if (!this.currentUserLocalDataPath) {
                throw new Error('当前用户没有本地数据缓存');
            }

            // 构造文件完整路径并读取文件内容
            const filePath = path.join(this.currentUserLocalDataPath, `${fileName}.json`);
            const data = await fs.readFile(filePath, 'utf-8');
            
            // 解析 JSON 数据并返回
            return JSON.parse(data);
        } catch (error) {
            console.error('读取用户数据失败:', error);
            // 读取失败时返回空对象，避免程序崩溃
            return {};
        }
    }

    /**
     * 保存用户本地数据到指定文件
     * 自动创建必要的目录和文件结构
     * 
     * @param fileName - 文件名（不包含 .json 扩展名）
     * @param data - 要保存的数据对象
     * @returns 保存成功返回 true，失败返回 false
     */
    public async saveUserData(fileName: string, data: any): Promise<boolean> {
        try {
            // 检查是否设置了当前用户
            if (!this.currentUserLocalDataPath) {
                throw new Error('当前用户没有本地数据缓存');
            }
            
            // 确保用户数据目录存在
            await this.ensureDirectoryExists(this.currentUserLocalDataPath);
            
            // 确保目标文件存在（如果不存在会创建空文件）
            await this.ensureFileExists(fileName);
            
            // 构造文件完整路径
            let filePath = path.join(this.currentUserLocalDataPath, `${fileName}.json`);
            
            // 将数据序列化为格式化的 JSON 字符串并写入文件
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            console.log(`用户 ${this.currentUsername} 的数据已保存到 ${fileName}.json`);
            return true;
        } catch (error) {
            console.error('保存用户数据失败:', error);
            return false;
        }
    }

    /**
     * 更新用户数据文件中的特定字段
     * 先读取现有数据，更新指定字段后重新保存
     * 
     * @param fileName - 文件名（不包含 .json 扩展名）
     * @param key - 要更新的字段名
     * @param value - 字段的新值
     * @returns 更新成功返回 true，失败返回 false
     */
    public async updateUserDataField(fileName: string, key: string, value: any): Promise<boolean> {
        try {
            // 读取现有数据
            const existingData = await this.readUserData(fileName);
            
            // 更新指定字段
            existingData[key] = value;
            
            // 保存更新后的数据
            return await this.saveUserData(fileName, existingData);
        } catch (error) {
            console.error('更新用户数据字段失败:', error);
            return false;
        }
    }

    /**
     * 删除用户的所有本地数据
     * 递归删除用户数据目录及其所有内容
     * 
     * 注意：此操作不可逆，请谨慎使用
     * 
     * @returns 删除成功返回 true，失败返回 false
     */
    public async deleteUserData(): Promise<boolean> {
        try {
            // 检查是否设置了当前用户
            if (!this.currentUserLocalDataPath) {
                throw new Error('当前用户没有本地数据缓存');
            }

            // 递归删除用户数据目录及其所有内容
            // force: true 表示忽略不存在的文件/目录
            // recursive: true 表示递归删除子目录
            await fs.rm(this.currentUserLocalDataPath, { recursive: true, force: true });
            console.log(`用户 ${this.currentUsername} 的数据文件已删除`);
            return true;
        } catch (error) {
            console.error('删除用户数据失败:', error);
            return false;
        }
    }

    /**
     * 同步版本的存储初始化方法
     * 用于需要立即完成初始化的场景（阻塞操作）
     * 
     * 注意：此方法是同步的，可能会阻塞主进程，建议优先使用异步版本
     * 
     * @deprecated 建议使用异步版本的 initStorage() 方法
     */
    // private initStorageSync(): void {
    //     try {
    //         // 同步检查并创建用户数据根目录
    //         if (!fsSync.existsSync(this.userLocalDataPath)) {
    //             fsSync.mkdirSync(this.userLocalDataPath, { recursive: true });
    //         }

    //         // 同步检查并创建当前用户的数据目录
    //         if (this.currentUserLocalDataPath && !fsSync.existsSync(this.currentUserLocalDataPath)) {
    //             // 注意：这里创建的是目录而不是文件
    //             fsSync.mkdirSync(this.currentUserLocalDataPath, { recursive: true });
    //         }
    //     } catch (error) {
    //         console.error('同步初始化存储失败:', error);
    //     }
    // }
}