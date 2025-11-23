// import instance from "../configs/axiosConfig";
// import {
//   Showtime,
//   GetShowtimesParams,
//   ShowtimesResponse,
// } from "../types/showtime";

// export const getAllShowtimes = async (
//   params?: GetShowtimesParams
// ): Promise<ShowtimesResponse> => {
//   try {
//     const queryParams = new URLSearchParams();
//     if (params?.page) queryParams.append("page", params.page.toString());
//     if (params?.limit) queryParams.append("limit", params.limit.toString());
//     if (params?.movieId) queryParams.append("movieId", params.movieId);
//     if (params?.cinemaId) queryParams.append("cinemaId", params.cinemaId);
//     if (params?.roomId) queryParams.append("roomId", params.roomId);
//     if (params?.isActive !== undefined)
//       queryParams.append("isActive", params.isActive.toString());
//     if (params?.startTime) queryParams.append("startTime", params.startTime);
//     if (params?.endTime) queryParams.append("endTime", params.endTime);

//     const response = await instance.get(
//       `/showtimes/public?${queryParams.toString()}`,
//       {
//         requiresAuth: true,
//       } as any
//     );
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// export const getShowtimesByCinemaId = async (
//   cinemaId: string,
//   params?: Omit<GetShowtimesParams, "cinemaId">
// ): Promise<ShowtimesResponse> => {
//   return getAllShowtimes({ ...params, cinemaId });
// };

// export const getShowtimesByMovieId = async (
//   movieId: string,
//   params?: Omit<GetShowtimesParams, "movieId">
// ): Promise<ShowtimesResponse> => {
//   return getAllShowtimes({ ...params, movieId });
// };

// export const getShowtimeById = async (
//   id: string
// ): Promise<{ data: Showtime }> => {
//   try {
//     const response = await instance.get(`/showtimes/public/${id}`, {
//       requiresAuth: true,
//     } as any);
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };
import axiosConfig from "@/configs/axiosConfig";
import type { GetShowtimesParams, Showtime } from "@/types/showtime";
import axios from "axios";
// ===== Types =====

export type PaginationMeta = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type ServerPaginated<T> = {
  pagination: PaginationMeta;
  data: T[];
};

type ApiErrorBody = { message?: string };
const getMsg = (e: unknown, fb: string) =>
  axios.isAxiosError<ApiErrorBody>(e)
    ? (e.response?.data?.message ?? e.message ?? fb)
    : fb;

function toIso(value?: Date | string): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

class ShowTimeService {
  async getShowTimes(
    params?: GetShowtimesParams
  ): Promise<ServerPaginated<Showtime>> {
    try {
      const { data } = await axiosConfig.get<ServerPaginated<Showtime>>(
        "/showtimes/public",
        {
          params: {
            ...params,
            startTime: toIso(params?.startTime),
            endTime: toIso(params?.endTime),
          },
        }
      );
      console.log("api: ", toIso(params?.startTime));
      console.log("showtime: ", data.data);

      return data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể lấy danh sách suất chiếu.");
      console.error("Get ShowTimes error:", e);
      throw new Error(msg);
    }
  }

  async getAllShowTimeByMovieId(
    movieId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ServerPaginated<Showtime>> {
    try {
      const { data } = await axiosConfig.get<ServerPaginated<Showtime>>(
        `/showtimes/by-movie/${movieId}`,
        { params }
      );
      return data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể lấy suất chiếu theo phim.");
      console.error("Get ShowTimes by movie error:", e);
      throw new Error(msg);
    }
  }

  async getShowTimeById(id: string): Promise<Showtime> {
    try {
      const { data } = await axiosConfig.get<{ data: Showtime }>(
        `/showtimes/${id}`
      );
      return data.data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể lấy thông tin suất chiếu.");
      console.error("Get ShowTime detail error:", e);
      throw new Error(msg);
    }
  }

  async createShowTime(payload: {
    movieId: string;
    roomId: string;
    startTime: Date | string;
    endTime: Date | string;
    price: number;
    language: string;
    subtitle: boolean;
    format: string;
  }): Promise<Showtime> {
    try {
      const body = {
        ...payload,
        startTime: toIso(payload.startTime)!,
        endTime: toIso(payload.endTime)!,
      };
      const { data } = await axiosConfig.post<{ data: Showtime }>(
        "/showtimes",
        body
      );
      return data.data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể tạo suất chiếu.");
      console.error("Create ShowTime error:", e);
      throw new Error(msg);
    }
  }

  async updateShowTime(
    id: string,
    payload: Partial<{
      movieId: string;
      roomId: string;
      startTime: Date | string;
      endTime: Date | string;
      price: number;
      language: string;
      subtitle: boolean;
      format: string;
      isActive: boolean;
    }>
  ): Promise<Showtime> {
    try {
      const body = {
        ...payload,
        startTime: toIso(payload.startTime),
        endTime: toIso(payload.endTime),
      };
      const { data } = await axiosConfig.put<{ data: Showtime }>(
        `/showtimes/${id}`,
        body
      );
      return data.data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể cập nhật suất chiếu.");
      console.error("Update ShowTime error:", e);
      throw new Error(msg);
    }
  }

  async deleteShowTime(id: string): Promise<string> {
    try {
      const { data } = await axiosConfig.put<string>(
        `/showtimes/archive/${id}`
      );
      return data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể xóa (archive) suất chiếu.");
      console.error("Archive ShowTime error:", e);
      throw new Error(msg);
    }
  }

  async restoreShowTime(id: string): Promise<string> {
    try {
      const { data } = await axiosConfig.put<string>(
        `/showtimes/restore/${id}`
      );
      return data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể khôi phục suất chiếu.");
      console.error("Restore ShowTime error:", e);
      throw new Error(msg);
    }
  }

  async getBusyRoomIds(params: {
    startTime: Date | string;
    endTime: Date | string;
    cinemaId?: string;
  }): Promise<string[]> {
    try {
      const { data } = await axiosConfig.get<{ data: string[] }>(
        "/showtimes/busy-rooms",
        {
          params: {
            ...params,
            startTime: toIso(params.startTime)!,
            endTime: toIso(params.endTime)!,
          },
        }
      );
      return data.data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể lấy danh sách phòng bận.");
      console.error("Get busy room ids error:", e);
      throw new Error(msg);
    }
  }
}

export const showTimeService = new ShowTimeService();
