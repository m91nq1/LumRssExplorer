import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAdmin() {
  const { data, isLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    isAdmin: data?.isAdmin ?? false,
    isLoading,
  };
}
