export * from '@electron/modules/Authentication/domain/types'

export interface AuthInfo {
    token: string;
    accountUuid: string;
    username: string;
}