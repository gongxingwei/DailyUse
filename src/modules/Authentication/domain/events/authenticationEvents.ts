import { DomainEvent } from "@/shared/domain/domainEvent";

export interface UserLoggedInEventPayload {
  accountUuid: string;
  username: string;
  token: string;
}

export interface UserLoggedInEvent extends DomainEvent<UserLoggedInEventPayload> {
  eventType: "UserLoggedIn";
  payload: UserLoggedInEventPayload;
}

export interface UserLoggedOutEventPayload {
  accountUuid: string;
  token: string;
  username: string;
  sessionId: string;
  logoutType: "manual" | "forced" | "expired" | "system";
  logoutReason?: string;
  loggedOutAt: Date;
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  };
}

export interface SessionTerminatedEventPayload {
  sessionId: string;
  accountUuid: string;
  terminationType: "logout" | "timeout" | "forced" | "concurrent_login";
  terminatedAt: Date;
  remainingActiveSessions: number;
}

export interface LoginCredentialVerificationEventPayload {
  accountUuid: string;
  username: string;
  credentialId: string;
  verificationResult: "success" | "failed" | "account_locked" | "credential_expired";
  failureReason?: string;
  verifiedAt: Date;
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  }
}

