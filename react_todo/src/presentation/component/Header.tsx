import { useTodoContext } from "../context"

export default function Header() {
    const { completeTodos } = useTodoContext()
    return (
        <div>
            <h1>Number of completed todos: {completeTodos.toString()}</h1>
        </div>
    )
}