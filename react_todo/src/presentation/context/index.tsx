import { createContext, useContext, useState } from "react"


interface TodoContextType {
    completeTodos: number
    setCompleteTodos: (completeTodos: number) => void
}

export const TodoContext = createContext<TodoContextType>({ completeTodos: 0, setCompleteTodos: () => { } })



export const TodoProvider = ({ children }: { children: React.ReactNode }) => {
    const [completeTodos, setCompleteTodos] = useState<number>(0)
    return <TodoContext.Provider value={{ completeTodos, setCompleteTodos }}>{children}</TodoContext.Provider>
}



export const useTodoContext = () => {
    if (!TodoContext) { throw new Error("TodoContext not found") }
    return useContext(TodoContext)
}
