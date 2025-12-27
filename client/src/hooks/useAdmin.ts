import { useQuery } from "@tanstack/react-query";
import { useSupabaseAuth } from "@/contexts/AuthContext";

export function useAdmin() {
  const { user, isLoading: isAuthLoading } = useSupabaseAuth();
  
  const { data, isLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check", user?.id],
    queryFn: async () => {
      if (!user?.id) return { isAdmin: false };
      const response = await fetch(`/api/admin/check?supabaseId=${user.id}`);
      if (!response.ok) return { isAdmin: false };
      return response.json();
    },
    enabled: !!user?.id,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    isAdmin: data?.isAdmin ?? false,
    isLoading: isAuthLoading || isLoading,
  };
}
