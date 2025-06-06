import { TResponse } from '@/shared/types/response';
import { NotificationWindowOptions } from '../types/notification';

export class NotificationIpc {
    public static showNotification(
        options: NotificationWindowOptions 
    ): Promise<TResponse<void>> {
        return window.shared.ipcRenderer.invoke('show-notification', options);
    }

    public static closeNotification(id: string): Promise<TResponse<void>> {
        return window.shared.ipcRenderer.invoke('close-notification', id);
    }

    public static notificationAction(
        id: string,
        action: { text: string; type: string }
    ): Promise<TResponse<void>> {
        return window.shared.ipcRenderer.invoke('notification-action', id, action);
    } 

    public static onNotificationAction(
        callback: (id: string, action: { text: string; type: string }) => void
    ): () => void {
        const handler = (_event: any, id: string, action: { text: string; type: string}) => {
            callback(id, action);
        };
        window.shared.ipcRenderer.on('notification-action-received', handler);
        return () => window.shared.ipcRenderer.removeListener('notification-action-received', handler);
    };
}