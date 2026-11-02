import { createBrowserRouter, Outlet } from "react-router"
import { RouterProvider } from "react-router/dom"
import TodoList from "./presentation/component/List";
import TodoForm from "./presentation/component/Form";

const Home = () => <div>Home</div>
const TodoLayout = () => <Outlet />

const router = createBrowserRouter([
    {
        path: '/todo',
        Component: TodoLayout,
        children: [
            {
                index: true,
                Component: Home,
            },
            {
                path: 'list',
                Component: TodoList
            },
            {
                path: 'form',
                Component: TodoForm
            },
            {
                path: 'form/:id',
                Component: TodoForm
            }
        ]
    }
])


export const Router = () => <RouterProvider router={router} />