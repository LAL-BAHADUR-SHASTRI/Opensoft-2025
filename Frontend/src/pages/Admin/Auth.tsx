import type React from "react";
import { useState, useEffect } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast, Toaster } from "sonner";
import { apiClient, routes } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router";
import { useAuthContext } from "@/context/AuthContext";
import AppLoader from "@/components/AppLoader";

export default function AdminAuth() {
  const [adminId, setAdminId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isAuthLoading, setIsAuthLoading] = useState<boolean | undefined>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const navigate = useNavigate();
  const { setIsLoading } = useAuthContext();
  const { isAuthenticated, role, isLoading } = useAuthContext();

  useEffect(() => {
    if (isAuthenticated) {
      if (role === "employee") {
        navigate("/");
      } else if (role === "hr") {
        navigate("/admin");
      }
    }
  }, [isLoading, isAuthenticated, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminId.trim() || !password.trim()) {
      toast.error("Please enter your credentials!");
      return;
    }

    const formData = new FormData();
    formData.append("username", adminId);
    formData.append("password", password);

    try {
      setIsAuthLoading(true);

      const response = await apiClient.post(routes.SIGN_IN, formData, {
        withCredentials: true,
      });

      if (response.status === 201 || response.status === 200) {
        setIsAuthLoading(false);
        toast.success("Login successful! Redirecting...");
        setIsLoading(true);
        setTimeout(() => {
          navigate("/admin");
        }, 1000);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
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
      {isLoading && <AppLoader></AppLoader>}
      {!isLoading && !isAuthenticated && (
        <>
          <Toaster richColors />
          
            <div className="flex min-h-screen  items-center justify-center bg-neutral-950 p-4 dark">
              
            <Card className="w-full max-w-md shadow-lg bg-transparent border-0 sm:border-2 sm:bg-neutral-900">
              <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-2">
                <h2 className="text-4xl font-bold text-white  flex items-center gap-1">
                WellBot<span className="text-green-500 text-3xl">•</span>
                </h2>
                </div>
                <CardTitle className="text-[17px] font-light">Hello, Admin! </CardTitle>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4 pb-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-500 pl-1">
                      Enter Admin ID
                    </label>
                    <Input
                      id="adminId"
                      className="border-neutral-800 bg-neutral-900 placeholder:text-neutral-600"
                      placeholder="hr100000"
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                    />
                    <label className="block text-sm font-medium text-neutral-500 pl-1 mt-3">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        className="border-neutral-800 bg-neutral-900 placeholder:text-neutral-600 pr-10"
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="mb-1">
                  <Button
                    type="submit"
                    className="w-full bg-primary cursor-pointer"
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
                  <Link to={"/auth"} className="text-sm text-neutral-500 hover:underline ml-4 px-2">
                    Login as an Employee?
                  </Link>
                </div>
              </form>
            </Card>
            </div>
            
          
        </>
      )}
    </>
  );
}
