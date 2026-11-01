import { Todo } from "../../domain/entities/Todo";
import { TodoNotFoundError } from "../../domain/error/TodoNotFoundError";
import { TodoRepository } from "../ports/TodoRepository";

export class GetTodo {
    constructor(private readonly todoRepository: TodoRepository) { }

    async execute(todoId: string): Promise<Todo> {
        const todo = await this.todoRepository.findById(todoId);
        if (!todo) {
            throw new TodoNotFoundError();
        }
        return todo;
    }
}   