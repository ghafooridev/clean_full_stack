import { Todo } from "../../domain/entities/Todo";

export interface TodoRepository {
    save(todo: Todo): Promise<void>;
    delete(todoId: string): Promise<void>;
    findById(todoId: string): Promise<Todo | null>;
    findAll(): Promise<Todo[]>;
    update(todo: Todo): Promise<void>;
}