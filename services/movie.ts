import axiosConfig from "@/configs/axiosConfig";
import type { GetMoviesParams, Movie, MoviesResponse } from "@/types/movie";
import axios from "axios";

type ApiErrorBody = { message?: string };
const getMsg = (e: unknown, fb: string) =>
  axios.isAxiosError<ApiErrorBody>(e)
    ? (e.response?.data?.message ?? e.message ?? fb)
    : fb;

interface GetTopRatedMoviesParams {
  limit?: number;
}

// ===== Service =====
class MovieService {
  // GET /movies/public -> { pagination, data }
  async getAllMovies(params?: GetMoviesParams): Promise<MoviesResponse> {
    try {
      const { data } = await axiosConfig.get<MoviesResponse>("/movies/public", {
        params,
      });
      return data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể lấy danh sách phim.");
      console.log("Get movies error:", e);
      throw new Error(msg);
    }
  }

  async getTopRatedMovies(params?: GetTopRatedMoviesParams): Promise<Movie[]> {
    try {
      const { data } = await axiosConfig.get<MoviesResponse>(
        "/movies/public/top-rated",
        { params }
      );
      return data.data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể lấy danh sách phim top rating.");
      console.log("Get top rated movies error:", e);
      throw new Error(msg);
    }
  }

  // GET /movies/public/:movieId -> { data: movie }
  async getMovieById(id: string): Promise<Movie> {
    try {
      const { data } = await axiosConfig.get<{ data: Movie }>(
        `/movies/public/${id}`
      );
      return data.data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể lấy thông tin phim.");
      console.log("Get movie detail error:", e);
      throw new Error(msg);
    }
  }

  // POST /movies (multipart) -> { data: movie }
  async addMovie(form: FormData): Promise<Movie> {
    try {
      const { data } = await axiosConfig.post<{ data: Movie }>(
        "/movies",
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return data.data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể tạo phim.");
      console.log("Create movie error:", e);
      throw new Error(msg);
    }
  }

  // PUT /movies/:movieId (multipart) -> { data: movie }
  async updateMovie(id: string, form: FormData): Promise<Movie> {
    try {
      const { data } = await axiosConfig.put<{ data: Movie }>(
        `/movies/${id}`,
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return data.data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể cập nhật phim.");
      console.log("Update movie error:", e);
      throw new Error(msg);
    }
  }

  // PUT /movies/status -> string
  async updateMovieStatus(movieIds: string[], status: string): Promise<string> {
    try {
      const { data } = await axiosConfig.put<string>("/movies/status", {
        movieIds,
        status,
      });
      return data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể cập nhật trạng thái phim.");
      console.log("Update movie status error:", e);
      throw new Error(msg);
    }
  }

  // PUT /movies/archive/:movieId -> string
  async deleteMovie(id: string): Promise<string> {
    try {
      const { data } = await axiosConfig.put<string>(`/movies/archive/${id}`);
      return data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể xóa (archive) phim.");
      console.log("Archive movie error:", e);
      throw new Error(msg);
    }
  }

  // PUT /movies/restore/:movieId -> string
  async restoreMovie(id: string): Promise<string> {
    try {
      const { data } = await axiosConfig.put<string>(`/movies/restore/${id}`);
      return data;
    } catch (e: unknown) {
      const msg = getMsg(e, "Không thể khôi phục phim.");
      console.log("Restore movie error:", e);
      throw new Error(msg);
    }
  }
}

export const movieService = new MovieService();
