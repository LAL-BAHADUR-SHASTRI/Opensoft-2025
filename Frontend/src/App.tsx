import "./App.css";

import { Route, Routes } from "react-router";
import EmployeePage from "./pages/Employee";
import EmployeeAuth from "./pages/Employee/Auth";
import AdminPage from "./pages/Admin";
import AdminAuth from "./pages/Admin/Auth";
import Upload from "./components/upload";
import ProtectedRoute from "./components/protectedRoutes";

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
      </Routes>
    </>
  );
};

export default App;
