import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TodoProvider } from './presentation/context/index.tsx';
import { TodoHttpRepository } from './infra/repository/TodoHttpRepository.ts';
import { GetAllTodo } from './application/use-case/getAllTodo.ts';
import { http } from './infra/axios/index.ts';
import { TodoUseCasesProvider } from './presentation/context/TodoUsecases.tsx';

const repository = new TodoHttpRepository(http)
const listTodos = new GetAllTodo(repository)
const createTodo = new CreateTodo(repository)
const updateTodo = new UpdateTodo(repository)
const deleteTodo = new DeleteTodo(repository)
const getTodoById = new GetTodoById(repository)
const getTodoCount = new GetTodoCount(repository)
const useCases = {
  listTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  getTodoById,
  getTodoCount
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
