import axiosConfig from "@/configs/axiosConfig";

export interface ShowtimeDetails {
  id: string;
  movieId: string;
  cinemaId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  date: string;
  price: number;
  movieTitle?: string;
  cinemaName?: string;
  roomName?: string;
}

export const showtimeService = {
  // Get showtime details by ID
  getShowtimeById: async (showtimeId: string): Promise<ShowtimeDetails> => {
    try {
      const response = await axiosConfig.get(
        `/showtime-service/api/showtimes/public/${showtimeId}`
      );

      const showtime = {
        ...response.data.data,
        startTime: response.data.data.startTime,
        endTime: response.data.data.endTime,
      } as ShowtimeDetails;

      return showtime;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch showtime details"
      );
    }
  },

  // Get all showtimes for a movie
  getShowtimesByMovieId: async (movieId: string) => {
    try {
      const response = await axiosConfig.get(
        `/showtime-service/api/showtimes/movie/${movieId}`
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch showtimes"
      );
    }
  },

  // Get all showtimes for a cinema
  getShowtimesByCinemaId: async (cinemaId: string) => {
    try {
      const response = await axiosConfig.get(
        `/showtime-service/api/showtimes/cinema/${cinemaId}`
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch showtimes"
      );
    }
  },
};
