import "./App.css";

import { Route, Routes, useLocation, Navigate } from "react-router";
import EmployeePage from "./pages/Employee";
import EmployeeAuth from "./pages/Employee/Auth";
import AdminPage from "./pages/Admin";
import AdminAuth from "./pages/Admin/Auth";
import Upload from "./components/upload";
// import ProtectedRoute from "./components/protectedRoutes";
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

    if (location.pathname === "/admin/upload") {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    checkAuthentication();
  }, [location]);

  return (
    <>
      <Routes>
        <Route path="/">
          <Route index element={<EmployeePage />} />
          <Route path="auth" element={<EmployeeAuth />} />
        </Route>

        <Route path="/admin" element={<AdminPage />}>
          <Route path="auth" element={<AdminAuth />} />
          <Route path="upload" element={<Upload />} />
        </Route>

        <Route path="/report" element={<ReportPage />}>
          <Route path="all" element={<CollectiveReport />} />
          <Route path="employee/:id" element={<EmployeeReport />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
