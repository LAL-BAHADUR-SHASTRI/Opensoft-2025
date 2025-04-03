import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronUp, ChevronDown, FileDown } from "lucide-react";
import {
  Crown,
  Shield,
  MessageSquare,
  User,
  Briefcase,
  Users,
  Star,
  UserCheck,
  UserX,
} from "lucide-react";
import moment from "moment";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { apiClient, routes } from "@/lib/api";

import { Icon } from "@iconify-icon/react";

interface UserType {
  id: number;
  email: string;
  username: string;
  hashed_password: string;
  role: string;
  is_active: boolean;
  employee_id?: string | null;
  last_login_date?: string | null;
  last_chat_date?: string | null;
  current_mood?: string | null;
}

const getAvatar = (user: { name?: string; dp?: string }) => {
  if (user.dp) return user.dp;

  const name = user.name || "A"; 
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return initials;
};


const userRoleIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  Admin: { icon: <Crown size={16} />, color: "text-red-500" },
  SuperAdmin: { icon: <Crown size={16} />, color: "text-purple-500" },
  Moderator: { icon: <Shield size={16} />, color: "text-blue-500" },
  "chat manager": { icon: <MessageSquare size={16} />, color: "text-green-700" },
  Agency: { icon: <Briefcase size={16} />, color: "text-cyan-500" },
  User: { icon: <User size={16} />, color: "text-neutral-600" },
  Premium: { icon: <Star size={16} />, color: "text-yellow-400" },
  Verified: { icon: <UserCheck size={16} />, color: "text-green-500" },
  Banned: { icon: <UserX size={16} />, color: "text-red-700" },
  Guest: { icon: <Users size={16} />, color: "text-neutral-400" },
};

const userStatusColors: Record<string, string> = {
  okay: "bg-green-700/50 text-green-100",
  frustrated: "bg-red-700/50 text-red-100",
  sad: "bg-blue-800/50 text-blue-100",
  happy: "bg-green-800/50 text-green-100",
  excited: "bg-yellow-700/50 text-yellow-100",
};
const AdminPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState<UserType[]>([]);

  const [filteredData, setFilteredData] = useState<UserType[]>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(0);

  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get(routes.USERS, {
          withCredentials: true,
        });
        console.log("this is response", response.data.data);
        const arrayData = Object.values(response.data.data) as UserType[];
console.log(arrayData)
        setData(arrayData);
        setFilteredData(arrayData)         // Ensure state is updated with fetched data
      } catch (err) {
        console.error("Fetch error:", err);
       
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures it runs only once
  useEffect(() => {
    if (!globalFilter) {
      setFilteredData(data);
      return;
    }

    const searchTerm = globalFilter.toLowerCase();

    const filtered = data.filter((user) => {
      const searchContent = [user.username, user.role, user.current_mood, user.id].join(" ").toLowerCase();

      return searchContent.includes(searchTerm);
    });

    setFilteredData(filtered);
  }, [globalFilter, data]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };
  const sortedData = Array.isArray(filteredData) ? [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
  
    const valA = a[sortColumn as keyof UserType];
    const valB = b[sortColumn as keyof UserType];
  
    if (valA == null || valB == null) return 0; // Handle null or undefined values
    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  }) : [];
  
  const paginatedData =
    pageSize > sortedData.length
      ? sortedData
      : sortedData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
      const selectAllRows = () => {
        if (!Array.isArray(filteredData)) {
          console.error("filteredData is not an array:", filteredData);
          return;
        }
      
        const allSelected = Object.keys(selectedRows).length === filteredData.length;
      
        if (allSelected) {
          setSelectedRows({});
        } else {
          const newSelected: Record<string, boolean> = {};
      
          filteredData.forEach((user) => {
            newSelected[user.id] = true;
          });
      
          setSelectedRows(newSelected);
        }
      };
      
  // Toggle row selection
  const toggleRowSelected = (id: string) => {
    let newCheckedRows = selectedRows;

    if (newCheckedRows[id]) {
      delete newCheckedRows[id];
      console.log(newCheckedRows);
    } else {
      newCheckedRows = {
        ...newCheckedRows,
        [id]: true,
      };
    }
    setSelectedRows(newCheckedRows);
  };

  useEffect(() => console.log(selectedRows), [selectedRows]);

  const handleLogout = async () => {
    try {
      const response = await apiClient.post(routes.LOGOUT, {}, { withCredentials: true });
      if (response.status === 200) {
        navigate("/admin/auth");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <>
      {location.pathname !== "/admin/auth" && (
        <main className="w-full min-h-screen rounded-none bg-neutral-950 text-white pb-6">
          <div className="flex justify-between items-center gap-4 py-4 px-6 border-b border-neutral-800">
            <div className="flex items-center">
              <h2 className="text-2xl tracking-wide font-medium text-neutral-100">Deloitte</h2>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={"/admin/upload"}
                state={{ background: location }}
                className="py-2 px-5 border border-white bg-white text-black rounded-md"
              >
                Upload Files
              </Link>

              <button
                className="flex items-center gap-2 text-white bg-wh pt-2 pb-3 pl-4 pr-3 border-2 border-neutral-800 rounded-md"
                onClick={handleLogout}
              >
                <span>Logout</span>
                <Icon icon={"mynaui-logout"} className="text-xl" />
              </button>
            </div>
          </div>

          <h1 className="px-6 text-2xl py-5 font-medium">Employee List</h1>
          <div className="px-6 py-4 border-b border-neutral-800 flex flex-col-reverse md:flex-row justify-between items-start md:items-center gap-4 ">
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              <SelectTrigger className="w-[100px] cursor-pointer border-neutral-800">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent className="dark ">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <Input
                placeholder="Search Users"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="max-w-sm border-neutral-800"
              />

              <Link
                to={"/report/all"}
                className="cursor-pointer text-black bg-white rounded-md py-1.5 px-4 flex items-center gap-1"
              >
                <FileDown className="mr-2 h-4 w-4 " />
                Report
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto cursor-pointer border-b border-neutral-800">
            <Table className="">
              <TableHeader className="border-neutral-800 border-b-2 hover:bg-transparent">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px]">
                    <Checkbox
                      className="ml-5 items-center flex"
                      checked={
                        Object.keys(selectedRows).length > 0 &&
                        Object.keys(selectedRows).length === filteredData.length
                      }
                      onCheckedChange={selectAllRows}
                    />
                  </TableHead>

                  <TableHead className="cursor-pointer " onClick={() => handleSort("Name")}>
                    <div className="ml-5 flex items-center text-white">
                      Employee
                      {sortColumn === "Name" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>

                  <TableHead
                    className="cursor-pointer  max-md:hidden"
                    onClick={() => handleSort("Role")}
                  >
                    <div className="flex items-center text-white">
                      Department
                      {sortColumn === "Role" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>

                  <TableHead
                    className="cursor-pointer  max-md:hidden"
                    onClick={() => handleSort("Updated at")}
                  >
                    <div className="flex items-center text-white">
                      Updated At
                      {sortColumn === "Updated at" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>

                  <TableHead className="cursor-pointer" onClick={() => handleSort("Status")}>
                    <div className="flex items-center text-white">
                      Status
                      {sortColumn === "Status" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>

                  <TableHead className="text-white">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((user,index) => (
                    <TableRow
                      key={index}
                      className={`${
                        selectedRows[user.id] ? "bg-neutral-900" : ""
                      } border-neutral-800 hover:bg-neutral-900/50`}
                    >
                      <TableCell className="">
                        <Checkbox
                          className="cursor-pointer ml-5 border-neutral-600"
                          checked={!!selectedRows[user.id]}
                          onCheckedChange={() => toggleRowSelected(user.id.toString())}
                        />
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3 ml-5">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>
                              {getAvatar({ name: user.username, dp: "" })}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.username}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="max-sm:hidden ">
                        {userRoleIcons[user.role] ? (
                          <div className="flex items-center gap-2">
                            <span className={userRoleIcons[user.role].color}>
                              {userRoleIcons[user.role].icon}
                            </span>
                            <span className="capitalize">{user.role}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-amber-500"></span>
                            <span>Unknown</span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className=" max-md:hidden">
                        {(() => {
                          const date = new Date(user.last_chat_date || 0);
                          return (
                            <div>
                              <p className="text-muted-foreground">{moment(date).fromNow()}</p>
                            </div>
                          );
                        })()}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={`${
                            user.current_mood ? userStatusColors[user.current_mood] || "bg-neutral-200" : "bg-neutral-200"
                          } capitalize`}
                        >
                          {user.current_mood || "Unknown"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center">
                          <Link
                            to={`/report/employee/${user.id}`}
                            className="p-1.5 hover:bg-neutral-800 rounded-sm"
                          >
                            <FileDown className="h-4 w-4" />
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end px-6 py-4 mt-6">
            <div className="flex items-center space-x-6">
              <p className="text-sm text-white">
                Showing <strong>{paginatedData.length}</strong> of{" "}
                <strong>{filteredData.length}</strong> results
              </p>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`cursor-pointer text-black ${
                    currentPage === 0 &&
                    "pointer-events-none text-neutral-500 bg-neutral-700 border-neutral-700"
                  }`}
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className={`cursor-pointer text-black ${
                    (currentPage + 1) * pageSize >= filteredData.length &&
                    "pointer-events-none text-neutral-500 bg-neutral-700 border-neutral-700"
                  }`}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
          
        </main>
      )}
      <Outlet />
    </>
  );
};

export default AdminPage;
