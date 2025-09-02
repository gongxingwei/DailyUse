// events
import type { AccountRegisteredEvent } from '@dailyuse/domain-server';
import { AuthenticationApplicationService } from '../services/AuthenticationApplicationService';
// utils
import { eventBus } from '@dailyuse/utils';

export async function registerAuthenticationEventHandler(): Promise<void> {
  const authenticationApplicationService = await AuthenticationApplicationService.getInstance();

  eventBus.subscribe('AccountRegisteredEvent', async (event: AccountRegisteredEvent) => {
    try {
      await authenticationApplicationService.handleAccountRegistered(event);
    } catch (error) {
      console.error('[authentication:EventHandler] Error handling AccountRegisteredEvent:', error);
    }
  });
}
