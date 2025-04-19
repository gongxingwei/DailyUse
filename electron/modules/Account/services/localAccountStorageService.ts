import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';

export class LocalAccountStorageService {
    private static instance: LocalAccountStorageService;
    private userDataPath: string;
    private usersFile: string;

    private constructor() {
        this.userDataPath = path.join(app.getPath('userData'), 'accounts');
        this.usersFile = path.join(this.userDataPath, 'users.json');
        this.initStorage();
    }

    public static getInstance(): LocalAccountStorageService {
        if (!LocalAccountStorageService.instance) {
            LocalAccountStorageService.instance = new LocalAccountStorageService();
        }
        return LocalAccountStorageService.instance;
    }

    private async initStorage() {
        try {
            await fs.mkdir(this.userDataPath, { recursive: true });
            try {
                await fs.access(this.usersFile);
            } catch {
                await fs.writeFile(this.usersFile, JSON.stringify({}));
            }
        } catch (error) {
            console.error('Failed to initialize storage:', error);
        }
    }

    async readUsers(): Promise<Record<string, any>> {
        try {
            const data = await fs.readFile(this.usersFile, 'utf-8');
            return JSON.parse(data);
        } catch {
            return {};
        }
    }

    async writeUsers(users: Record<string, any>): Promise<void> {
        await fs.writeFile(this.usersFile, JSON.stringify(users, null, 2));
    }

    public async createUserDirectory(userId: string): Promise<void> {
        const userDir = path.join(this.userDataPath, userId);
        await fs.mkdir(userDir, { recursive: true });
        await fs.writeFile(
            path.join(userDir, 'config.json'),
            JSON.stringify({ createdAt: new Date().toISOString() })
        );
    }
}

export const localAccountStorageService = LocalAccountStorageService.getInstance();