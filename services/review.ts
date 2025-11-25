// src/services/review.service.ts

import axiosConfig from "@/configs/axiosConfig";
import type {
  CreateReviewInput,
  GetReviewsParams,
  PaginatedReviews,
  ReplyToReviewInput,
  Review,
  ReviewOverview,
  UpdateReviewInput,
} from "@/types/review";
const GRAPHQL_PATH = "/reviews";

// ===== Helper gọi GraphQL chung =====

type GraphQLError = {
  message: string;
};

type GraphQLRawResponse<T> = {
  data?: T;
  errors?: GraphQLError[];
};

async function graphqlRequest<T, V extends object = object>(
  query: string,
  variables?: V
): Promise<T> {
  const res = await axiosConfig.post<GraphQLRawResponse<T>>(GRAPHQL_PATH, {
    query,
    variables,
  });

  if (res.data.errors && res.data.errors.length > 0) {
    throw new Error(res.data.errors[0].message);
  }

  if (!res.data.data) {
    throw new Error("No data returned from GraphQL");
  }

  return res.data.data;
}
// ===== Service chính =====

class ReviewService {
  // Query: getReviews
  async getReviews(params: GetReviewsParams): Promise<PaginatedReviews> {
    const query = `
      query GetReviews(
        $page: Int
        $limit: Int
        $movieId: String
        $rating: Float
        $userId: String
        $type: String
        $status: String
        $isActive: Boolean
      ) {
        getReviews(
          page: $page
          limit: $limit
          movieId: $movieId
          rating: $rating
          userId: $userId
          type: $type
          status: $status
          isActive: $isActive
        ) {
          pagination {
            totalItems
            totalPages
            currentPage
            pageSize
            hasNextPage
            hasPrevPage
          }
          data {
            id
            userId
            movieId
            rating
            content
            status
            isActive
            type
            createdAt
            updatedAt
            userDetail {
              fullname
              avatarUrl
            }
            response {
              userId
              content
              createdAt
            }
          }
        }
      }
    `;

    const data = await graphqlRequest<{ getReviews: PaginatedReviews }>(
      query,
      params
    );

    return data.getReviews;
  }

  // Query: getReviewById
  async getReviewById(reviewId: string): Promise<Review> {
    const query = `
      query GetReviewById($reviewId: String!) {
        getReviewById(reviewId: $reviewId) {
          id
          userId
          movieId
          rating
          content
          status
          isActive
          type
          createdAt
          updatedAt
          userDetail {
            fullname
            avatarUrl
          }
          response {
            userId
            content
            createdAt
          }
        }
      }
    `;

    const data = await graphqlRequest<{ getReviewById: Review }>(query, {
      reviewId,
    });

    return data.getReviewById;
  }

  // Query: getReviewOverview
  async getReviewOverview(movieId: string): Promise<ReviewOverview> {
    const query = `
      query GetReviewOverview($movieId: String!) {
        getReviewOverview(movieId: $movieId) {
          averageRating
          totalReviews
          ratingDistribution
        }
      }
    `;

    const data = await graphqlRequest<{ getReviewOverview: ReviewOverview }>(
      query,
      { movieId }
    );

    return data.getReviewOverview;
  }

  // Mutation: createReview
  async createReview(input: CreateReviewInput): Promise<Review> {
    const query = `
      mutation CreateReview(
        $movieId: String!
        $rating: Float!
        $content: String
      ) {
        createReview(
          movieId: $movieId
          rating: $rating
          content: $content
        ) {
          id
          userId
          movieId
          rating
          content
          status
          isActive
          type
          createdAt
          updatedAt
          userDetail {
            fullname
            avatarUrl
          }
          response {
            userId
            content
            createdAt
          }
        }
      }
    `;

    const data = await graphqlRequest<{ createReview: Review }>(query, input);
    return data.createReview;
  }

  // Mutation: replyToReview
  async replyToReview(input: ReplyToReviewInput): Promise<Review> {
    const query = `
      mutation ReplyToReview(
        $reviewId: String!
        $content: String!
      ) {
        replyToReview(
          reviewId: $reviewId
          content: $content
        ) {
          id
          userId
          movieId
          rating
          content
          status
          isActive
          type
          createdAt
          updatedAt
          userDetail {
            fullname
            avatarUrl
          }
          response {
            userId
            content
            createdAt
          }
        }
      }
    `;

    const data = await graphqlRequest<{ replyToReview: Review }>(query, input);
    return data.replyToReview;
  }

  // Mutation: updateReviewById
  async updateReview(input: UpdateReviewInput): Promise<Review> {
    const query = `
      mutation UpdateReviewById(
        $reviewId: String!
        $content: String
        $rating: Float
      ) {
        updateReviewById(
          reviewId: $reviewId
          content: $content
          rating: $rating
        ) {
          id
          userId
          movieId
          rating
          content
          status
          isActive
          type
          createdAt
          updatedAt
          userDetail {
            fullname
            avatarUrl
          }
          response {
            userId
            content
            createdAt
          }
        }
      }
    `;

    const data = await graphqlRequest<{ updateReviewById: Review }>(
      query,
      input
    );
    return data.updateReviewById;
  }

  // Mutation: hideReviewById
  async hideReview(reviewId: string): Promise<Review> {
    const query = `
      mutation HideReviewById($reviewId: String!) {
        hideReviewById(reviewId: $reviewId) {
          id
          userId
          movieId
          rating
          content
          status
          isActive
          type
          createdAt
          updatedAt
          userDetail {
            fullname
            avatarUrl
          }
          response {
            userId
            content
            createdAt
          }
        }
      }
    `;

    const data = await graphqlRequest<{ hideReviewById: Review }>(query, {
      reviewId,
    });
    return data.hideReviewById;
  }

  // Mutation: unhideReviewById
  async unhideReview(reviewId: string): Promise<Review> {
    const query = `
      mutation UnhideReviewById($reviewId: String!) {
        unhideReviewById(reviewId: $reviewId) {
          id
          userId
          movieId
          rating
          content
          status
          isActive
          type
          createdAt
          updatedAt
          userDetail {
            fullname
            avatarUrl
          }
          response {
            userId
            content
            createdAt
          }
        }
      }
    `;

    const data = await graphqlRequest<{ unhideReviewById: Review }>(query, {
      reviewId,
    });
    return data.unhideReviewById;
  }
}

export const reviewService = new ReviewService();
