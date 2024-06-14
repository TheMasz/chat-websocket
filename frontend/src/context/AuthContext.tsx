import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axiosInstance from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { userType } from "../types";
import { isError } from "../utils/functions";
import { enqueueSnackbar } from "notistack";

interface AuthState {
  user: userType | null;
  login: (emailOrUsername: string, password: string) => void;
  register: (email: string, password: string, cfPassword: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<userType | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser) as userType);
    }
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    try {
      const response = await axiosInstance.post("/api/auth/signin", {
        emailOrUsername,
        password,
      });
      setUser(response.data);
      localStorage.setItem("user", JSON.stringify(response.data));
      enqueueSnackbar("You have successfully signed in.", { variant: "info" });
      navigate("/");
    } catch (error: unknown) {
      if (isError(error)) {
        console.log(error.message);
        enqueueSnackbar(error.message, { variant: "error" });
      } else {
        console.log("An unknown error occurred.");
      }
    }
  };

  const register = async (
    email: string,
    password: string,
    cfPassword: string
  ) => {
    try {
      const response = await axiosInstance.post("/api/auth/signup", {
        email,
        password,
        cfPassword,
      });
      if (response.status === 200) {
        enqueueSnackbar("You have successfully created an account.", {
          variant: "info",
        });
        navigate("/signin");
      }
    } catch (error: unknown) {
      if (isError(error)) {
        console.log(error.message);
        enqueueSnackbar(error.message, { variant: "error" });
      } else {
        console.log("An unknown error occurred.");
      }
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post("/api/auth/signout");
      setUser(null);
      localStorage.removeItem("user");
      enqueueSnackbar("You have successfully logged out.", {
        variant: "info",
      });
    } catch (error: unknown) {
      if (isError(error)) {
        console.log(error.message);
      } else {
        console.log("An unknown error occurred.");
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, useAuth };
