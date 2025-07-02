/// <reference types="vite/client" />
import { TaskInstance } from '@/modules/Task/domain/entities/taskInstance';
import { TaskTemplate } from '@/modules/Task/domain/entities/TaskTemplate';
import type { DateTime } from '@/shared/types/myDateTime';
import type { RecurrenceRule } from '@/shared/types/myDateTime';
declare global {
    type TResponse<T = any> = {
        success: boolean;
        message: string;
        data?: T;
        error?: Error;
    };
    type TaskInstance = import('@/modules/Task/domain/entities/taskInstance').TaskInstance;
    type TaskTemplate = import('@/modules/Task/domain/entities/TaskTemplate').TaskTemplate;
    type DateTime = import('@/shared/types/myDateTime').DateTime;
    type RecurrenceRule = import('@/shared/types/myDateTime').RecurrenceRule;
}


export {}