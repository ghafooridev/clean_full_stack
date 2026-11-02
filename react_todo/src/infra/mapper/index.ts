import { Todo } from "../../domain/entity/todo"

export type TodoDto = {
    id: string
    title: string
    completed: boolean
}

export function toTodo(dto: TodoDto): Todo {
    return new Todo(dto.id, dto.title, dto.completed)
}