import { Navigate, Outlet, useLocation } from "react-router";
import { apiClient, routes } from "@/lib/api";
import { useEffect, useState } from "react";

const ProtectedRoute = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuthentication = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get(routes.USER_INFO, {
          withCredentials: true,
        });
        if (response.status === 200) {
          setIsAuthenticated(true);
          setRole(response.data.role);
        }
        setIsLoading(false);
        return response.status === 200;
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsLoading(false);
        return false;
      }
    };

    checkAuthentication();
  }, [location.pathname]);

  if (location.pathname.includes("auth") && isAuthenticated) {
    return <Navigate to={location.pathname.startsWith("/admin") ? "/admin" : "/"} />;
  } else if (location.pathname.includes("auth") && !isAuthenticated) {
    return <Outlet />;
  }

  if (!isAuthenticated && !isLoading) {
    return <Navigate to={location.pathname.startsWith("/admin") ? "/admin/auth" : "/auth"} />;
  }

  if (isAuthenticated) {
    if (role === "hr" && location.pathname.startsWith("/admin")) {
      return <Outlet />;
    } else if (role === "employee" && !location.pathname.startsWith("/admin")) {
      return <Outlet />;
    } else {
      return <Navigate to={location.pathname.startsWith("/admin") ? "/admin/auth" : "/auth"} />;
    }
  }
};

export default ProtectedRoute;
