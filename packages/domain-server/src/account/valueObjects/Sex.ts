import { SexCore } from "@dailyuse/domain-core";
import { AccountContracts } from '@dailyuse/contracts';
type ISex = AccountContracts.ISexServer;
export class Sex extends SexCore implements ISex {
  isClient(): boolean {
    return false;
  }

  isServer(): boolean {
    return true;
  }
}
