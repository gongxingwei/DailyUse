import { Account } from '../aggregates/Account';
import { Email } from '../valueObjects/Email';

export interface IAccountRepository {
  findByEmail(email: Email): Promise<Account | null>;
  findByUsername(username: string): Promise<Account | null>;
  findById(id: string): Promise<Account | null>;
  exists(email: Email): Promise<boolean>;
  save(account: Account): Promise<void>;
  delete(accountId: string): Promise<void>;
}
