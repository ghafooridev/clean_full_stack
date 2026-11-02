import type { Todo } from "../../domain/entity/todo";
import type { TodoRepository } from "../port/TodoRepository";

export class GetAllTodo {
    private readonly repository: TodoRepository
    constructor(repository: TodoRepository) {
        this.repository = repository
    }

    async execute(): Promise<Todo[]> {
        return this.repository.findAll()
    }
}