export interface Genre {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  duration: number;
  releaseDate: Date;
  rating: number;
  thumbnail: string;
  thumbnailPublicId: string;
  trailerUrl: string;
  trailerPublicId: string;
  genres: Genre[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  status: string;
}

export interface GetMoviesParams {
  page?: number;
  limit?: number;
  search?: string;
  rating?: number;
  genreQuery?: string;
  status?: string;
  isActive?: boolean;
}

export interface MoviesResponse {
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  data: Movie[];
}
