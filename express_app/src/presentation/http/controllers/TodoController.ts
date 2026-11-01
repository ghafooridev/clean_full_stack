
import { Request, Response, NextFunction } from "express";

import { CreateTodo } from "../../../application/use-cases/CreateTodo";
import { GetAllTodo } from "../../../application/use-cases/GetAllTodo";
import { GetTodo } from "../../../application/use-cases/GetTodo";
import { UpdateTodo } from "../../../application/use-cases/UpdateTodo";
import { DeleteTodo } from "../../../application/use-cases/DeleteTodo";

export class TodoController {
    constructor(
        private readonly createTodo: CreateTodo,
        private readonly getAllTodos: GetAllTodo,
        private readonly getTodoById: GetTodo,
        private readonly updateTodo: UpdateTodo,
        private readonly deleteTodo: DeleteTodo
    ) { }

    create = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { title } = req.body;

            // Temporary ID generation; later we can move this responsibility
            // to an ID generator or application-level abstraction.
            const todo = await this.createTodo.execute(title);

            res.status(201).json({
                id: todo.id,
                title: todo.title,
                completed: todo.completed,
            });
        } catch (error) {
            next(error);
        }
    };

    getAll = async (
        _req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const todos = await this.getAllTodos.execute();

            res.status(200).json(
                todos.map((todo) => ({
                    id: todo.id,
                    title: todo.title,
                    completed: todo.completed,
                })),
            );
        } catch (error) {
            next(error);
        }
    };

    getById = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const todo = await this.getTodoById.execute(req.params.id as string);

            res.status(200).json({
                id: todo.id,
                title: todo.title,
                completed: todo.completed,
            });
        } catch (error) {
            next(error);
        }
    };

    update = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const todo = await this.updateTodo.execute(
                req.params.id as string,
                req.body.title,
            );

            res.status(200).json({
                id: todo.id,
                title: todo.title,
                completed: todo.completed,
            });
        } catch (error) {
            next(error);
        }
    };

    delete = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            await this.deleteTodo.execute(req.params.id as string);

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
};

