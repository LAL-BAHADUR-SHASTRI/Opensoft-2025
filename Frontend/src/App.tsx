import { Route, Routes } from "react-router";
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
  return (
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
        <Route path="employee/:employeeId" element={<EmployeeReport />} />
        <Route path="employees" element={<CollectiveReport />} />
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
