import "./App.css";

import { Route, Routes } from "react-router";
import EmployeePage from "./pages/Employee";
import AdminPage from "./pages/Admin";

function App() {
  return (
    <Routes>
      <Route index element={<EmployeePage />} />

      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}

export default App;
