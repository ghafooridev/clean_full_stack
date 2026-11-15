import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

const TodoSchema = z.object({
  id: z.string(),
  title: z.string().refine((v) => v.trim().length > 5, {
    message: "should be more than 5 chars",
  }),
  completed: z.boolean(),
});

type Todo = z.infer<typeof TodoSchema>;

type ReducerAction =
  | { type: "ADD"; payload: Todo }
  | { type: "DELETE"; payload: string }
  | { type: "UPDATE"; payload: Todo }
  | { type: "SEARCH"; payload: string };

const initValue: Todo = {
  id: Date.now().toString(),
  title: "",
  completed: false,
};

const initState: Todo[] = [];

const reducer = (state: Todo[], action: ReducerAction) => {
  switch (action.type) {
    case "ADD": {
      return [...state, { ...action.payload }];
    }
    case "DELETE": {
      return [...state.filter((item: Todo) => item.id !== action.payload)];
    }
    case "UPDATE": {
      const newState = state.map((item) =>
        item.id === action.payload.id ? { item: action.payload } : { ...item },
      );

      return [...newState];
    }

    case "SEARCH": {
      return [...state.filter((item: Todo) => item.title !== action.payload)];
    }

    default: {
      return [...state];
    }
  }
};

const delay = async (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));

const useDebouncedValue = (value: string, time = 100) => {
  const defer = useDeferredValue(value);
  useEffect(() => {
    const search = async () => {
      await delay(time);
    };
    search();
  }, [value]);

  return defer;
};

export default function Todo() {
  const [selectedTodo, setSelectedTodo] = useState<Todo>();
  const [state, dispatch] = useReducer(reducer, initState);
  const [search, setSearch] = useState("");
  const defer = useDebouncedValue(search);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<Todo>({
    resolver: zodResolver(TodoSchema),
    defaultValues: initValue,
  });

  const onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(">>", e.target.value);
    if (e.target.value) {
      setSearch(e.target.value?.trim());
    }
  };

  const onChangeCompleted = (
    e: React.ChangeEvent<HTMLInputElement>,
    item: Todo,
  ) => {
    console.log("e", e);
    dispatch({ type: "ADD", payload: { ...item, completed: !item.completed } });
  };

  const onClickRow = (item: Todo) => {
    console.log("selected");
    setSelectedTodo(item);
  };

  const onSubmit = async (data: Todo) => {
    console.log("add");
    if (selectedTodo) return dispatch({ type: "UPDATE", payload: data });
    dispatch({ type: "ADD", payload: data });
  };

  const onDelete = async () => {
    console.log("delete");
    if (selectedTodo) dispatch({ type: "DELETE", payload: selectedTodo.id });
  };

  const handleSearch = (value: string) => {
    dispatch({ type: "SEARCH", payload: value });
  };

  const getTitle = useMemo(() => {
    return `All Todos (${state.length}) - inComplete(${state.filter((item) => !item.completed).length})`;
  }, [state]);

  useEffect(() => {
    handleSearch(defer);
  }, [search]);

  return (
    <div className="w-40 m-auto mt-20 flex flex-col">
      <div className="flex justify-between items-start">
        <h4>{getTitle}</h4>
        <input type="text" onChange={onSearch} value={search} />
      </div>
      <div className="w-full flex items-center">
        <form
          className="flex flex-col w-full"
          onSubmit={handleSubmit(onSubmit)}
        >
          <label htmlFor="id">ID:</label>
          <input type="text" readOnly {...register("id")} />

          <label htmlFor="title">TITLE:</label>
          <input type="text" {...register("title")} />
          {errors?.title && (
            <p className="text-red-600">{errors.title.message}</p>
          )}

          <label htmlFor="completed">COMPLETED:</label>
          <input type="checkbox" {...register("completed")} />

          <input type="submit">{selectedTodo ? "updae" : "add"}</input>
          <input type="button" onClick={onDelete}>
            delete
          </input>
        </form>

        <div className="w-full">
          <table>
            <th>
              <td>id</td>
              <td>title</td>
              <td>completed</td>
              <td>action</td>
            </th>
            <tbody>
              {state.map((item: Todo) => {
                return (
                  <tr>
                    <td>{item.id}</td>
                    <td>{item.title}</td>
                    <td>
                      <input
                        type="checkbox"
                        defaultChecked={item.completed}
                        onChange={(e) => onChangeCompleted(e, item)}
                      ></input>
                    </td>
                    <td>
                      <input type="button" onClick={() => onClickRow(item)}>
                        view
                      </input>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          );
        </div>
      </div>
    </div>
  );
}
