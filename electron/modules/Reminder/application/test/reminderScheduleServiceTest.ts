import { reminderScheduleService } from "../services/reminderScheduleService";
import { ImportanceLevel } from "@/shared/types/importance";

function test() {
    const reminderInstance = reminderScheduleService.createReminderScheduleByCron(
        "* /1 * * * *", // 每1m
        {
            uuid: "reminder1",
            title: "Daily Reminder",
            body: "This is your daily reminder.",
            importanceLevel: ImportanceLevel.Important // 假设有一个高重要级别
        }
    );
    
    console.log("Reminder created:", reminderInstance);
}

export { test };