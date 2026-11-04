import { http } from "../../infra/axios/index.ts"
import type { TodoRepository } from "../../application/port/TodoRepository"
import type { Todo } from "../../domain/entity/todo"
import { toDto, toTodo, type TodoDto } from "../mapper/index.ts"

export class TodoHttpRepository implements TodoRepository {
    private readonly http: typeof http
    constructor() {
        this.http = http
    }

    async findAll(): Promise<Todo[]> {
        const response = await this.http.get<TodoDto[]>('/todos')
        return response.data.map(toTodo)
    }
    async findById(id: string): Promise<Todo> {
        const response = await this.http.get<TodoDto>(`/todos/${id}`)
        return toTodo(response.data)
    }
    async create(todo: Todo): Promise<Todo> {
        const response = await this.http.post<TodoDto>('/todos', toDto(todo))
        return toTodo(response.data)
    }
    async update(todo: Todo): Promise<Todo> {
        const response = await this.http.put<TodoDto>(`/todos/${todo.id}`, toDto(todo))
        return toTodo(response.data)
    }
    async delete(id: string): Promise<void> {
        await this.http.delete(`/todos/${id}`)
    }

}       