import { ImportanceLevel } from "@/shared/types/importance";

export interface NotificationWindow {
  id: string;
  title: string;
  body: string;
  importance: ImportanceLevel;
  actions?: Array<{ text: string; type: "confirm" | "cancel" | "action" }>;
}
