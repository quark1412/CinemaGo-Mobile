import instance from "@/configs/axiosConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const authService = {
  login: async (email: string, password: string) => {
    try {
      const response = await instance.post(`/auth/login`, {
        email,
        password,
      });

      const { accessToken, refreshToken } = response.data;

      await AsyncStorage.setItem("accessToken", accessToken);
      await AsyncStorage.setItem("refreshToken", refreshToken);

      return response.data;
    } catch (error) {
      throw error;
    }
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
      const response = await instance.get(`/users/profile`);
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
};
