import type { IAccountRepository } from "../../../Account";
import type { IUserRepository } from "../../../Account";
import { SqliteAccountRepository } from "../repositories/sqliteAccountRepository";
import { SqliteUserRepository } from "../repositories/sqliteUserRepository";
export class AccountContainer {
    private static instance: AccountContainer;
    private accountRepository: IAccountRepository;
    private userRepository: IUserRepository;

    private constructor() {
        // 初始化账户仓库
        this.accountRepository = new SqliteAccountRepository();
        this.userRepository = new SqliteUserRepository();
    }

    static getInstance(): AccountContainer {
        if (!AccountContainer.instance) {
            AccountContainer.instance = new AccountContainer();
        }
        return AccountContainer.instance;
    }

    getAccountRepository(): IAccountRepository {
        return this.accountRepository;
    }

    getUserRepository(): IUserRepository {
        return this.userRepository;
    }

    setTaskTemplateRepository(repository: IAccountRepository): void {
        this.accountRepository = repository;
    }

    setUserRepository(repository: IUserRepository): void {
        this.userRepository = repository;
    }
}
