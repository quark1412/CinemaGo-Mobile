import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authService } from "@/services/users/auth";
import { useRouter } from "expo-router";

interface User {
  id: string;
  email: string;
  fullname: string;
  gender: string;
  role: string;
  avatarUrl?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const fetchUserProfile = async () => {
    try {
      if (await authService.isAuthenticated()) {
        const userData = await authService.getProfile();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await authService.login(email, password);
      await fetchUserProfile();
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      router.replace("/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
      setUser(null);
      setIsAuthenticated(false);
      router.replace("/sign-in");
    }
  };

  const refreshUser = async () => {
    await fetchUserProfile();
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const value: UserContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
