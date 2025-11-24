import axiosConfig from "@/configs/axiosConfig";

import type {
  Cinema,
  CinemaParams,
  CinemaPublic,
  CreateCinemaRequest,
  UpdateCinemaRequest,
} from "@/types/cinema";
import axios from "axios";

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

class CinemaService {
  async getAllCinemas(
    params?: CinemaParams
  ): Promise<ServerPaginated<CinemaPublic>> {
    try {
      const { data } = await axiosConfig.get<ServerPaginated<CinemaPublic>>(
        "/cinemas/public",
        { params }
      );
      return data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể lấy danh sách rạp chiếu.");
      console.error("Get cinemas error:", e);
      throw new Error(msg);
    }
  }

  async getCinemaById(id: string): Promise<CinemaPublic> {
    try {
      const { data } = await axiosConfig.get<{ data: CinemaPublic }>(
        `/cinemas/public/${id}`
      );
      return data.data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể lấy thông tin rạp chiếu.");
      console.error("Get cinema detail error:", e);
      throw new Error(msg);
    }
  }

  async addCinema(payload: CreateCinemaRequest): Promise<Cinema> {
    try {
      const { data } = await axiosConfig.post<{ data: Cinema }>(
        "/cinemas",
        payload
      );
      return data.data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể tạo rạp chiếu.");
      console.error("Create cinema error:", e);
      throw new Error(msg);
    }
  }

  async updateCinema(
    id: string,
    payload: UpdateCinemaRequest
  ): Promise<Cinema> {
    try {
      const { data } = await axiosConfig.put<{ data: Cinema }>(
        `/cinemas/${id}`,
        payload
      );
      return data.data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể cập nhật rạp chiếu.");
      console.error("Update cinema error:", e);
      throw new Error(msg);
    }
  }

  async deleteCinema(id: string): Promise<string> {
    try {
      const { data } = await axiosConfig.put<string>(`/cinemas/${id}/archive`);
      return data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể xóa (archive) rạp chiếu.");
      console.error("Archive cinema error:", e);
      throw new Error(msg);
    }
  }

  async restoreCinema(id: string): Promise<string> {
    try {
      const { data } = await axiosConfig.put<string>(`/cinemas/${id}/restore`);
      return data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể khôi phục rạp chiếu.");
      console.error("Restore cinema error:", e);
      throw new Error(msg);
    }
  }
}

export const cinemaService = new CinemaService();
