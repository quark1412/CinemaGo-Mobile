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

      return data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể lấy danh sách suất chiếu.");
      console.log("Get ShowTimes error:", e);
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
      console.log("Get ShowTimes by movie error:", e);
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
      console.log("Get ShowTime detail error:", e);
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
      console.log("Create ShowTime error:", e);
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
      console.log("Update ShowTime error:", e);
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
      console.log("Archive ShowTime error:", e);
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
      console.log("Restore ShowTime error:", e);
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
      console.log("Get busy room ids error:", e);
      throw new Error(msg);
    }
  }
}

export const showTimeService = new ShowTimeService();
