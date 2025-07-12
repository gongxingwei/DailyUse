import { eventBus } from "../../../../shared/events/eventBus";
import { MainAccountApplicationService } from "../services/mainAccountApplicationService";
import type { AccountIdGetterRequestedEvent } from "../../../Authentication/index";
import type { AccountIdGetterResponseEvent } from "../../index"
export class AccountInfoGetterEventHandlers {
  /**
   * 注册Account模块内部的事件处理器
   */
  static registerHandlers(): void {
    const mainAccountApplicationService = MainAccountApplicationService.getMainAccountApplicationService();
    // 通过 username 获取 account_uuid
    eventBus.subscribe(
      "AccountIdGetterRequested",
      async (event: AccountIdGetterRequestedEvent) => {
        const { username, requestId } = event.payload;
        console.log("开始处理事件AccountIdGetterRequested，从载荷中获取username数据", username);
        try {
          const response = await mainAccountApplicationService.getAccountIdByUsername(username);
            console.log("获取account_uuid结果", response)
          if (!response.success || !response.data) {
            const responseEvent: AccountIdGetterResponseEvent = {
              eventType: "AccountIdGetterResponse",
              aggregateId: username,
              occurredOn: new Date(),
              payload: {
                requestId,
                accountId: null,
                username,
              },
            };
            eventBus.publish(responseEvent);
            return;
          }
          const accountId = response.data.id;
          const responseEvent: AccountIdGetterResponseEvent = {
            eventType: "AccountIdGetterResponse",
            aggregateId: accountId,
            occurredOn: new Date(),
            payload: {
              requestId,
              accountId: accountId,
              username,
            },
          };

          eventBus.publish(responseEvent);
          console.log("发送AccountIdGetterResponse事件", responseEvent);
        } catch (error) {
          const responseEvent: AccountIdGetterResponseEvent = {
            eventType: "AccountIdGetterResponse",
            aggregateId: username,
            occurredOn: new Date(),
            payload: {
              requestId,
              username,
              accountId: null,
            },
          };

          eventBus.publish(responseEvent);
        }
      }
    );
    console.log("[AccountEventHandlers] AccountIdGetterRequested 事件 初始化成功");
  }
  
}
