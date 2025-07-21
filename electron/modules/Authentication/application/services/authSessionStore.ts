import { AuthInfo } from "../../domain/types";

export class AuthSessionStore {
  private static instance: AuthSessionStore;
  private authInfo: AuthInfo | null = null;

  private constructor() {}

  public static getInstance(): AuthSessionStore {
    if (!AuthSessionStore.instance) {
      AuthSessionStore.instance = new AuthSessionStore();
    }
    return AuthSessionStore.instance;
  }

  public setAuthInfo(authInfo: AuthInfo): void {
    this.authInfo = authInfo;
  }

  public getAuthInfo(): AuthInfo | null {
    return this.authInfo;
  }

  public clearAuthInfo(): void {
    this.authInfo = null;
  }
}

export const authSession = AuthSessionStore.getInstance();