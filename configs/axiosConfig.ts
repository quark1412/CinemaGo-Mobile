import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { InternalAxiosRequestConfig } from "axios";
import dayjs from "dayjs";
import { jwtDecode } from "jwt-decode";

// const baseURL =
//   process.env.EXPO_PUBLIC_BASE_URL || "http://192.168.16.59:8000/v1";
const baseURL = "http://192.168.1.6:8000/v1";

console.log(process.env.EXPO_PUBLIC_BASE_URL);

const instance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  requiresAuth?: boolean;
}

instance.interceptors.request.use(
  async (
    req: CustomAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      console.log(accessToken, refreshToken);

      const requiresAuth = req.requiresAuth !== false;

      if (!requiresAuth) {
        return req;
      }

      if (!req.headers) {
        req.headers = axios.AxiosHeaders.from(req.headers || {});
      }

      if (accessToken) {
        try {
          const user: { exp: number } = jwtDecode(accessToken);
          const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1;

          if (!isExpired) {
            req.headers.Authorization = `Bearer ${accessToken}`;
            return req;
          }
        } catch (err) {
          console.warn("Invalid token:", err);
        }
      }

      if (!refreshToken) {
        return req;
      }

      try {
        const response = await axios.post(`${baseURL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        await AsyncStorage.setItem("accessToken", newAccessToken);
        await AsyncStorage.setItem("refreshToken", newRefreshToken);

        req.headers.Authorization = `Bearer ${newAccessToken}`;
        return req;
      } catch (err: any) {
        console.log("Token refresh failed:", err?.message || "Unknown error");
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");
        return req;
      }
    } catch (error: any) {
      console.log(
        "API Error:",
        error.response?.status,
        error.response?.data || error.message
      );
      return req;
    }
  }
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.log(
        "API Error:",
        error.response.status,
        error.response.data?.message || error.message
      );
    } else if (error.request) {
      // Request made but no response
      console.log("Network Error: No response received", error.message);
    } else {
      // Something else happened
      console.log("Request Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default instance;
