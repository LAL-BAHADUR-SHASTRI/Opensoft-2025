// src/components/UserListTable.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Eye, ChevronUp, ChevronDown } from "lucide-react";
import {
  Crown,
  Shield,
  MessageSquare,
  User,
  UserPlus,
  Briefcase,
  Users,
  Star,
  UserCheck,
  UserX,
} from "lucide-react";
import moment from "moment";
// Interfaces
interface UserType {
  id: string;
  Name: string;
  Role: string;

  "Created at": string;
  "Updated at": string;
  Status: string;
}

interface UserListTableProps {
  tableData?: UserType[];
}

// Utility function to get avatar from name
const getAvatar = (user: { name: string; dp: string }) => {
  if (user.dp) return user.dp;

  // Get initials from name
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return initials;
};

// Role and status mapping
const userRoleIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  Admin: { icon: <Crown size={16} />, color: "text-red-500" },
  Superadmin: { icon: <Crown size={16} />, color: "text-purple-500" },
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
  okay: "bg-green-700 text-green-100",
  frustrated: "bg-red-700 text-red-100",
  sad: "bg-blue-800 text-blue-100",
  happy: "bg-green-800 text-green-100",
  excited: "bg-yellow-700 text-yellow-100",
};
const UserListTable = ({ tableData = [] }: UserListTableProps) => {
  // console.log(tableData)
  const [data, setData] = useState<UserType[]>(tableData);
  const [filteredData, setFilteredData] = useState<UserType[]>(data);
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Update filtered data when global filter changes
  useEffect(() => {
    if (!globalFilter) {
      setFilteredData(data);
      return;
    }

    const searchTerm = globalFilter.toLowerCase();
    const filtered = data.filter((user) => {
      // Simplified search across multiple fields
      const searchContent = [user.Name, user.Role, user.Status, user.id].join(" ").toLowerCase();

      return searchContent.includes(searchTerm);
    });

    setFilteredData(filtered);
  }, [globalFilter, data]);

  // Handle sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Apply sorting to data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;

    let valA: any = a[sortColumn as keyof UserType];
    let valB: any = b[sortColumn as keyof UserType];

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination

  const paginatedData =
    pageSize > sortedData.length
      ? sortedData
      : sortedData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  // Select all rows
  const selectAllRows = () => {
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
    setSelectedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <>
      <Card className="w-full min-h-screen dark">
        <CardHeader>
          <h3 className="text-4xl font-bold ">Welcome Manager!</h3>
        </CardHeader>

        {/* Filter controls simplified */}
        <div className="px-6 py-4 border-b flex flex-col-reverse md:flex-row justify-between items-start md:items-center gap-4 ">
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-[100px] cursor-pointer">
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
              className="max-w-sm"
            />

            <Button variant="outline" className="cursor-pointer">
              <Download className="mr-2 h-4 w-4 " /> Download
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto cursor-pointer ">
          <Table className="">
            <TableHeader className="">
              <TableRow>
                <TableHead className="w-[50px] ">
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
                  <div className="ml-5 flex items-center">
                    User
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
                  <div className="flex items-center">
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
                  <div className="flex items-center">
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
                  <div className="flex items-center">
                    Status
                    {sortColumn === "Status" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>

                <TableHead>Action</TableHead>
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
                paginatedData.map((user) => (
                  <TableRow key={user.id} className={selectedRows[user.id] ? "bg-muted/50" : ""}>
                    <TableCell className="">
                      <Checkbox
                        className="cursor-pointer ml-5"
                        checked={!!selectedRows[user.id]}
                        onCheckedChange={() => toggleRowSelected(user.id)}
                      />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3 ml-5">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{getAvatar({ name: user.Name, dp: "" })}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.Name}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="max-sm:hidden ">
                      {userRoleIcons[user.Role] ? (
                        <div className="flex items-center gap-2">
                          <span className={userRoleIcons[user.Role].color}>
                            {userRoleIcons[user.Role].icon}
                          </span>
                          <span className="capitalize">{user.Role}</span>
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
                        const date = new Date(user["Updated at"]);
                        return (
                          <div>
                            {/* <p className="font-medium">{`${date.getUTCDate()}-${date.getUTCMonth()}-${date.getUTCFullYear()}`}</p> */}
                            <p className="text-muted-foreground">{moment(date).fromNow()}</p>
                          </div>
                        );
                      })()}
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={`${
                          userStatusColors[user.Status] || "bg-neutral-200"
                        } capitalize`}
                      >
                        {user.Status || "Unknown"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-5 ml-auto">
                        <Eye className="h-4 w-4" />

                        <Download className="mr-2 h-4 w-4" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Simple pagination */}
        <div className="flex items-center justify-end px-4 py-4">
          <div className="flex items-center space-x-6">
            <p className="text-sm text-muted-foreground">
              Showing <strong>{paginatedData.length}</strong> of{" "}
              <strong>{filteredData.length}</strong> results
            </p>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={(currentPage + 1) * pageSize >= filteredData.length}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};

export default UserListTable;
