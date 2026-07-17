// @ts-nocheck
import type { RepositoryDriver } from "./repository/driver";
import { JsonlDriver } from "./repository/jsonl";

class Repository<
    T extends { id?: string; create_time?: number | null; update_time?: number | null; delete_time?: number | null },
> {
    private collection: string;
    private static instances = new Map<string, any>();
    private static driver: RepositoryDriver = JsonlDriver;

    private constructor(collection: string) {
        this.collection = collection;
    }

    /** Override the active driver (e.g. switch to SQL) */
    static setDriver(driver: RepositoryDriver): void {
        Repository.driver = driver;
    }

    public static instance<
        T extends {
            id?: string;
            create_time?: number | null;
            update_time?: number | null;
            delete_time?: number | null;
        },
    >(collection: string): Repository<T> {
        const key = collection.toLowerCase();
        if (!Repository.instances.has(key)) {
            Repository.instances.set(key, new Repository(key));
        }
        return Repository.instances.get(key);
    }

    async find(where?: Partial<T>, config?: { limit?: number; offset?: number; since?: number }): Promise<T[]> {
        return Repository.driver.find(this.collection, where as Record<string, any>, config) as Promise<T[]>;
    }

    async findOne(where: Partial<T>): Promise<T | null> {
        return Repository.driver.findOne(this.collection, where as Record<string, any>) as Promise<T | null>;
    }

    async findIgnoreDelete(where: Partial<T>): Promise<T | null> {
        return Repository.driver.findIgnoreDelete(this.collection, where as Record<string, any>) as Promise<T | null>;
    }

    async findAllIgnoreDelete(): Promise<T[]> {
        return Repository.driver.findAllIgnoreDelete(this.collection) as Promise<T[]>;
    }

    async findByIds(ids: string[]): Promise<T[]> {
        return Repository.driver.findByIds(this.collection, ids) as Promise<T[]>;
    }

    async *findAllIgnoreDeleteBatch(batchSize = 1000): AsyncGenerator<T[], void, void> {
        for await (const batch of Repository.driver.findAllIgnoreDeleteBatch(this.collection, batchSize)) {
            yield batch as T[];
        }
    }

    async insert(entity: Partial<T>): Promise<T> {
        return Repository.driver.insert(this.collection, entity as Record<string, any>) as Promise<T>;
    }

    async update(where: Partial<T>, updateData: Partial<T>, includeDeleted = false): Promise<boolean> {
        return Repository.driver.update(this.collection, where as Record<string, any>, updateData as Record<string, any>, includeDeleted);
    }

    async delete(where: Partial<T>): Promise<boolean> {
        return Repository.driver.delete(this.collection, where as Record<string, any>);
    }

    async truncate(): Promise<void> {
        return Repository.driver.truncate(this.collection);
    }

    async hardDelete(where: Partial<T>): Promise<boolean> {
        return Repository.driver.hardDelete(this.collection, where as Record<string, any>);
    }

    async batchInsert(entities: Partial<T>[]): Promise<number> {
        return Repository.driver.batchInsert(this.collection, entities as Record<string, any>[]);
    }

    async count(where?: Partial<T>, since?: number): Promise<number> {
        return Repository.driver.count(this.collection, where as Record<string, any>, since);
    }
}

export default Repository;
