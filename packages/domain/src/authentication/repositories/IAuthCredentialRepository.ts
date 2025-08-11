import { AuthCredential } from '../aggregates/AuthCredential';

export interface IAuthCredentialRepository {
  findById(id: string): Promise<AuthCredential | null>;
  findByAccountId(accountId: string): Promise<AuthCredential | null>;
  save(authCredential: AuthCredential): Promise<void>;
  delete(credentialId: string): Promise<void>;
}
