import instance from "@/configs/axiosConfig";
import {
  isBiometricEnabled,
  updateBiometricToken,
} from "@/services/users/biometric";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const authService = {
  login: async (email: string, password: string) => {
    try {
      const response = await instance.post(
        `/auth/login`,
        {
          email,
          password,
        },
        {
          requiresAuth: false,
        } as any
      );

      const { accessToken, refreshToken } = response.data;
      console.log(accessToken);

      await AsyncStorage.setItem("accessToken", accessToken);
      await AsyncStorage.setItem("refreshToken", refreshToken);

      return response.data;
    } catch (error) {
      console.log("Login service error", error);
      throw error;
    }
  },

  loginWithRefreshToken: async (refreshToken: string) => {
    const res = await instance.post("/auth/refresh-token", { refreshToken }, {
      requiresAuth: false,
    } as any);

    const { accessToken, refreshToken: newRefreshToken } = res.data;
    console.log(accessToken);

    await AsyncStorage.setItem("accessToken", accessToken);
    await AsyncStorage.setItem("refreshToken", newRefreshToken);

    if (await isBiometricEnabled()) {
      await updateBiometricToken(newRefreshToken);
    }

    return { accessToken, refreshToken: newRefreshToken };
  },

  signup: async (
    email: string,
    fullname: string,
    password: string,
    gender: string
  ) => {
    try {
      const response = await instance.post(`/auth/signup`, {
        email,
        fullname,
        password,
        gender,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");

      if (refreshToken) {
        await instance.post(`/auth/logout`, { refreshToken });
      }

      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");

      return { message: "Logged out successfully" };
    } catch (error) {
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response = await instance.get(`/users/profile`, {
        requiresAuth: true,
      } as any);
      console.log("profile nè: ", response.data.data);

      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  updateProfile: async (
    data: FormData | { fullname: string; gender: string }
  ) => {
    try {
      const response = await instance.put(`/users/profile`, data, {
        headers:
          data instanceof FormData
            ? {
                "Content-Type": "multipart/form-data",
              }
            : undefined,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  changePassword: async (data: {
    oldPassword: string;
    newPassword: string;
  }) => {
    try {
      const response = await instance.post(`/auth/change-password`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  isAuthenticated: async () => {
    const accessToken = await AsyncStorage.getItem("accessToken");
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    return !!(accessToken || refreshToken);
  },

  sendVerificationEmail: async (email: string) => {
    try {
      const response = await instance.post(`/auth/send-verification-link`, {
        email,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  verifyAccountByLink: async (userId: string, token: string) => {
    try {
      const response = await instance.post(`/auth/verify-account-by-link`, {
        userId,
        token,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
