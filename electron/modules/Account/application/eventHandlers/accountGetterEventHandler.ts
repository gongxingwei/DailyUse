import { AccountInfoGetterRequestedEvent } from "../../../Authentication/domain/events/authenticationEvents";
import { eventBus } from "../../../../shared/events/eventBus";
import { MainAccountApplicationService } from "../services/mainAccountApplicationService";
import { AccountInfoGetterResponseEventPayload, AccountInfoGetterResponseEvent } from "../../domain/events/accountEvents";
import { Account } from "../../domain/aggregates/account";
/**
 * Account 模块的账号信息获取事件处理器
 * 负责处理通过 accountUuid 获取账号信息的请求
 */
export class AccountGetterEventHandler {
  static registerHandlers(): void {
    const mainAccountApplicationService = MainAccountApplicationService.getMainAccountApplicationService();

    eventBus.subscribe<AccountInfoGetterRequestedEvent>(
      "AccountInfoGetterRequested",
      async (event: AccountInfoGetterRequestedEvent) => {
        try {
          const { accountUuid, requestId } = event.payload;
          // 查询账号信息
          const response = await mainAccountApplicationService.getAccountById(accountUuid);
          const account = response.data;
          if (!Account.isAccount(account)) {
            throw new Error("Invalid account");
          }
          const accountDTO = account.toDTO();

          // 构造响应事件
          const responseEvent: AccountInfoGetterResponseEvent = {
            eventType: "AccountInfoGetterResponse",
            aggregateId: accountUuid,
            occurredOn: new Date(),
            payload: {
              accountDTO,
              requestId,
            } as AccountInfoGetterResponseEventPayload,
          };

          await eventBus.publish(responseEvent);
          console.log("📤 [Account] 已发送账号信息响应:", requestId);
        } catch (error) {
          console.error("❌ [Account] 处理账号信息获取请求失败:", error);

          // 发送错误响应
          const errorResponseEvent = {
            eventType: "AccountInfoGetterResponse",
            aggregateId: event.payload.accountUuid,
            occurredOn: new Date(),
            payload: {
              accountUuid: event.payload.accountUuid,
              requestId: event.payload.requestId,
              error: "系统异常，无法获取账号信息",
            },
          };

          await eventBus.publish(errorResponseEvent);
        }
      }
    );
  }
}