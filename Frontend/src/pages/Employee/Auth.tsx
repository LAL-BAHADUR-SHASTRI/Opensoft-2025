import type React from "react";

import { useEffect, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Eye, EyeOff, Loader } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Link, useNavigate } from "react-router";
import { apiClient, routes } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/context/AuthContext";
import AppLoader from "@/components/AppLoader";

export default function EmployeeAuth() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setIsLoading, isAuthenticated, role, isLoading } = useAuthContext();

  useEffect(() => {
    if (isAuthenticated) {
      if (role === "hr") {
        navigate("/admin");
      } else if (role === "employee") {
        navigate("/");
      }
    }
  }
  , [isAuthenticated, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId.trim() || !password.trim()) {
      toast.error("Please enter your credentials!");
      return;
    }

    const formData = new FormData();
    formData.append("username", employeeId);
    formData.append("password", password);

    try {
      setIsAuthLoading(true);
      const response = await apiClient.post(routes.SIGN_IN, formData, { withCredentials: true });

      if (response.status === 201 || response.status === 200) {
        setIsAuthLoading(false);
        toast.success("Login successful! Redirecting...");
        setIsLoading(true);
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (error: any) {
      console.log(error);
      if (error.status === 401) {
        toast.error("Incorrect credentials, please try again!");
      } else {
        toast.error("Internal server error, please try after some time");
      }

      setIsAuthLoading(false);
    }
  };

  return (
    <>
    {(isLoading || (isAuthenticated && role == "hr")) && (<AppLoader></AppLoader>)}
    {!isLoading && !isAuthenticated && (
      <>
      <Toaster richColors />
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4 dark select-none">
        <Card className="w-full max-w-md shadow-lg bg-neutral-900">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <BriefcaseBusiness className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome back, Employee</CardTitle>
            <CardDescription>Enter your details to continue</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pb-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-500 uppercase pl-1">
                  Employee ID
                </label>
                <Input
                  id="employeeId"
                  className="border-neutral-800 bg-neutral-900 placeholder:text-neutral-600"
                  placeholder="EMP0000"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                />
                <label className="block text-sm font-medium text-neutral-500 uppercase pl-1 mt-3">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    className="border-neutral-800 bg-neutral-900 placeholder:text-neutral-600 pr-10"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="bg-white w-full pt-3 cursor-pointer"
                disabled={isAuthLoading}
              >
                {isAuthLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </CardFooter>
            <div className="mt-4 flex justify-center">
              <Link
                to={"/admin/auth"}
                className="text-sm text-neutral-500 hover:underline ml-4 px-2"
              >
                Login as an Admin
              </Link>
            </div>
          </form>
        </Card>
      </div></>)}
    </>
  );
}
