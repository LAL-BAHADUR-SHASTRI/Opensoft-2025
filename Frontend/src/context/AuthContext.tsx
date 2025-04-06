import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useLocation } from "react-router";
import { apiClient, routes } from "@/lib/api";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  role: string;
  id: string;
  logout: () => void;  // Add this function
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  setIsLoading: () => {},
  role: "",
  id: "",
  logout: () => {}  // Add this
});

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState("");
  const [id, setId] = useState("");
  const location = useLocation();

  const checkAuthentication = async () => {
    console.log("Checking authentication on mount");
    setIsLoading(true);
    try {
      const response = await apiClient.get(routes.USER_INFO, {
        withCredentials: true,
      });
      console.log("Response from authentication check:", response);
      if (response.status === 200) {
        setIsAuthenticated(true);
        setRole(response.data.role);
        setId(response.data.employee_id);
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false); // Ensure isLoading is set to false after the request
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole("");
    setId("");
  };

  useEffect(() => {
    checkAuthentication();
  }, [location.pathname]);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      setIsLoading, 
      role, 
      id, 
      logout  // Add this
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuthContext = () => useContext(AuthContext);
export { useAuthContext };
export default AuthProvider;
