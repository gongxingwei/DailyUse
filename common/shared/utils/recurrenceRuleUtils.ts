import type { RecurrenceRule } from "../types/recurrenceRule";

/**
 * 将 RecurrenceRule 转为简明中文描述
 * 示例: { hour: 9, minute: 0, dayOfWeek: [4] } => "每周四 09:00"
 */
export function recurrenceRuleToText(rule: RecurrenceRule): string {
  if (!rule) return "无";

  // 星期映射
  const weekMap = ["日", "一", "二", "三", "四", "五", "六"];

  // 处理小时和分钟
  let hour = Array.isArray(rule.hour) ? rule.hour[0] : rule.hour;
  let minute = Array.isArray(rule.minute) ? rule.minute[0] : rule.minute;
  let timeText = (hour !== undefined && minute !== undefined)
    ? `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    : hour !== undefined ? `${String(hour).padStart(2, "0")}:00` : "";

  // 处理星期
  let weekText = "";
  if (rule.dayOfWeek !== undefined) {
    const days = Array.isArray(rule.dayOfWeek) ? rule.dayOfWeek : [rule.dayOfWeek];
    weekText = "每周" + days.map(d => weekMap[Number(d)]).join("、");
  }

  // 处理日期
  let dateText = "";
  if (rule.date !== undefined) {
    const dates = Array.isArray(rule.date) ? rule.date : [rule.date];
    dateText = "每月" + dates.join("日");
  }

  // 处理月份
  let monthText = "";
  if (rule.month !== undefined) {
    const months = Array.isArray(rule.month) ? rule.month : [rule.month];
    monthText = "每年" + months.join("月");
  }

  // 优先显示星期，其次日期、月份
  let result = [monthText, dateText, weekText, timeText].filter(Boolean).join(" ");
  return result || "时间未配置";
}