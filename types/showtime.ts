export interface Showtime {
  id: string;
  movieId: string;
  roomId: string;
  cinemaId: string;
  startTime: string;
  endTime: string;
  price: number;
  language: string;
  subtitle: boolean;
  format: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  movie?: {
    id: string;
    title: string;
    thumbnail: string;
    duration: number;
  };
  room?: {
    id: string;
    name: string;
  };
  cinema?: {
    id: string;
    name: string;
    address: string;
  };
}

export interface ShowtimeWithDetails extends Showtime {
  movieTitle?: string;
  cinemaName?: string;
  roomName?: string;
  cinemaAddress?: string;
  moviePoster?: string;
}

export interface GetShowtimesParams {
  page?: number;
  limit?: number;
  movieId?: string;
  cinemaId?: string;
  roomId?: string;
  isActive?: boolean;
  startTime?: string;
  endTime?: string;
}

export interface ShowtimesResponse {
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  data: Showtime[];
}

export interface SeatLayout {
  rows: number;
  cols: number;
  seats: Seat[][];
}

export interface Seat {
  row: number;
  col: number;
  seatNumber: string;
  type: SeatType;
  status: SeatStatus;
  price: number;
  id?: string;
  extraPrice?: number;
  isCoupleSeat?: boolean;
  coupleWith?: number;
}

export enum SeatType {
  NORMAL = "NORMAL",
  VIP = "VIP",
  COUPLE = "COUPLE",
  BLOCKED = "BLOCKED",
  EMPTY = "EMPTY",
}

export enum SeatStatus {
  AVAILABLE = "AVAILABLE",
  SELECTED = "SELECTED",
  BOOKED = "BOOKED",
}

export interface DateOption {
  date: Date;
  dayOfWeek: string;
  dayOfMonth: string;
  fullDate: string;
}

export interface SelectedSeatsInfo {
  seats: Seat[];
  totalPrice: number;
  seatNumbers: string[];
}
