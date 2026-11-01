import {useQuery,QueryClientProvider,QueryClient,useQueryClient,useMutation} from "@tanstack/react-query";
import type React from "react";

export const queryClient=new QueryClient();

export const QueryProvider=({children}:{children:React.ReactElement})=>{
return(

    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
)
}


export const useReactQuery=<T,>(key:string[],_query:()=>Promise<T[]>) =>{
    const query=useQuery({queryKey:key,queryFn:_query});

    return query;
}

export const useReactMutation=(key:string[],_mutation:any,_onSuccess:Function)=>{
     const queryClient = useQueryClient()
    const mutation=useMutation({mutationFn:_mutation,onSuccess:()=>{
        queryClient.invalidateQueries({queryKey:key})
    }})

    return mutation
}



