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

}       