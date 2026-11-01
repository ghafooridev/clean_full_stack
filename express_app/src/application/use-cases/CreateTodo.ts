import { Todo } from "../../domain/entities/Todo";
import { TodoRepository } from "../ports/TodoRepository";

export class CreateTodo {
    constructor(private readonly todoRepository: TodoRepository) { }

    async execute(title: string): Promise<Todo> {
        const todo = new Todo(
            crypto.randomUUID(),
            title,
            false
        );
        await this.todoRepository.save(todo);
        return todo;
    }
}