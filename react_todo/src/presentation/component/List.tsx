import { useNavigate } from "react-router";
import type { Todo } from "../../domain/entity/todo";
import { useGetTodosQuery } from "../hooks/useGetTodo";

export default function TodoList() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useGetTodosQuery()
  if (isLoading) return <div>is loading...</div>
  if (isError) return <div>error...</div>
  return (
    <div className="App">
      <h1>React Todo list</h1>
      <button type="button" onClick={() => navigate("/todo/form")}>new</button>
      {
        data?.map((item: Todo) => {
          return <div key={item.id}>
            <p>{item.title}</p>
            <input type="checkbox" defaultChecked={item.completed} />
            <button type="button" onClick={() => navigate(`/todo/${item.id}`)}>detail</button>
          </div>
        })
      }
    </div>
  )
}