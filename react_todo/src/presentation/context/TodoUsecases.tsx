import { createContext, useContext } from "react"
import type { GetAllTodo } from "../../application/use-case/getAllTodo"



type TodoUseCases = {
    listTodos: GetAllTodo
    createTodo: CreateTodo
    updateTodo: UpdateTodo
    deleteTodo: DeleteTodo
    getTodoById: GetTodoById
    getTodoCount: GetTodoCount
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
    const listTodos = useContext(TodoUseCasesContext)
    if (!listTodos) throw new Error("TodoUseCasesProvider is missing")
    return listTodos
}