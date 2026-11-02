import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { useReactMutation } from "../../infra/react-query";
import { TodoService } from "../service/Todo.service";
import { useTodoContext } from "../context";

export default function TodoForm() {
  const { setCompleteTodos, completeTodos } = useTodoContext()
  const schema = z.object({
    id: z.string(),
    title: z.string().refine((value) => value.trim().length <= 10, {
      message: "Title must be less than 10 characters",
    }),
    completed: z.boolean()
  })

  type FormData = z.infer<typeof schema>

  const { register, formState: { errors }, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: {
      title: "",
      completed: false,
      id: ""
    }
  })
  const createTodo = useReactMutation(["todos"], (data: FormData) => TodoService.create(data as any), {
    onSuccess: () => {
      alert("Todo created successfully")
      setCompleteTodos(completeTodos + 1)
    }
  })

  const onSubmit = (data: FormData) => {
    createTodo.mutate(data)
  }

  return (
    <div className="App">
      <h1>React Todo form</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register('id')} />
        <input type='text' {...register('title')} placeholder="Enter title" />
        <input type="checkbox" {...register('completed')} />
        <input type="submit" value="Add Todo" />
        {errors.title && <p>{errors.title.message}</p>}
        {errors.completed && <p>{errors.completed.message}</p>}
      </form>
    </div>
  )
}