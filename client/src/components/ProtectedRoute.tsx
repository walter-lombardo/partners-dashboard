import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import type { MeResponse } from "@shared/schema";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<MeResponse>({
    queryKey: ["/api/me"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && (error || !data)) {
      setLocation("/login");
    }
  }, [data, isLoading, error, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  return <>{children}</>;
}
