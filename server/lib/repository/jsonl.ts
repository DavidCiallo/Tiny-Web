// @ts-nocheck
import type { RepositoryDriver } from "./driver";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const _filename = fileURLToPath(import.meta.url);
const DATA_DIR = path.resolve(path.dirname(_filename), "../../../../data");

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

// Reverse line reader (newest data appended at end → natural DESC)
async function* readLinesReverse<T>(name: string, skipDeleted: boolean): AsyncGenerator<T, void, void> {
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
            const chunk = buf.toString("utf-8", 0, readSize) + remainder;
            remainder = "";

            const lines = chunk.split("\n");
            // Keep first segment (may be incomplete), iterate the rest in reverse
            remainder = lines[0];
            for (let i = lines.length - 1; i >= 1; i--) {
                const trimmed = lines[i].trim();
                if (!trimmed) continue;
                const row = JSON.parse(trimmed);
                if (skipDeleted && row.id && deleted.has(row.id)) continue;
                yield row;
            }
        }
        // Handle the final remainder
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

function matches(row: Row, where?: Record<string, any>): boolean {
    if (!where) return true;
    for (const [key, val] of Object.entries(where)) {
        if (val === undefined || val === null || val === "") continue;
        if (row[key] !== val) return false;
    }
    return true;
}

const locks = new Map<string, Promise<any>>();

async function withLock<R>(collection: string, fn: () => Promise<R>): Promise<R> {
    const prev = locks.get(collection) || Promise.resolve();
    let release!: () => void;
    const next = new Promise<void>(resolve => { release = resolve; });
    locks.set(collection, prev.then(() => next));
    await prev;
    try {
        return await fn();
    } finally {
        release();
        // Keep the lock chain moving; clean up if this was the last queued task
        if (locks.get(collection) === next.then(() => undefined)) {
            locks.delete(collection);
        }
    }
}

export const JsonlDriver: RepositoryDriver = {
    async find(collection, where, config) {
        const limit = config?.limit;
        const offset = config?.offset || 0;
        const since = config?.since;

        // For pagination we need offset+limit matches; iterate newest-first.
        const results: Row[] = [];
        const need = limit === undefined ? Infinity : offset + limit;

        for await (const row of readLinesReverse<Row>(collection, true)) {
            if (row.delete_time) continue;
            if (since && row.create_time < since) continue;
            if (!matches(row, where)) continue;
            results.push(row);
            if (results.length >= need) break;
        }

        return limit === undefined ? results : results.slice(offset, offset + limit);
    },

    async findOne(collection, where, reverse = false) {
        const iter = reverse
            ? readLinesReverse<Row>(collection, true)
            : readLines<Row>(collection, true);
        for await (const row of iter) {
            if (row.delete_time) continue;
            if (matches(row, where)) return row;
        }
        return null;
    },

    async findIgnoreDelete(collection, where) {
        for await (const row of readLines<Row>(collection, false)) {
            if (matches(row, where)) return row;
        }
        return null;
    },

    async findAllIgnoreDelete(collection) {
        const results: Row[] = [];
        for await (const row of readLines<Row>(collection, false)) {
            results.push(row);
        }
        return results;
    },

    async findByIds(collection, ids) {
        const idSet = new Set(ids);
        const results: Row[] = [];
        for await (const row of readLines<Row>(collection, true)) {
            if (row.delete_time) continue;
            if (row.id && idSet.has(row.id)) results.push(row);
        }
        return results;
    },

    async *findAllIgnoreDeleteBatch(collection, batchSize = 1000) {
        let batch: Row[] = [];
        for await (const row of readLines<Row>(collection, false)) {
            batch.push(row);
            if (batch.length >= batchSize) {
                yield batch;
                batch = [];
            }
        }
        if (batch.length > 0) yield batch;
    },

    async insert(collection, entity) {
        return withLock(collection, async () => {
            const now = Date.now();
            const id = entity.id || nanoid(6);
            const row: Row = {
                ...entity,
                id,
                create_time: entity.create_time || now,
                update_time: entity.update_time || now,
                delete_time: null,
            };
            fs.appendFileSync(collectionFile(collection), JSON.stringify(row) + "\n");
            return row;
        });
    },

    async update(collection, where, updateData, includeDeleted = false) {
        return withLock(collection, async () => {
            const now = Date.now();
            const file = collectionFile(collection);
            if (!fs.existsSync(file)) return false;

            const deleted = readDeleted(collection);
            const content = fs.readFileSync(file, "utf-8");
            const lines = content.split("\n");
            const out: string[] = [];
            let updated = false;

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                const row = JSON.parse(trimmed);
                if (row.id && deleted.has(row.id)) continue;
                if (!includeDeleted && row.delete_time) {
                    out.push(line);
                    continue;
                }
                if (matches(row, where)) {
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
    },

    async delete(collection, where) {
        const now = Date.now();
        return this.update(collection, where, { delete_time: now });
    },

    async truncate(collection) {
        return withLock(collection, async () => {
            const file = collectionFile(collection);
            if (fs.existsSync(file)) fs.writeFileSync(file, "");
        });
    },

    async hardDelete(collection, where) {
        return withLock(collection, async () => {
            const file = collectionFile(collection);
            if (!fs.existsSync(file)) return false;

            const content = fs.readFileSync(file, "utf-8");
            const lines = content.split("\n");
            const out: string[] = [];
            let deleted = false;

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                const row = JSON.parse(trimmed);
                if (matches(row, where)) {
                    if (row.id) appendDeleted(collection, row.id);
                    deleted = true;
                } else {
                    out.push(line);
                }
            }

            fs.writeFileSync(file, out.join("\n") + "\n");
            return deleted;
        });
    },

    async batchInsert(collection, entities) {
        return withLock(collection, async () => {
            if (entities.length === 0) return 0;
            const now = Date.now();
            const lines = entities.map(entity => {
                const row: Row = {
                    ...entity,
                    id: entity.id || nanoid(6),
                    create_time: entity.create_time || now,
                    update_time: entity.update_time || now,
                    delete_time: null,
                };
                return JSON.stringify(row);
            });
            fs.appendFileSync(collectionFile(collection), lines.join("\n") + "\n");
            return entities.length;
        });
    },

    async count(collection, where, since) {
        let count = 0;
        for await (const row of readLines<Row>(collection, true)) {
            if (row.delete_time) continue;
            if (since && row.create_time < since) continue;
            if (!matches(row, where)) continue;
            count++;
        }
        return count;
    },
};
