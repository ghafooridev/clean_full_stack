import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { useCreateTodoMutation } from "../hooks/useGetTodo";
import { useNavigate } from "react-router";

export default function TodoForm() {
  const navigate = useNavigate()
  const schema = z.object({
    id: z.string(),
    title: z.string().refine((value) => value.trim().length >= 10, {
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
  const { mutate, isPending } = useCreateTodoMutation()

  const onSubmit = async (data: FormData) => {
    console.log(data)
    await mutate(data)
    navigate("/todo/list")
  }

  return (
    <div className="App">
      <h1>React Todo form</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register('id')} />
        <input type='text' {...register('title')} placeholder="Enter title" />
        <input type="checkbox" {...register('completed')} />
        <input type="submit" value={isPending ? "Adding..." : "Add Todo"} disabled={isPending} />
        {errors.title && <p>{errors.title.message}</p>}
        {errors.completed && <p>{errors.completed.message}</p>}
      </form>
    </div>
  )
}