import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const _filename = fileURLToPath(import.meta.url);
const DATA_DIR = path.resolve(path.dirname(_filename), "../../data");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

type Row = Record<string, any>;

function collectionFile(name: string): string {
    return path.join(DATA_DIR, `${name}.jsonl`);
}

function hardDeleteFile(name: string): string {
    return path.join(DATA_DIR, `${name}.deleted`);
}

function readDeleted(name: string): Set<string> {
    const file = hardDeleteFile(name);
    if (!fs.existsSync(file)) return new Set();
    const ids = fs.readFileSync(file, "utf-8").trim().split("\n").filter(Boolean);
    return new Set(ids);
}

function appendDeleted(name: string, id: string) {
    fs.appendFileSync(hardDeleteFile(name), id + "\n");
}

// 从文件末尾反向读取（最新的数据在末尾，自然 DESC）
async function* readLinesReverse(name: string, skipDeleted: boolean): AsyncGenerator<T, void, void> {
    const file = collectionFile(name);
    if (!fs.existsSync(file)) return;

    const deleted = skipDeleted ? readDeleted(name) : new Set<string>();
    const stat = fs.statSync(file);
    if (stat.size === 0) return;

    const fd = fs.openSync(file, "r");
    const buf = Buffer.alloc(65536);
    let pos = stat.size;
    let remainder = "";

    try {
        while (pos > 0) {
            const readSize = Math.min(65536, pos);
            pos -= readSize;
            fs.readSync(fd, buf, 0, readSize, pos);
            let chunk = buf.toString("utf-8", 0, readSize) + remainder;
            remainder = "";

            const lines = chunk.split("\n");
            // 保留第一段（可能不完整），其余倒序遍历
            remainder = lines[0];
            for (let i = lines.length - 1; i >= 1; i--) {
                const trimmed = lines[i].trim();
                if (!trimmed) continue;
                const row = JSON.parse(trimmed);
                if (skipDeleted && row.id && deleted.has(row.id)) continue;
                yield row;
            }
        }
        // 处理最后一段
        if (remainder.trim()) {
            const row = JSON.parse(remainder.trim());
            if (!(skipDeleted && row.id && deleted.has(row.id))) {
                yield row;
            }
        }
    } finally {
        fs.closeSync(fd);
    }
}

async function* readLines<T>(name: string, skipDeleted: boolean): AsyncGenerator<T, void, void> {
    const file = collectionFile(name);
    if (!fs.existsSync(file)) return;

    const deleted = skipDeleted ? readDeleted(name) : new Set<string>();

    const stream = Bun.file(file).stream();
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                const row = JSON.parse(trimmed);
                if (skipDeleted && row.id && deleted.has(row.id)) continue;
                yield row;
            }
        }
    } finally {
        reader.cancel().catch(() => {});
    }
}

class Repository<T extends Row> {
    private collection: string;
    private static instances = new Map<string, any>();
    private writeLock = Promise.resolve();

    private constructor(collection: string) {
        this.collection = collection;
    }

    private async withLock<R>(fn: () => Promise<R>): Promise<R> {
        const prev = this.writeLock;
        let release: () => void;
        this.writeLock = new Promise<void>(resolve => { release = resolve; });
        await prev;
        try {
            return await fn();
        } finally {
            release!();
        }
    }

    public static instance<T extends Row>(entityName: string): Repository<T> {
        const key = entityName.toLowerCase().replace("entity", "");
        if (!Repository.instances.has(key)) {
            Repository.instances.set(key, new Repository(key));
        }
        return Repository.instances.get(key);
    }

    private filePath(): string {
        return collectionFile(this.collection);
    }

    async find(where?: Partial<T>, page: number = 1, pageSize: number = 10): Promise<T[]> {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 1;

        const results: T[] = [];
        const need = page * pageSize; // 最多读这么多行

        for await (const row of readLinesReverse<T>(this.collection, true)) {
            if (row.delete_time) continue;

            if (where) {
                let match = true;
                for (const [key, val] of Object.entries(where)) {
                    if (val === undefined || val === null || val === "") continue;
                    if ((row as any)[key] !== val) {
                        match = false;
                        break;
                    }
                }
                if (!match) continue;
            }

            results.push(row);
            if (results.length >= need) break;
        }

        const skip = (page - 1) * pageSize;
        return results.slice(skip, skip + pageSize);
    }

    async findOne(where: Partial<T>): Promise<T | null> {
        for await (const row of readLines<T>(this.collection, true)) {
            if (row.delete_time) continue;

            let match = true;
            for (const [key, val] of Object.entries(where)) {
                if (val === undefined || val === null || val === "") continue;
                if ((row as any)[key] !== val) {
                    match = false;
                    break;
                }
            }
            if (match) return row;
        }
        return null;
    }

    async findIgnoreDelete(where: Partial<T>): Promise<T | null> {
        for await (const row of readLines<T>(this.collection, false)) {
            let match = true;
            for (const [key, val] of Object.entries(where)) {
                if (val === undefined || val === null || val === "") continue;
                if ((row as any)[key] !== val) {
                    match = false;
                    break;
                }
            }
            if (match) return row;
        }
        return null;
    }

    async findAllIgnoreDelete(): Promise<T[]> {
        const results: T[] = [];
        for await (const row of readLines<T>(this.collection, false)) {
            results.push(row);
        }
        return results;
    }

    async *findAllIgnoreDeleteBatch(batchSize = 1000): AsyncGenerator<T[], void, void> {
        let batch: T[] = [];
        for await (const row of readLines<T>(this.collection, false)) {
            batch.push(row);
            if (batch.length >= batchSize) {
                yield batch;
                batch = [];
            }
        }
        if (batch.length > 0) yield batch;
    }

    async insert(entity: Partial<T>): Promise<T> {
        return this.withLock(async () => {
            const now = Date.now();
            const id = (entity as any)?.id || nanoid(6);
            const row = {
                ...entity,
                id,
                create_time: (entity as any)?.create_time || now,
                update_time: (entity as any)?.update_time || now,
                delete_time: null,
            };
            fs.appendFileSync(this.filePath(), JSON.stringify(row) + "\n");
            return row as T;
        });
    }

    async update(where: Partial<T>, updateData: Partial<T>, includeDeleted = false): Promise<boolean> {
        return this.withLock(async () => {
            const now = Date.now();
            let updated = false;
            const file = this.filePath();
            if (!fs.existsSync(file)) return false;

            const deleted = readDeleted(this.collection);
            const content = fs.readFileSync(file, "utf-8");
            const lines = content.split("\n");
            const out: string[] = [];

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                const row = JSON.parse(trimmed);
                if (row.id && deleted.has(row.id)) {
                    continue;
                }
                if (!includeDeleted && row.delete_time) {
                    out.push(line);
                    continue;
                }

                let match = true;
                for (const [key, val] of Object.entries(where)) {
                    if (row[key] !== val) {
                        match = false;
                        break;
                    }
                }

                if (match) {
                    Object.assign(row, updateData, { update_time: now });
                    out.push(JSON.stringify(row));
                    updated = true;
                } else {
                    out.push(line);
                }
            }

            fs.writeFileSync(file, out.join("\n") + "\n");
            return updated;
        });
    }

    async delete(where: Partial<T>): Promise<boolean> {
        // Soft delete: mark delete_time, also record in .deleted for hard-skip
        const now = Date.now();
        return this.update(where, { delete_time: now } as any);
    }

    async hardDelete(where: Partial<T>): Promise<boolean> {
        return this.withLock(async () => {
            let deleted = false;
            const file = this.filePath();
            if (!fs.existsSync(file)) return false;

            const content = fs.readFileSync(file, "utf-8");
            const lines = content.split("\n");
            const out: string[] = [];

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                const row = JSON.parse(trimmed);

                let match = true;
                for (const [key, val] of Object.entries(where)) {
                    if (row[key] !== val) {
                        match = false;
                        break;
                    }
                }

                if (match) {
                    appendDeleted(this.collection, row.id);
                    deleted = true;
                } else {
                    out.push(line);
                }
            }

            fs.writeFileSync(file, out.join("\n") + "\n");
            return deleted;
        });
    }

    async findByIds(ids: string[]): Promise<T[]> {
        const idSet = new Set(ids);
        const results: T[] = [];
        for await (const row of readLines<T>(this.collection, true)) {
            if (row.delete_time) continue;
            if (row.id && idSet.has(row.id)) {
                results.push(row);
            }
        }
        return results;
    }

    async batchInsert(entities: Partial<T>[]): Promise<number> {
        return this.withLock(async () => {
            if (entities.length === 0) return 0;
            const now = Date.now();
            const lines = entities.map((entity) => {
                const row = {
                    ...entity,
                    id: (entity as any)?.id || nanoid(6),
                    create_time: (entity as any)?.create_time || now,
                    update_time: (entity as any)?.update_time || now,
                    delete_time: null,
                };
                return JSON.stringify(row);
            });
            fs.appendFileSync(this.filePath(), lines.join("\n") + "\n");
            return entities.length;
        });
    }

    async count(where?: Partial<T>, since?: number): Promise<number> {
        let count = 0;
        for await (const row of readLines<T>(this.collection, true)) {
            if (row.delete_time) continue;
            if (since && row.create_time < since) continue;
            if (where) {
                let match = true;
                for (const [key, val] of Object.entries(where)) {
                    if (val === undefined || val === null || val === "") continue;
                    if ((row as any)[key] !== val) {
                        match = false;
                        break;
                    }
                }
                if (!match) continue;
            }
            count++;
        }
        return count;
    }
}

export default Repository;
