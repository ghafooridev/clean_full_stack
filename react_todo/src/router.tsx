import {createBrowserRouter} from"react-router"
import {RouterProvider} from "react-router/dom"
import TodoList from "./presentation/component/List";

const Home=()=><div>Home</div>

const router=createBrowserRouter([
    {
        path:'/',
        Component:Home,
        children:[
{
    path:'/list',
    Component:TodoList
}
        ]
    }
])


export const Router=<RouterProvider router={router}></RouterProvider>