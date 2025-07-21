import { eventBus } from "../../../../shared/events/eventBus";
import { MainAccountApplicationService } from "../services/mainAccountApplicationService";
import type { AccountUuidGetterRequestedEvent } from "../../../Authentication/index";
import type { AccountUuidGetterResponseEvent } from "../../index"
export class AccountInfoGetterEventHandlers {
  /**
   * 注册Account模块内部的事件处理器
   */
  static registerHandlers(): void {
    const mainAccountApplicationService = MainAccountApplicationService.getMainAccountApplicationService();
    // 通过 username 获取 account_uuid
    eventBus.subscribe(
      "AccountUuidGetterRequested",
      async (event: AccountUuidGetterRequestedEvent) => {
        const { username, requestId } = event.payload;
        console.log("开始处理事件AccountUuidGetterRequested，从载荷中获取username数据", username);
        try {
          const response = await mainAccountApplicationService.getAccountUuidByUsername(username);
          console.log("获取account_uuid结果", response)
          if (!response.success || !response.data) {
            const responseEvent: AccountUuidGetterResponseEvent = {
              eventType: "AccountUuidGetterResponse",
              aggregateId: username,
              occurredOn: new Date(),
              payload: {
                requestId,
                accountUuid: null,
                username,
              },
            };
            eventBus.publish(responseEvent);
            return;
          }
          const accountUuid = response.data.uuid;
          const responseEvent: AccountUuidGetterResponseEvent = {
            eventType: "AccountUuidGetterResponse",
            aggregateId: accountUuid,
            occurredOn: new Date(),
            payload: {
              requestId,
              accountUuid: accountUuid,
              username,
            },
          };

          eventBus.publish(responseEvent);
          console.log("发送AccountUuidGetterResponse事件", responseEvent);
        } catch (error) {
          const responseEvent: AccountUuidGetterResponseEvent = {
            eventType: "AccountUuidGetterResponse",
            aggregateId: username,
            occurredOn: new Date(),
            payload: {
              requestId,
              username,
              accountUuid: null,
            },
          };

          eventBus.publish(responseEvent);
        }
      }
    );
    console.log("[AccountEventHandlers] AccountUuidGetterRequested 事件 初始化成功");
  }
  
}
