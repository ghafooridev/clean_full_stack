import { redirect } from "react-router";
import type { Todo } from "../../domain/entity/todo";
import { useGetTodosQuery } from "../hooks/useGetTodo";

export default function TodoList() {
  const { data, isLoading, isError } = useGetTodosQuery()

  if (isLoading) return <div>is loading...</div>
  if (isError) return <div>error...</div>
  return (
    <div className="App">
      <h1>React Todo list</h1>
      {
        data?.map((item: Todo) => {
          return <div>
            <p>{item.title}</p>
            <input type="checkbox" defaultChecked={item.completed} />
            <input type="button" onClick={() => redirect(`/todo/${item.id}`)}>detail</input>

          </div>
        })
      }
    </div>
  )
}