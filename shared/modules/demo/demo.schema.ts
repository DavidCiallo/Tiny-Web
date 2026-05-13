import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const demoTable = sqliteTable("demo", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    create_time: integer("create_time").notNull(),
    update_time: integer("update_time"),
    delete_time: integer("delete_time"),
});
