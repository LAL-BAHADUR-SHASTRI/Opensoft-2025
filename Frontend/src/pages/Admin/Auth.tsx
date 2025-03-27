import type React from "react";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast, Toaster } from "sonner";
import axios from "axios";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link,useNavigate } from "react-router";

export default function AdminAuth() {
  const [adminId, setAdminId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean | undefined>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();


    if (!adminId.trim() || !password.trim()) {
      toast.error("Please enter your credentials!");
      return;
    }

    const Admin  = {
      adminId: adminId,
      password: password
    }
    setIsLoading(true);

    // Simulate authentication - replace with actual auth logic
    try {
      // axios.post(`${import.meta.env.BACKEND_URL}/admin/login`, Admin)
      // mock api call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Successfully authenticated.");
      navigate("/admin");
    } catch (error) {
      toast.error("Invalid admin ID or Password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster richColors />
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4 dark">
        <Card className="w-full max-w-md shadow-lg   bg-neutral-800">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <img src="\src\assets\deloitte-logo.jpg" className="rounded-xl" width={"300px"}/>
            </div>
            <CardTitle className="text-xl font-light">Welcome back, Admin</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pb-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium pl-1"> Enter Admin ID</label>
                <Input
                  id="adminId"
                  style={{ backgroundColor: "#0a0a0a" }}
                  className="border-neutral-700"
                  placeholder="HR100000"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                />
                <label className="block text-sm font-medium pl-1 mt-4">Password</label>
                <div className="relative">
                  <Input
                    id="password"
                    style={{ backgroundColor: "#0a0a0a" }}
                    className="border-neutral-700 pr-10"
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
            <CardFooter className="mb-1">
              <Button type="submit" className="w-full pt-3 cursor-pointer" disabled={isLoading}>
                {isLoading ? (
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
            <Link to={"/"} className="text-sm  text-blue-500 hover:underline ml-4 px-2">
            Login as an Employee?
            </Link>
          </form>
        </Card>
      </div>
    </>
  );
}
