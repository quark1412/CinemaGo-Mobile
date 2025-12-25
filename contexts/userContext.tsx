import { authService } from "@/services/users/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

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
  setUser: (user: User | null) => void;
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

  const checkSession = async () => {
    try {
      setIsLoading(true);
      const refreshToken = await AsyncStorage.getItem("refreshToken");

      if (refreshToken) {
        console.log("Phát hiện Refresh Token, đang khôi phục phiên...");
        await authService.loginWithRefreshToken(refreshToken);

        const userData = await authService.getProfile();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        handleLogoutState();
      }
    } catch (error) {
      console.log("Phiên đăng nhập hết hạn hoặc lỗi:", error);
      await handleLogoutState();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutState = async () => {
    setUser(null);
    setIsAuthenticated(false);
    await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
  };

  const fetchUserProfile = async () => {
    try {
      if (await authService.isAuthenticated()) {
        const userData = await authService.getProfile();

        setUser(userData);
        setIsAuthenticated(true);
        return userData;
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await authService.login(email, password);
      const userData = await authService.getProfile();

      if (userData.role === "ADMIN") {
        await authService.logout();

        throw new Error("Tài khoản quản lý không được truy cập.");
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.log("Logout error:", error);
    } finally {
      await handleLogoutState();
      router.replace("/(app)/auth/sign-in");
    }
  };

  const refreshUser = async () => {
    await fetchUserProfile();
  };

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const value: UserContextType = {
    user,
    setUser,
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
