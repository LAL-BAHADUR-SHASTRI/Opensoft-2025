import "./App.css";

import { Route, Routes, useLocation, Navigate } from "react-router";
import EmployeePage from "./pages/Employee";
import EmployeeAuth from "./pages/Employee/Auth";
import AdminPage from "./pages/Admin";
import AdminAuth from "./pages/Admin/Auth";
import Upload from "./components/upload";
import ProtectedRoute from "./components/protectedRoutes";
import ReportPage from "./pages/Report";
import { useEffect, useState } from "react";
import { apiClient, routes } from "@/lib/api";

const App = () => {
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

  // if (location.pathname.includes("auth") && isAuthenticated) {
  //   return <Navigate to={location.pathname.startsWith("/admin") ? "/admin" : "/"} />;
  // } else if (location.pathname.includes("auth") && !isAuthenticated) {
  //   return <Outlet />;
  // }

  // if (!isAuthenticated && !isLoading) {
  //   return <Navigate to={location.pathname.startsWith("/admin") ? "/admin/auth" : "/auth"} />;
  // }

  // if (isAuthenticated) {
  //   if (role === "hr" && location.pathname.startsWith("/admin")) {
  //     return <Outlet />;
  //   } else if (role === "employee" && !location.pathname.startsWith("/admin")) {
  //     return <Outlet />;
  //   } else {
  //     return <Navigate to={location.pathname.startsWith("/admin") ? "/admin/auth" : "/auth"} />;
  //   }
  // }
  return (
    <>
      <Routes>
        <Route path="/" element={<EmployeePage/>}>
          <Route index element={<EmployeePage />} />
          <Route path="auth" element={<EmployeeAuth />} />
        </Route>

        <Route path="/admin" element={<AdminPage />}>
          <Route index element={<AdminPage />} />
          <Route path="auth" element={<AdminAuth />} />
          <Route path="upload" element={<Upload />} />
        </Route>

        <Route path="/report" element={<ReportPage />} />
      </Routes>
    </>
  );
};

export default App;
