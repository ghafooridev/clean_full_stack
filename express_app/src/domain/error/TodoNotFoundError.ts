
import { TodoBaseError } from "./TodoBaseError";

export class TodoNotFoundError extends TodoBaseError {
    constructor() {
        super("Todo not found");
    }
}