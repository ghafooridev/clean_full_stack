import { useMutation, useQuery } from "@tanstack/react-query"
import { useTodoUseCases } from "../context/TodoUsecases"
import { Todo } from "../../domain/entity/todo"

export const useGetTodosQuery = () => {
    const getAllTodos = useTodoUseCases()
    const { data, isError, isLoading } = useQuery({
        queryKey: ['todos'],
        queryFn: () => getAllTodos.getAllTodos.execute()
    })
    return { data, isError, isLoading }
}
export const useCreateTodoMutation = () => {
    const createTodo = useTodoUseCases()
    const { mutate, isError } = useMutation({
        mutationFn: (todo: Todo) => createTodo.createTodo.execute(todo)
    })
    return { mutate, isError }
}
export const useUpdateTodoMutation = () => {
    const updateTodo = useTodoUseCases()
    const { mutate, isError } = useMutation({
        mutationFn: (todo: Todo) => updateTodo.updateTodo.execute(todo)
    })
    return { mutate, isError }
}
export const useDeleteTodoMutation = () => {
    const deleteTodo = useTodoUseCases()
    const { mutate, isError } = useMutation({
        mutationFn: (id: string) => deleteTodo.deleteTodo.execute(id)
    })
    return { mutate, isError }
}
export const useGetTodoByIdQuery = (id: string) => {
    const getTodoById = useTodoUseCases()
    const { data, isError } = useQuery({
        queryKey: ['todoById', id],
        queryFn: () => getTodoById.getTodoById.execute(id)
    })
    return { data, isError }
}