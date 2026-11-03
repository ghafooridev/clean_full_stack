import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TodoProvider } from './presentation/context/index.tsx';
import { CreateTodo, GetAllTodo, GetTodoById, UpdateTodo } from './application/use-case/TodoUsecase.ts';
import { DeleteTodo } from './application/use-case/TodoUsecase.ts';
import { TodoUseCasesProvider } from './presentation/context/TodoUsecases.tsx';
import { TodoHttpRepository } from './infra/repository/TodoHttpRepository.ts';

const repository = new TodoHttpRepository()

const getAllTodos = new GetAllTodo(repository)
const createTodo = new CreateTodo(repository)
const updateTodo = new UpdateTodo(repository)
const deleteTodo = new DeleteTodo(repository)
const getTodoById = new GetTodoById(repository)

const useCases = {
  getAllTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  getTodoById,
}
const client = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TodoUseCasesProvider useCases={useCases} >
      <TodoProvider>
        <QueryClientProvider client={client}>
          <App />
        </QueryClientProvider>
      </TodoProvider>
    </TodoUseCasesProvider>
  </StrictMode>,
)
