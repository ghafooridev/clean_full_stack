
import { eq } from "drizzle-orm";

import { Todo } from "../../domain/entities/Todo";
import { TodoRepository } from "../../application/ports/TodoRepository";
import { db } from "../database/db";
import { todos } from "../database/schema";

export class PostgresTodoRepository implements TodoRepository {
    async save(todo: Todo): Promise<void> {
        await db
            .insert(todos)
            .values({
                id: todo.id,
                title: todo.title,
                completed: todo.completed,
            })
            .onConflictDoUpdate({
                target: todos.id,
                set: {
                    title: todo.title,
                    completed: todo.completed,
                },
            });
    }

    async findById(id: string): Promise<Todo | null> {
        const [row] = await db
            .select()
            .from(todos)
            .where(eq(todos.id, id))
            .limit(1);

        if (!row) {
            return null;
        }

        return new Todo(row.id, row.title, row.completed);
    }

    async findAll(): Promise<Todo[]> {
        const rows = await db.select().from(todos);

        return rows.map(
            (row) => new Todo(row.id, row.title, row.completed),
        );
    }
    async update(todo: Todo): Promise<void> {
        await db.update(todos)
            .set({
                title: todo.title,
                completed: todo.completed,
            })
            .where(eq(todos.id, todo.id));
    }
    async delete(id: string): Promise<void> {
        await db.delete(todos)
            .where(eq(todos.id, id));
    }
}
