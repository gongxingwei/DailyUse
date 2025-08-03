import { eventBus } from "@common/shared/events/eventBus";
import { SessionLoggingApplicationService } from "../services/sessionLoggingApplicationService";
import type { LoginAttemptEvent, UserLoggedInEvent, LoginCredentialVerificationEvent } from "../../../Authentication/index"

export class SessionLoggingEventHandler {
  
  static registerHandlers(): void {
    const sessionLoggingApplicationService = SessionLoggingApplicationService.getSessionLoggingApplicationService();
    eventBus.subscribe('LoginAttempt', async (event: LoginAttemptEvent) => {
      await sessionLoggingApplicationService.handleLoginAttemptEvent(event);
    });

    eventBus.subscribe('UserLoggedIn', async (event: UserLoggedInEvent) => {
      await sessionLoggingApplicationService.handleUserLoggedInEvent(event);
    });

    eventBus.subscribe('LoginCredentialVerification', async (event: LoginCredentialVerificationEvent) => {
      await sessionLoggingApplicationService.handleCredentialVerificationEvent(event);
    });
  }

  
}

