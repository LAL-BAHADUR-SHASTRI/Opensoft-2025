import type React from "react"

import { useState } from "react"
import { ArrowRight, BriefcaseBusiness ,  Eye, EyeOff } from "lucide-react"
import { toast, Toaster } from "sonner"
import { Link , useNavigate} from "react-router"
import axios from "axios"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function EmployeeAuth() {
  const [employeeId, setEmployeeId] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!employeeId.trim() || !password.trim()) {
      toast.error("Please enter your credentials!")
      return
    }
    const Employee  = {
      employeeId: employeeId,
      password: password
    }
    setIsLoading(true)

    // Simulate authentication - replace with actual auth logic
    try {
      // axios.post(`${import.meta.env.BACKEND_URL}/employee/login`, Employee)
      // mock api call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      navigate("/")
    } catch (error) {
        toast.error("Invalid Employee ID or Password.");
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Toaster richColors />
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4 dark">
        <Card className="w-full max-w-md shadow-lg bg-neutral-800">
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
              <label className="block text-sm font-medium pl-1">Employee ID</label>
                <Input
                  id="employeeId"
                  style={{backgroundColor: "#0a0a0a"}}
                  className="border-neutral-700"
                  placeholder="EMP0000"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                />
                <label className="block text-sm font-medium pl-1">Password</label>
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
            <CardFooter>
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
            <Link to="/admin" className="text-sm text-blue-500 hover:underline ml-4 px-4 ">Login as an Admin</Link>
          </form>
        </Card>
      </div>
    </>
  )
}
