import "./App.css";



import { Route, Routes } from "react-router";
import EmployeePage from "./pages/Employee";
import Upload from "./components/upload";
// import dummyUsers from "./pages/Admin/data/employees";
                   
// import UserListTable from "./pages/Admin/index";
function App() {
  return (
    <Routes>
      <Route index element={<EmployeePage />} />
      <Route path="/admin" element={<Upload />} />
      {/* <Route path="/admin/reports" element={< UserListTable tableData={dummyUsers}/>} /> */}
    </Routes>
  );
}

export default App;