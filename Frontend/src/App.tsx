import "./App.css";

import { Route, Routes } from "react-router";
import EmployeePage from "./pages/Employee";
import EmployeeAuth from "./pages/Employee/Auth";
import AdminPage from "./pages/Admin";
import AdminAuth from "./pages/Admin/Auth";
import Upload from "./components/upload";
<<<<<<< HEAD
import ProtectedRoute from "./components/protectedRoutes";
=======
import ReportPage from "./pages/Report";
>>>>>>> 0d66a54ac86705ecd42a8e49a83e4e0834cd5649

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<ProtectedRoute/>}>
          <Route index element={<EmployeePage />} />
          <Route path="auth" element={<EmployeeAuth />} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute />}>
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
