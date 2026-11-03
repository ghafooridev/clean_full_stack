import type { Todo } from "../../domain/entity/todo";

export interface TodoRepository {
    findAll(): Promise<Todo[]>
    findById(id: string): Promise<Todo | void>
    create(todo: Todo): Promise<Todo | void>
    update(todo: Todo): Promise<Todo | void>
    delete(id: string): Promise<void>
}