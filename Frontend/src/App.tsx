import "./App.css";

import { Route, Routes, useLocation } from "react-router";
import EmployeePage from "./pages/Employee";
import EmployeeAuth from "./pages/Employee/Auth";
import AdminPage from "./pages/Admin";
import AdminAuth from "./pages/Admin/Auth";
import Upload from "./components/upload";
// import ProtectedRoute from "./components/protectedRoutes";
import ReportPage from "./pages/Report";
import CollectiveReport from "./pages/Report/CollectiveReport";
import EmployeeReport from "./pages/Report/EmployeeReport";
import { useEffect } from "react";

const App = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/admin/upload") {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
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
