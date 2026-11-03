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
export class CreateTodo {
    private readonly repository: TodoRepository
    constructor(repository: TodoRepository) {
        this.repository = repository
    }

    async execute(todo: Todo): Promise<Todo | void> {
        return this.repository.create(todo)
    }
}

export class GetTodoById {
    private readonly repository: TodoRepository
    constructor(repository: TodoRepository) {
        this.repository = repository
    }

    async execute(id: string): Promise<Todo | void> {
        return this.repository.findById(id)
    }
}

export class UpdateTodo {
    private readonly repository: TodoRepository
    constructor(repository: TodoRepository) {
        this.repository = repository
    }

    async execute(todo: Todo): Promise<Todo | void> {
        return this.repository.update(todo)
    }
}

export class DeleteTodo {
    private readonly repository: TodoRepository
    constructor(repository: TodoRepository) {
        this.repository = repository
    }

    async execute(id: string): Promise<void> {
        return this.repository.delete(id)
    }
}

