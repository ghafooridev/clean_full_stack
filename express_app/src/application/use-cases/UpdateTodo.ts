import { Todo } from "../../domain/entities/Todo";
import { TodoNotFoundError } from "../../domain/error/TodoNotFoundError";
import { TodoRepository } from "../ports/TodoRepository";

export class UpdateTodo {
    constructor(private readonly todoRepository: TodoRepository) { }

    async execute(todoId: string, title: string): Promise<Todo> {
        const todo = await this.todoRepository.findById(todoId);
        if (!todo) {
            throw new TodoNotFoundError();
        }
        todo.changeTitle(title);
        todo.complete();
        await this.todoRepository.update(todo);
        return todo;
    }
}   