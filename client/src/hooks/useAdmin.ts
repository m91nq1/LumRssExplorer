import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getQueryFn } from "@/lib/queryClient";

export function useAdmin() {
  const [hasAdminToken, setHasAdminToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    setHasAdminToken(!!token);
  }, []);

  const { data, isLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: !hasAdminToken,
  });

  return {
    isAdmin: hasAdminToken || (data?.isAdmin ?? false),
    isLoading: !hasAdminToken && isLoading,
    hasAdminToken,
  };
}

export function getAdminToken(): string | null {
  return localStorage.getItem("adminToken");
}

export function clearAdminToken() {
  localStorage.removeItem("adminToken");
}
