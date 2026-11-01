import { Todo } from "../../domain/entity/todo";
import type TodoPort from "../port/Todo.port";

export default class TodoUseCase {
    private readonly todoPort: TodoPort
    constructor(todoPort: TodoPort) {
        this.todoPort = todoPort
    }

    async createTodo(title: string): Promise<Todo | void> {
        const todo = new Todo(crypto.randomUUID() as string, title, false)
        const result = await this.todoPort.create(todo)
        return result
    }

    async updateTodo(todo: Todo): Promise<Todo | void> {
        const _todo = await this.todoPort.getById(todo.id);
        if (_todo) {
            _todo.changeTitle(todo.title);
            _todo.complete();

            const result = await this.todoPort.update(todo);
            return result
        }
    }

    async GetTodoById(id: string): Promise<Todo | void> {
        const todo = await this.todoPort.getById(id);
        if (todo) {
            return todo;
        }
    }

    async getAllTodo(): Promise<Todo[]> {
        return await this.todoPort.getAll();
    }

    async delete(id: string): Promise<void> {
        await this.todoPort.delete(id);
    }

    async count(): Promise<Number> {
        const result = await this.todoPort.getAll();
        return result.length
    }
}