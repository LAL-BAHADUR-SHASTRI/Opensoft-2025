import { useEffect, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import EmployeePage from "./pages/Employee";
import EmployeeAuth from "./pages/Employee/Auth";

import AdminPage from "./pages/Admin";
import AdminAuth from "./pages/Admin/Auth";
import Upload from "./components/upload";

import { apiClient, routes } from "@/lib/api";

import ReportPage from "./pages/Report";
import CollectiveReport from "./pages/Report/CollectiveReport";
import EmployeeReport from "./pages/Report/EmployeeReport";

import NotFoundPage from "./pages/NotFoundPage";

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const checkAuthentication = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(routes.USER_INFO, {
        withCredentials: true,
      });
      if (response.status === 200) {
        setIsAuthenticated(true);
        setRole(response.data.role);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (location.pathname === "/admin/upload") {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    if (!isAuthenticated) {
      checkAuthentication();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    // if (isAuthenticated) {
    //   if (location.pathname.includes("auth")) {
    //     if (role === "hr") {
    //       navigate("/admin");
    //     } else if (role === "employee") {
    //       navigate("/");
    //     }
    //   }
    // } else {
    //   if (location.pathname.includes("/admin")|| location.pathname.includes("report")) {
    //     navigate("/admin/auth");
    //   } else if (location.pathname === "/") {
    //     navigate("/auth");
    //   }
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    !isLoading && (
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
            <Route path="employee/:employeeId" element={<EmployeeReport />} />
            <Route path="employees" element={<CollectiveReport />} />
          </Route>

          <Route path="*" element={<NotFoundPage />}/>
        </Routes>
      </>
    )
  );
};

export default App;
