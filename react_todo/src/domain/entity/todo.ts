// import { TodoEmptyTitleError } from "../error/TodoEmptyTitleError";
// import { TodoNotFoundError } from "../error/TodoNotFoundError";

export class Todo {
    public readonly id: string;
    private _title: string;
    private _compelete: boolean;

    constructor(id: string, title: string, compelete: boolean) {
        this.id = id
        this._title = title.trim();
        this._compelete = compelete
    }
    get title() {
        return this._title
    }
    get completed() {
        return this._compelete
    }

    // public changeTitle(title: string): void {
    //     if (!title) {
    //         throw new TodoNotFoundError();
    //     }
    //     if (title.trim() === "") {
    //         throw new TodoEmptyTitleError()
    //     }
    //     this._title = title
    // }

    // public complete(): void {
    //     this._compelete = true
    // }
}
