import { ipcMain, BrowserWindow } from "electron";
import nodeSchedule from "node-schedule";

// 存储所有的定时任务
const scheduleJobs = new Map<string, nodeSchedule.Job>();

function getValidWindow(): BrowserWindow | null {
    const windows = BrowserWindow.getAllWindows();
    return windows.find(win => !win.isDestroyed()) || null;
}

export function setupScheduleHandlers() {
    // 创建定时任务
    ipcMain.handle('create-schedule', async (_event, options: {
        id: string
        cron: string
        task: {
            type: string
            payload: any
          }
        lastRun: string
    }) => {
        try {
            // 如果已存在相同ID的任务，先删除
            if (scheduleJobs.has(options.id)) {
                scheduleJobs.get(options.id)?.cancel();
            }

            // 创建新的定时任务
            const job = nodeSchedule.scheduleJob(options.cron, () => {
                // 任务执行时通知渲染进程
                const win = getValidWindow();
                if (win) {
                    try {
                        win.webContents.send('schedule-triggered', {
                            id: options.id,
                            task: options.task
                        });
                    } catch (error) {
                        console.error('Failed to send schedule-triggered event:', error);
                    }
                }
            });

            scheduleJobs.set(options.id, job);
            return true;
        } catch (error) {
            console.error('Failed to create schedule:', error);
            return false;
        }
    });

    // 删除定时任务
    ipcMain.handle('cancel-schedule', (_event, id: string) => {
        const job = scheduleJobs.get(id);
        if (job) {
            job.cancel();
            scheduleJobs.delete(id);
            return true;
        }
        return false;
    });

    // 修改定时任务
    ipcMain.handle('update-schedule', async (_event, options: {
        id: string
        cron: string
        task: {
            type: string
            payload: any
          }
        lastRun: string
    }) => {
        try {
            // 如果已存在相同ID的任务，先删除
            if (scheduleJobs.has(options.id)) {
                scheduleJobs.get(options.id)?.cancel();
            }

            // 创建新的定时任务
            const job = nodeSchedule.scheduleJob(options.cron, () => {
                const win = getValidWindow();
                if (win) {
                    try {
                        win.webContents.send('schedule-triggered', {
                            id: options.id,
                            task: options.task
                        });
                    } catch (error) {
                        console.error('Failed to send schedule-triggered event:', error);
                    }
                }
            });

            scheduleJobs.set(options.id, job);
            return true;
        } catch (error) {
            console.error('Failed to create schedule:', error);
            return false;
        }
    });

    // 获取所有定时任务
    ipcMain.handle('get-schedules', () => {
        return Array.from(scheduleJobs.keys());
    });
}