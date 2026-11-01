
import { Router } from "express";

import { CreateTodo } from "../../../application/use-cases/CreateTodo";
import { GetAllTodo } from "../../../application/use-cases/GetAllTodo";
import { GetTodo } from "../../../application/use-cases/GetTodo";
import { UpdateTodo } from "../../../application/use-cases/UpdateTodo";

import { PostgresTodoRepository } from "../../../infrastructure/repositories/postgresRepository";
import { TodoController } from "../controllers/TodoController";
import { DeleteTodo } from "../../../application/use-cases/DeleteTodo";

const router = Router();

const repository = new PostgresTodoRepository();

const createTodo = new CreateTodo(repository);
const getAllTodos = new GetAllTodo(repository);
const getTodoById = new GetTodo(repository);
const updateTodo = new UpdateTodo(repository);
const deleteTodo = new DeleteTodo(repository);

const controller = new TodoController(
    createTodo,
    getAllTodos,
    getTodoById,
    updateTodo,
    deleteTodo
);

router.post("/", controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.patch("/:id", controller.update);

export default router;
