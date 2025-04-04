/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true
});

const useAuthContext = () => useContext(AuthContext);
export { useAuthContext };
export default AuthContext;
