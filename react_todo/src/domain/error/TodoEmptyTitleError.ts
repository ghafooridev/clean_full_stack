import { TodoBaseError } from "./TodoBaseError";

export class TodoEmptyTitleError extends TodoBaseError {
    constructor() {
        super("Title cannot be empty....");
    }
}   