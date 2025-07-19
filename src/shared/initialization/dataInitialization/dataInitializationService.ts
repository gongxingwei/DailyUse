import { getGoalDomainApplicationService } from "@/modules/Goal";
import { getTaskDomainApplicationService } from "@/modules/Task";

export async function initAllData() {
    await getGoalDomainApplicationService().syncAllData();
}