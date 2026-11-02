import { useQuery } from "@tanstack/react-query"
import { useTodoUseCases } from "../context/TodoUsecases"

export const useGetTodos = () => {
    const listTodos = useTodoUseCases()
    const { data, isError, isLoading } = useQuery({
        queryKey: ['todos'],
        queryFn: () => listTodos.execute()
    })
    return { data, isError, isLoading }
}