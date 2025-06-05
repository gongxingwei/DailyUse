import { ScheduleOptions } from '../types/schedule';

/**
 * 定时任务 API 层 - 负责与主进程通信
 */
export class ScheduleApi {
    /**
     * 创建定时任务
     */
    static async createSchedule(options: ScheduleOptions): Promise<boolean> {
        return await window.shared.ipcRenderer.invoke('create-schedule', options);
    }

    /**
     * 更新定时任务
     */
    static async updateSchedule(options: ScheduleOptions): Promise<boolean> {
        return await window.shared.ipcRenderer.invoke('update-schedule', options);
    }

    /**
     * 取消定时任务
     */
    static async cancelSchedule(id: string): Promise<boolean> {
        return await window.shared.ipcRenderer.invoke('cancel-schedule', id);
    }

    /**
     * 获取所有定时任务
     */
    static async getSchedules(): Promise<string[]> {
        return await window.shared.ipcRenderer.invoke('get-schedules');
    }
}