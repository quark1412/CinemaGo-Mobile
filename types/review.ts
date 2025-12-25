export interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ResponseItem {
  userId: string;
  content: string;
  createdAt: string;
  userDetail: UserDetail;
}

export interface UserDetail {
  fullname: string;
  avatarUrl?: string | null;
}

export interface Review {
  id: string;
  userId: string;
  movieId: string;
  rating: number;
  content?: string | null;
  status?: string | null;
  response?: ResponseItem[];
  isActive: boolean;
  type: string;
  userDetail?: UserDetail | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedReviews {
  pagination: Pagination;
  data: Review[];
}

export interface ReviewOverview {
  averageRating: number; // BE đang toFixed(1) => string, nếu bị lỗi thì đổi thành number | string
  totalReviews: number;
  ratingDistribution: number[];
}

// ===== Input params =====

export interface GetReviewsParams {
  page?: number;
  limit?: number;
  movieId?: string;
  rating?: number;
  userId?: string;
  type?: string;
  status?: string;
  isActive?: boolean;
}

export interface ReviewFilterValues {
  movieId: string; // bắt buộc có phim
  rating?: number;
  status?: string;
  type?: string;
  isActive?: boolean;
  // nếu sau này cần lọc theo user: userId?: string;
}

export interface CreateReviewInput {
  movieId: string;
  rating: number;
  content?: string;
}

export interface ReplyToReviewInput {
  reviewId: string;
  content: string;
}

export interface UpdateReviewInput {
  reviewId: string;
  content?: string;
  rating?: number;
}
