import { AccountGetterEventHandler } from "./accountGetterEventHandler";
import { AccountInfoGetterEventHandlers } from "./accountInfoGetterEventHandler";
import { AccountStatusVerificationHandler } from "./accountStatusVerificationHandler";

export function registerAccountEventHandlers(): void {
  AccountInfoGetterEventHandlers.registerHandlers();
  AccountStatusVerificationHandler.registerHandlers();
  AccountGetterEventHandler.registerHandlers();
}