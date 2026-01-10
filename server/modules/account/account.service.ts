import Repository from "../../lib/repository";
import { AccountDTO } from "../../../shared/modules/account/account.dto";
import { AccountEntity } from "../../../shared/modules/account/account.entity";

const accountRepository: Repository<AccountEntity> = Repository.instance("Account");

export class AccountService {
    // 获取列表
    static async findAll(query: any): Promise<{ list: AccountDTO[], total: number }> {
        const list = await accountRepository.find(query) as AccountEntity[];
        return {
            list: list as unknown as AccountDTO[], // 这里通常需要一个转换函数
            total: list.length
        };
    }

    static async findOne(id: string): Promise<AccountDTO> {
        const result = await accountRepository.findOne({ id });
        return result as unknown as AccountDTO;
    }

    static async create(data: Partial<AccountDTO>): Promise<AccountDTO> {
        const result = await accountRepository.insert(data);
        return result as unknown as AccountDTO;
    }

    static async update(id: string, data: Partial<AccountDTO>): Promise<AccountDTO> {
        await accountRepository.update({ id }, data);
        return this.findOne(id);
    }

    static async delete(id: string): Promise<void> {
        await accountRepository.delete({ id });
    }
}