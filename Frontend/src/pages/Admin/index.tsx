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
import { useAuthContext } from "@/context/AuthContext";
import AppLoader from "@/components/AppLoader";

import { Icon } from "@iconify-icon/react";
import { useReportContext } from "@/context/ReportContext";

interface UserType {
  id: number;
  email: string;
  username: string;
  hashed_password: string;
  role: string;
  is_active: boolean;
  employee_id: string;
  last_login_date: string | null;
  last_chat_date: string | null;
  hr_escalation: number;
  next_chat_data: string | null;
  escalation_reason: string | null;
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
  "neutral zone (ok)": "bg-green-700/50 text-green-100",
  "frustrated zone": "bg-red-700/50 text-red-100",
  "sad zone": "bg-blue-800/50 text-blue-100",
  "leaning to happy zone": "bg-green-800/50 text-green-100",
  "happy zone": "bg-yellow-700/50 text-yellow-100",
  "leaning to sad zone": "bg-blue-700/50 text-blue-100",
};

const zoneMappings: Record<string, string> = {
  "neutral zone (ok)": "neutral zone",
  "frustrated zone": "frustrated zone",
  "sad zone": "sad zone",
  "leaning to happy zone": "happy zone",
  "happy zone": "excited zone",
  "leaning to sad zone": "sad zone",
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
  const { isAuthenticated, isLoading, role } = useAuthContext();
  const { setEmployeeIds } = useReportContext();
  const [showReportBtn, setShowReportBtn] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get(routes.USERS, {
          withCredentials: true,
        });

        if (response.status === 200) {
          console.log(response.data.data);
          setData(response.data.data);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setData([]);
      }
    };
    if (isAuthenticated && !data.length) {
      fetchData();
    } // Only fetch data if authenticated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Empty dependency array ensures it runs only once

  useEffect(() => {
    const ids = Object.keys(selectedRows);
    setEmployeeIds(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRows]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || role !== "hr") {
        navigate("/admin/auth");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!globalFilter) {
      setFilteredData(data);
      return;
    }

    const searchTerm = globalFilter.toLowerCase();

    const filtered = data.filter((user) => {
      const searchContent = [user.username, user.role, user.current_mood, user.id]
        .join(" ")
        .toLowerCase();

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

  const sortedData = Array.isArray(filteredData)
    ? [...filteredData].sort((a, b) => {
        if (!sortColumn) return 0;

        const valA = a[sortColumn as keyof UserType];
        const valB = b[sortColumn as keyof UserType];

        if (valA == null || valB == null) return 0;
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      })
    : [];

  const paginatedData =
    pageSize > sortedData.length
      ? sortedData
      : sortedData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const selectAllRows = () => {
    if (!Array.isArray(filteredData)) {
      return;
    }

    const allSelected = Object.keys(selectedRows).length === filteredData.length;

    if (allSelected) {
      setSelectedRows({});
    } else {
      const newSelected: Record<string, boolean> = {};

      filteredData.forEach((user) => {
        newSelected[user.employee_id] = true;
      });

      setSelectedRows(newSelected);
    }
  };

  const toggleRowSelected = (id: string) => {
    setSelectedRows((prevSelectedRows) => {
      const newSelectedRows = { ...prevSelectedRows };

      if (newSelectedRows[id]) {
        delete newSelectedRows[id];
      } else {
        newSelectedRows[id] = true;
      }

      return newSelectedRows;
    });
  };

  useEffect(() => {
    if (Object.keys(selectedRows).length > 0) {
      setShowReportBtn(true);
    } else {
      setShowReportBtn(false);
    }
  }, [selectedRows]);

  const handleLogout = async () => {
    try {
      const response = await apiClient.post(routes.LOGOUT, {}, { withCredentials: true });
      if (response.status === 200) {
        navigate("/admin/auth");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("Error logging out!");
    }
  };

  return (
    <>
      {isLoading && <AppLoader></AppLoader>}
      {!isLoading && isAuthenticated && role == "hr" && (
        <main className="w-full min-h-screen rounded-none bg-neutral-950 text-white pb-6">
          <div className="flex justify-between items-center gap-4 py-4 px-6 border-b border-neutral-800">
            <div className="flex items-center">
              <h2 className="text-2xl tracking-wide font-medium text-neutral-100">Deloitte</h2>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={"/admin/upload"}
                state={{ background: location }}
                className="py-2 px-5 border border-primary bg-primary text-black rounded-md"
              >
                Upload Files
              </Link>

              <button
                className="flex items-center gap-2 text-white bg-wh py-2 pl-4 pr-3 border-2 border-neutral-800 rounded-md cursor-pointer hover:bg-neutral-800"
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
                className="cursor-pointer text-black bg-primary rounded-md py-1.5 px-4 flex items-center gap-1"
              >
                <FileDown className="mr-2 h-4 w-4 " />
                <span className="text-nowrap">Report All</span>
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

                  <TableHead
                    className="cursor-pointer  max-md:hidden"
                    onClick={() => handleSort("Needs Help")}
                  >
                    <div className="flex items-center text-white">
                      Needs Help
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
                  // paginatedData.map((user, index) =>
                  paginatedData.map((user, index) => (
                    <TableRow
                      key={index}
                      className={`${
                        selectedRows[user.employee_id] ? "bg-neutral-900" : ""
                      } border-neutral-800 hover:bg-neutral-900/50`}
                    >
                      <TableCell className="">
                        <Checkbox
                          className="cursor-pointer ml-5 border-neutral-600"
                          checked={!!selectedRows[user.employee_id]}
                          onCheckedChange={() => toggleRowSelected(user.employee_id)}
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
                            <p className="font-medium">{user.employee_id}</p>
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

                      <TableCell className=" max-md:hidden">
                        {(() => {
                          return (
                            <div className="flex">
                              <div
                                className={`py-0.5 px-3 text-sm rounded-sm ${
                                  user.hr_escalation ? "bg-red-600/20" : "bg-green-700/30"
                                } w-fit`}
                              >
                                <p
                                  className={`${
                                    user.hr_escalation ? "text-red-500" : "text-green-500"
                                  }`}
                                >
                                  {`${user.hr_escalation ? "Yes!" : "No"}`}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </TableCell>

                      <TableCell>
                        <div
                          className={`w-fit py-0.5 px-2 text-sm rounded-md ${
                            user.current_mood
                              ? userStatusColors[user.current_mood.toLowerCase()] ||
                                "bg-neutral-200"
                              : "bg-neutral-800"
                          } capitalize`}
                        >
                          {user.current_mood
                            ? zoneMappings[user.current_mood.toLowerCase()]
                            : "Unknown"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/report/employee/${user.employee_id}`}
                            className="p-1.5 hover:bg-neutral-800 rounded-sm"
                          >
                            <FileDown className="h-4 w-4" />
                          </Link>
                          {user.hr_escalation == 1 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-inherit hover:bg-neutral-800 hover:text-white cursor-pointer border-none text-white"
                              onClick={async () => {
                                try {
                                  // Replace with your actual API endpoint to resolve HR escalation
                                  await apiClient.post(
                                    `/hr/resolve-escalation/${user.employee_id}`,
                                    {},
                                    { withCredentials: true }
                                  );

                                  // Update local state
                                  setData((prevData) =>
                                    prevData.map((u) =>
                                      u.employee_id === user.employee_id
                                        ? { ...u, hr_escalation: 0 }
                                        : u
                                    )
                                  );
                                } catch (error) {
                                  console.error("Failed to resolve issue:", error);
                                  alert("Failed to resolve the issue. Please try again.");
                                }
                              }}
                            >
                              {/* <Icon icon="heroicons:check" /> */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="256"
                                height="256"
                                viewBox="0 0 512 512"
                              >
                                <path
                                  fill="currentColor"
                                  d="m199.066 456l-7.379-7.514l-3.94-3.9l-86.2-86.2l.053-.055l-83.664-83.666l97.614-97.613l83.565 83.565L398.388 61.344L496 158.958L296.729 358.229l-11.26 11.371ZM146.6 358.183l52.459 52.46l.1-.1l.054.054l52.311-52.311l11.259-11.368l187.963-187.96l-52.358-52.358l-199.273 199.271l-83.565-83.565l-52.359 52.359l83.464 83.463Z"
                                />
                              </svg>
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center gap-4 justify-end px-6 py-4 mt-6">
            {showReportBtn && (
              <Link
                to={"/report/employees"}
                className="cursor-pointer text-black bg-primary rounded-md py-1.5 px-4 flex items-center gap-1"
              >
                <FileDown className="mr-2 h-4 w-4 " />
                Report
              </Link>
            )}
            <div className="flex items-center space-x-6">
              <p className="text-sm text-white">
                Showing <strong>{paginatedData.length}</strong> of{" "}
                <strong>{filteredData.length}</strong> results
              </p>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`bg-primary cursor-pointer border-primary hover:bg-primary/90 text-black ${
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
                  className={`bg-primary cursor-pointer border-primary hover:bg-primary/90 text-black ${
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
