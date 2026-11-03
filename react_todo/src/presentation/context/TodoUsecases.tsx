import { createContext, useContext } from "react"
import type { CreateTodo, DeleteTodo, GetAllTodo, GetTodoById, UpdateTodo } from "../../application/use-case/TodoUsecase"



type TodoUseCases = {
    getAllTodos: GetAllTodo
    createTodo: CreateTodo
    updateTodo: UpdateTodo
    deleteTodo: DeleteTodo
    getTodoById: GetTodoById
}
const TodoUseCasesContext = createContext<TodoUseCases | null>(null)

export function TodoUseCasesProvider({
    useCases,
    children,
}: {
    useCases: TodoUseCases
    children: React.ReactNode
}) {
    return (
        <TodoUseCasesContext.Provider value={useCases}>
            {children}
        </TodoUseCasesContext.Provider>
    )
}

export function useTodoUseCases() {
    const getAllTodos = useContext(TodoUseCasesContext)
    if (!getAllTodos) throw new Error("TodoUseCasesProvider is missing")
    return getAllTodos
}

export function useCreateTodo() {
    const createTodo = useContext(TodoUseCasesContext)
    if (!createTodo) throw new Error("TodoUseCasesProvider is missing")
    return createTodo.createTodo
}

export function useGetTodoById() {
    const getTodoById = useContext(TodoUseCasesContext)
    if (!getTodoById) throw new Error("TodoUseCasesProvider is missing")
    return getTodoById.getTodoById
}

export function useUpdateTodo() {
    const updateTodo = useContext(TodoUseCasesContext)
    if (!updateTodo) throw new Error("TodoUseCasesProvider is missing")
    return updateTodo.updateTodo
}

export function useDeleteTodo() {
    const deleteTodo = useContext(TodoUseCasesContext)
    if (!deleteTodo) throw new Error("TodoUseCasesProvider is missing")
    return deleteTodo.deleteTodo
}