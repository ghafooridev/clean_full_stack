
import {
    pgTable,
    varchar,
    boolean,
} from "drizzle-orm/pg-core";

export const todos = pgTable("todos", {
    id: varchar("id", { length: 100 }).primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    completed: boolean("completed").notNull().default(false),
});
