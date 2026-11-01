import { TodoBaseError } from "./TodoBaseError";

export class TodoCompletedError extends TodoBaseError {
    constructor() {
        super("Cannot change title of a completed todo!!!!");
    }
}