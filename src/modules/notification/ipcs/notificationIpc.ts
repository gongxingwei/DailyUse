import { TResponse } from '@/shared/types/response';
import { NotificationWindowOptions } from '../types/notification';
import { serializeForIpc } from '@/shared/utils/ipcSerialization';

export class NotificationIpc {
    public static showNotification(
        options: NotificationWindowOptions 
    ): Promise<TResponse<void>> {
        return window.shared.ipcRenderer.invoke('show-notification', serializeForIpc(options));
    }

    public static closeNotification(uuid: string): Promise<TResponse<void>> {
        return window.shared.ipcRenderer.invoke('close-notification', uuid);
    }

    public static notificationAction(
        uuid: string,
        action: { text: string; type: string }
    ): Promise<TResponse<void>> {
        return window.shared.ipcRenderer.invoke('notification-action', uuid, serializeForIpc(action));
    } 

    public static onNotificationAction(
        callback: (uuid: string, action: { text: string; type: string }) => void
    ): () => void {
        const handler = (_event: any, uuid: string, action: { text: string; type: string}) => {
            callback(uuid, action);
        };
        window.shared.ipcRenderer.on('notification-action-received', handler);
        return () => window.shared.ipcRenderer.removeListener('notification-action-received', handler);
    };
}