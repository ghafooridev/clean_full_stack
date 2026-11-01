import type { Todo } from "../../domain/entity/todo";

export default interface TodoPort {
    create(Todo: Todo): Promise<Todo | void>,
    update(Todo: Todo): Promise<Todo | void>
    delete(id: string): Promise<void>
    getAll(): Promise<Todo[]>
    getById(id: string): Promise<Todo | void>
    count(): Promise<Number>

}