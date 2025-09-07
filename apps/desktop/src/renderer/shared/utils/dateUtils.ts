/**
 * 日期格式化模板
 * @param date 日期对象或日期字符串
 * @param template 格式化模板，支持：YYYY-MM-DD HH:mm:ss
 * @example
 * formatDateWithTemplate(new Date(), 'YYYY-MM-DD') // '2024-04-16'
 * formatDateWithTemplate(new Date(), 'YYYY年MM月DD日 HH:mm') // '2024年04月16日 14:30'
 */
export const formatDateWithTemplate = (date: Date | string, template: string): string => {
    const d = new Date(date);
    const tokens = {
        YYYY: d.getFullYear(),
        MM: (d.getMonth() + 1).toString().padStart(2, '0'),
        DD: d.getDate().toString().padStart(2, '0'),
        HH: d.getHours().toString().padStart(2, '0'),
        mm: d.getMinutes().toString().padStart(2, '0'),
        ss: d.getSeconds().toString().padStart(2, '0'),
    };

    return Object.entries(tokens).reduce((result, [token, value]) => {
        return result.replace(token, value.toString());
    }, template);
};

/**
 * 获取两个日期之间的天数差
 * @param start 开始日期
 * @param end 结束日期
 */
export const getDaysDiff = (start: Date | string, end: Date | string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * 获取相对今天的日期
 * @param days 天数，正数为未来，负数为过去
 */
export const getRelativeDate = (days: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};

/**
 * 判断日期是否是今天
 * @param date 日期对象或日期字符串
 */
export const isToday = (date: Date | string): boolean => {
    const d = new Date(date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
};

/**
 * 获取日期所在月份的天数
 * @param date 日期对象或日期字符串
 */
export const getDaysInMonth = (date: Date | string): number => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
};

/**
 * 标准化日期对象（设置时分秒毫秒为0）
 * @param date 日期对象或日期字符串
 */
export const normalizeDate = (date: Date | string): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};
