import type { Todo } from "../../domain/entity/todo";

export interface TodoRepository {
    findAll(): Promise<Todo[]>
}