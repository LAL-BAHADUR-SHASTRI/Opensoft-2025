import React, { useState } from "react";
import { Routes, Route } from "react-router";
import AuthContext from "./context/AuthContext";
import EmployeePage from "./pages/Employee";
import EmployeeAuth from "./pages/Employee/Auth";
import AdminPage from "./pages/Admin";
import AdminAuth from "./pages/Admin/Auth";
import Upload from "./components/upload";
import ReportPage from "./pages/Report";
import CollectiveReport from "./pages/Report/CollectiveReport";
import EmployeeReport from "./pages/Report/EmployeeReport";
import NotFoundPage from "./pages/NotFoundPage";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading}}>
      <Routes>
        {/* Employee Routes */}
        <Route path="/" element={<EmployeePage />} />
        <Route path="/auth" element={<EmployeeAuth />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminPage />}>
          <Route path="auth" element={<AdminAuth />} />
          <Route path="upload" element={<Upload />} />
        </Route>

        {/* Report Routes */}
        <Route path="/report" element={<ReportPage />}>
          <Route path="all" element={<CollectiveReport />} />
          <Route path="employee/:id" element={<EmployeeReport />} />
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthContext.Provider>
  );
};

export default App;
