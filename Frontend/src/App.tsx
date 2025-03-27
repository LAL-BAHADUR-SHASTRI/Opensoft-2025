import "./App.css";

import { Route, Routes } from "react-router";
import EmployeePage from "./pages/Employee";
import EmployeeAuth from "./pages/Employee/Auth";
import AdminPage from "./pages/Admin";
import AdminAuth from "./pages/Admin/Auth";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<EmployeePage />}>
        <Route path="auth" element={<EmployeeAuth />} />
      </Route>

      <Route path="/admin" element={<AdminPage />}>
        <Route path="auth" element={<AdminAuth />} />
      </Route>
    </Routes>
  );
};

export default App;
