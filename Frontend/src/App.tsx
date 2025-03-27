import "./App.css";

import { Route, Routes } from "react-router";
import EmployeePage from "./pages/Employee";
// import AdminPage from "./pages/Admin";
import Upload from "./components/upload";
// import Upload from "./components/upload";

function App() {
  return (
    <Routes>
      <Route index element={<EmployeePage />} />

      <Route path="/admin" element={<Upload />} />
    </Routes>
  );
}

export default App;
