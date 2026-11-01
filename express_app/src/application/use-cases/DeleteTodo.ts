import { TodoNotFoundError } from "../../domain/error/TodoNotFoundError";
import { TodoRepository } from "../ports/TodoRepository";

export class DeleteTodo {
    constructor(private readonly todoRepository: TodoRepository) { }

    async execute(id: string): Promise<void> {
        const todo = await this.todoRepository.findById(id);
        if (!todo) {
            throw new TodoNotFoundError()
        }
        await this.todoRepository.delete(id);
    }
}   