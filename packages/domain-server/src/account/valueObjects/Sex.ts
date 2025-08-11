import { SexCore } from "@dailyuse/domain-core";

export class Sex extends SexCore {
  isClient(): boolean {
    return false;
  }

  isServer(): boolean {
    return true;
  }
}
