import { TaskTemplate } from "@dailyuse/domain-client"
import { TaskTimeType, TaskScheduleMode } from "@dailyuse/contracts/modules/task";

export function useTaskUtils() {
    const getTaskTemplateTimeText = (template: TaskTemplate) => {
        if (!template.timeConfig) {
            return "无时间配置";
        }
        if (template.timeConfig.time.timeType === TaskTimeType.SPECIFIC_TIME) {
            return `具体时间: ${template.timeConfig.time.startTime}`;
        } else if (template.timeConfig.time.timeType === TaskTimeType.TIME_RANGE) {
            return `时间范围: ${template.timeConfig.time.startTime} - ${template.timeConfig.time.endTime}`;
        } else if (template.timeConfig.time.timeType === TaskTimeType.ALL_DAY) {
            return "全天";
        }
    }

    const getTaskTemplateRecurrenceText = (template: TaskTemplate) => {
        if (!template.timeConfig) {
            return "无时间配置";
        }
        switch (template.timeConfig.schedule.mode) {
            case TaskScheduleMode.ONCE:
                return "单次";
            case TaskScheduleMode.DAILY:
                return "每日";
            case TaskScheduleMode.WEEKLY:
                if (template.timeConfig.schedule.weekdays && template.timeConfig.schedule.weekdays.length > 0) {
                    const weekdaysMap = ['日', '一', '二', '三', '四', '五', '六'];
                    const days = template.timeConfig.schedule.weekdays.map(d => weekdaysMap[d]).join('、');
                    return `每周的 ${days}`;
                } else {
                    return "每周";
                }
            case TaskScheduleMode.MONTHLY:
                if (template.timeConfig.schedule.monthDays && template.timeConfig.schedule.monthDays.length > 0) {
                    const days = template.timeConfig.schedule.monthDays.map(d => `${d}日`).join('、');
                    return `每月的 ${days}`;
                } else {
                    return "每月";
                }
            case TaskScheduleMode.INTERVAL_DAYS:
                return `每隔 ${template.timeConfig.schedule.intervalDays} 天`;
            default:
                return "未知";
        }
    }

    

    return {
        getTaskTemplateTimeText,
        getTaskTemplateRecurrenceText,
    }
}