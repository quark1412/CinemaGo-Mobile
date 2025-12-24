import { authService } from "@/services/users/auth";
import {
  clearBiometricDataForUser,
  getBiometricUserId,
  isBiometricEnabled,
  updateBiometricToken,
} from "@/services/users/biometric";
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
      console.log("Checking session, refreshToken exists:", !!refreshToken);

      if (refreshToken) {
        console.log("Found Refresh Token, attempting refresh...");
        const { refreshToken: newRefreshToken, accessToken } =
          await authService.loginWithRefreshToken(refreshToken);
        console.log("Token refreshed success. AccessToken:", !!accessToken);

        const userData = await authService.getProfile(accessToken);
        console.log("Profile fetched:", userData?.id);

        setUser(userData);
        setIsAuthenticated(true);

        // Update biometric token if this user is enabled
        if (userData?.id) {
          console.log("Updating bio token for user:", userData.id);
          await updateBiometricToken(userData.id, newRefreshToken);
        }
      } else {
        console.log("No token found, handling logout state.");
        handleLogoutState();
      }
    } catch (error: any) {
      console.log("Detailed Session Check Error:", error);
      console.log("Error Message:", error?.message);
      if (error?.response) {
        console.log("API Log:", error.response.status, error.response.data);
      }
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
      console.error("Failed to fetch user profile:", error);
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);

      const { accessToken } = response;
      const userData = await authService.getProfile(accessToken);

      setUser(userData);
      setIsAuthenticated(true);

      if (userData.role === "ADMIN") {
        await authService.logout();

        throw new Error("Tài khoản quản lý không được truy cập.");
      }

      const currentBioUser = await getBiometricUserId();
      if (currentBioUser && currentBioUser !== userData.id) {
        await clearBiometricDataForUser(currentBioUser);
      }

      const refreshToken = await AsyncStorage.getItem("refreshToken");
      if (refreshToken) {
        await updateBiometricToken(userData.id, refreshToken);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (user?.id && (await isBiometricEnabled(user.id))) {
        console.log("Biometric enabled, performing local logout only.");
      } else {
        await authService.logout();
      }
    } catch (error) {
      console.error("Logout error:", error);
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
