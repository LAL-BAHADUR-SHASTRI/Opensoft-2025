import "./App.css";



import { Route, Routes } from "react-router";
import EmployeePage from "./pages/Employee";

import dummyUsers from "./pages/Admin/data/employees";
                   
import UserListTable from "./pages/Admin/index";

function App() {
  return (
    <Routes>
      <Route index element={<EmployeePage />} />
      {/* <Route path="/admin" element={} />
      <Route path="/admin/upload" element={} /> */}
      {/* <Route path="/employee/" element={} /> */}
      {/* <Route path="/employee/login" element={} />
      <Route path="/admin/login" element={} />t */}
      <Route path="/admin/reports" element={< UserListTable tableData={dummyUsers}/>} />
    </Routes>
  );
}

export default App;