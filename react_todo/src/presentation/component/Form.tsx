import z, { boolean } from "zod";

export default function TodoForm() {

const schema=z.object({
  id:z.string(),
  title:z.string().refine((value)=>value.trim()!==""),
  completed:z.boolean().default(false)
})

  return (
    <div className="App">
      <h1>React Todo form</h1>
    </div>
  )
}