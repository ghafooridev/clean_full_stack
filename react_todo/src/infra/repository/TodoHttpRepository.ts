import { http } from "../../infra/axios/index.ts"
import type { TodoRepository } from "../../application/port/TodoRepository"
import type { Todo } from "../../domain/entity/todo"

export class TodoHttpRepository implements TodoRepository {
    private readonly http: typeof http
    constructor() {
        this.http = http
    }

    findAll(): Promise<Todo[]> {
        return this.http.get('/todos')
    }
    findById(id: string): Promise<Todo> {
        return this.http.get(`/todos/${id}`)
    }
    create(todo: Todo): Promise<Todo> {
        return this.http.post('/todos', todo)
    }
    update(todo: Todo): Promise<Todo> {
        return this.http.put(`/todos/${todo.id}`, todo)
    }
    delete(id: string): Promise<void> {
        return this.http.delete(`/todos/${id}`)
    }

}       