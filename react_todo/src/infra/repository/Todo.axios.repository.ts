import type TodoPort from "../../application/port/Todo.port";
import type { Todo } from "../../domain/entity/todo";
import type { httpType } from "../axios"

export default class TodoRepository implements TodoPort {
    private readonly http: httpType;
    constructor(http: httpType) {
        this.http = http
    }

    async create(todo: Todo) {
        const response = await this.http.post<Todo | void>("", todo);
        return response.data
    }

    async getAll() {
        const response = await this.http.get<Todo[]>('/');
        return response.data
    }

    async getById(id: string) {
        const response = await this.http.get<Todo>(`/${id}`);
        return response.data
    }

    async delete(id: string) {
        const response = await this.http.delete<void>(`/${id}`);
        return response.data
    }

    async update(todo: Todo) {
        const response = await this.http.put<void>(`/${todo.id}`);
        return response.data
    }

    async count() {
        const response = await this.http.get<Todo[]>(`/`);
        return response.data.length
    }
}