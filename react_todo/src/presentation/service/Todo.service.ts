import { http } from "../../infra/axios";
import TodoRepository from "../../infra/repository/Todo.axios.repository";

// export class TodoSingleton {
//     constructor() {
//         const TodoUsecase = new TodoRepository(http)
//     }

// }
export const TodoService = new TodoRepository(http)