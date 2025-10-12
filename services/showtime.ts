import instance from "../configs/axiosConfig";
import {
  Showtime,
  GetShowtimesParams,
  ShowtimesResponse,
} from "../types/showtime";

export const getAllShowtimes = async (
  params?: GetShowtimesParams
): Promise<ShowtimesResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.movieId) queryParams.append("movieId", params.movieId);
    if (params?.cinemaId) queryParams.append("cinemaId", params.cinemaId);
    if (params?.roomId) queryParams.append("roomId", params.roomId);
    if (params?.isActive !== undefined)
      queryParams.append("isActive", params.isActive.toString());
    if (params?.startTime) queryParams.append("startTime", params.startTime);
    if (params?.endTime) queryParams.append("endTime", params.endTime);

    const response = await instance.get(
      `/showtimes/public?${queryParams.toString()}`,
      {
        requiresAuth: true,
      } as any
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getShowtimesByCinemaId = async (
  cinemaId: string,
  params?: Omit<GetShowtimesParams, "cinemaId">
): Promise<ShowtimesResponse> => {
  return getAllShowtimes({ ...params, cinemaId });
};

export const getShowtimesByMovieId = async (
  movieId: string,
  params?: Omit<GetShowtimesParams, "movieId">
): Promise<ShowtimesResponse> => {
  return getAllShowtimes({ ...params, movieId });
};

export const getShowtimeById = async (
  id: string
): Promise<{ data: Showtime }> => {
  try {
    const response = await instance.get(`/showtimes/public/${id}`, {
      requiresAuth: true,
    } as any);
    return response.data;
  } catch (error) {
    throw error;
  }
};
