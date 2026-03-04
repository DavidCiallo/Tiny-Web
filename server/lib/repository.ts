import { Database } from "bun:sqlite";
import path from "path";
import { nanoid } from "nanoid";
import fs from "fs";

const DB_DIR = "data";
const DB_FILE = "tiny_web.db";

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR);
}

// Single database connection for the entire app
const db = new Database(path.join(DB_DIR, DB_FILE));

class Repository<T extends { id?: string; create_time?: number | null; update_time?: number | null; delete_time?: number | null }> {
    private tableName: string;
    private static instances = new Map<string, any>();

    private constructor(entityName: string) {
        this.tableName = entityName.toLowerCase().replace("entity", "");
        // Validate table name to prevent SQL injection
        if (!/^[a-z][a-z0-9_]*$/.test(this.tableName)) {
            throw new Error(`Invalid table name: ${this.tableName}`);
        }
        this.ensureTable();
    }

    public static instance<T extends { id?: string; create_time?: number | null; update_time?: number | null; delete_time?: number | null }>(entityName: string): Repository<T> {
        entityName = entityName.toLowerCase();
        if (!Repository.instances.has(entityName)) {
            Repository.instances.set(entityName, new Repository(entityName));
        }
        return Repository.instances.get(entityName);
    }

    /**
     * Minimalist table creation.
     * Note: In a production app with Drizzle, this would be handled by migrations.
     * Here we use a flexible JSON-like storage approach within SQLite or basic columns.
     */
    private ensureTable() {
        // We'll use a slightly more structured approach: id, data (JSON), create_time, update_time, delete_time
        // This allows us to handle dynamic schemas without complex migrations,
        // while still benefiting from SQLite's indexing and performance.
        db.run(`
            CREATE TABLE IF NOT EXISTS ${this.tableName} (
                id TEXT PRIMARY KEY,
                data TEXT,
                create_time INTEGER,
                update_time INTEGER,
                delete_time INTEGER
            )
        `);
    }

    async find(where?: Partial<T>, config?: { limit?: number; offset?: number }): Promise<T[]> {
        let sql = `SELECT * FROM ${this.tableName} WHERE delete_time IS NULL`;
        const params: any[] = [];

        // Apply WHERE conditions at SQL level for better performance
        if (where && Object.keys(where).length > 0) {
            const conditions: string[] = [];
            Object.entries(where).forEach(([key, val]) => {
                if (val === undefined || val === null || val === "") return;
                if (['id', 'create_time', 'update_time', 'delete_time'].includes(key)) {
                    conditions.push(`${key} = ?`);
                    params.push(val);
                } else {
                    conditions.push(`json_extract(data, '$.${key}') = ?`);
                    params.push(val);
                }
            });
            if (conditions.length > 0) {
                sql += ` AND ${conditions.join(' AND ')}`;
            }
        }

        // Apply LIMIT and OFFSET at SQL level
        if (config?.limit) {
            sql += ` LIMIT ?`;
            params.push(config.limit);
        }
        if (config?.offset) {
            sql += ` OFFSET ?`;
            params.push(config.offset);
        }

        const rows = db.query(sql).all(...params) as any[];

        return rows.map(row => ({
            ...JSON.parse(row.data),
            id: row.id,
            create_time: row.create_time,
            update_time: row.update_time,
            delete_time: row.delete_time
        }));
    }

    async findOne(where: Partial<T>): Promise<T | null> {
        const results = await this.find(where, { limit: 1 });
        return results.length > 0 ? results[0] : null;
    }

    async insert(entity: Partial<T>): Promise<T> {
        const id = entity.id || nanoid(6);
        const now = Date.now();
        const { id: _, create_time: __, update_time: ___, ...data } = entity as any;

        const query = db.prepare(`
            INSERT INTO ${this.tableName} (id, data, create_time, update_time)
            VALUES (?, ?, ?, ?)
        `);

        query.run(id, JSON.stringify(data), now, now);
        return { ...data, id, create_time: now, update_time: now } as T;
    }

    async update(where: Partial<T>, updateData: Partial<T>): Promise<boolean> {
        // Build WHERE clause conditions
        const conditions: string[] = ['delete_time IS NULL'];
        const params: any[] = [];

        if (where && Object.keys(where).length > 0) {
            Object.entries(where).forEach(([key, val]) => {
                if (['id', 'create_time', 'update_time', 'delete_time'].includes(key)) {
                    conditions.push(`${key} = ?`);
                    params.push(val);
                } else {
                    conditions.push(`json_extract(data, '$.${key}') = ?`);
                    params.push(val);
                }
            });
        }

        // For JSON data update, we need to fetch and merge since SQLite lacks JSON patch
        const targets = await this.find(where);
        if (targets.length === 0) return false;

        const now = Date.now();
        const updateStmt = db.prepare(`
            UPDATE ${this.tableName} SET data = ?, update_time = ? WHERE id = ?
        `);

        // Batch update all matching records
        for (const target of targets) {
            const { id, create_time, update_time, delete_time, ...oldData } = target as any;
            const newData = { ...oldData, ...updateData };
            updateStmt.run(JSON.stringify(newData), now, id);
        }

        return true;
    }

    async delete(where: Partial<T>): Promise<boolean> {
        const targets = await this.find(where);
        if (targets.length === 0) return false;

        // Soft delete by setting delete_time
        const now = Date.now();
        const updateStmt = db.prepare(`
            UPDATE ${this.tableName} SET delete_time = ? WHERE id = ?
        `);
        for (const target of targets) {
            updateStmt.run(now, (target as any).id);
        }
        return true;
    }

    async count(where?: Partial<T>): Promise<number> {
        let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE delete_time IS NULL`;
        const params: any[] = [];

        // Apply WHERE conditions at SQL level
        if (where && Object.keys(where).length > 0) {
            const conditions: string[] = [];
            Object.entries(where).forEach(([key, val]) => {
                if (val === undefined || val === null || val === "") return;
                if (['id', 'create_time', 'update_time', 'delete_time'].includes(key)) {
                    conditions.push(`${key} = ?`);
                    params.push(val);
                } else {
                    conditions.push(`json_extract(data, '$.${key}') = ?`);
                    params.push(val);
                }
            });
            if (conditions.length > 0) {
                sql += ` AND ${conditions.join(' AND ')}`;
            }
        }

        const result = db.query(sql).get(...params) as any;
        return result?.count || 0;
    }
}

export default Repository;
