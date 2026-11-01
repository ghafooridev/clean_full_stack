import type { Todo } from "../../domain/entity/todo";
import { useReactQuery } from "../../infra/react-query";
import { TodoService } from "../service/Todo.service";

export default function TodoList() {
  const {data,isLoading,isError}=useReactQuery<Todo>(['todo'],()=>TodoService.getAll())
  console.log(data,isError,isLoading);
  
  if(isLoading) return <div>is loading...</div>
  if(isError) return <div>error...</div>
  return (
    <div className="App">
      <h1>React Todo list</h1>
      {
        data?.map((item:Todo)=>{
          return <div>{item.title}</div>
        })
      }
    </div>
  )
}