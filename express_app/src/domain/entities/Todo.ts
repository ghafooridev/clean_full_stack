import { TodoCompletedError } from "../error/TodoCompletedError";
import { TodoEmptyTitleError } from "../error/TodoEmptyTitleError";

export class Todo {
    constructor(
        public readonly id: string,
        private _title: string,
        private _completed: boolean = false
    ) {
        if (_title.trim() === '') {
            throw new TodoEmptyTitleError();
        }
        this._title = _title.trim();
    }

    get completed(): boolean {
        return this._completed;
    }
    get title(): string {
        return this._title;
    }

    changeTitle(newTitle: string): void {
        if (this._completed) {
            // throw new Error('Cannot change title of a completed todo');
            throw new TodoCompletedError();
        }
        if (newTitle.trim() === '') {
            // throw new Error('Title cannot be empty');
            throw new TodoEmptyTitleError()
        }
        this._title = newTitle.trim();
    }

    complete(): void {
        this._completed = true;
    }
}