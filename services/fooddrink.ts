import axiosConfig from "@/configs/axiosConfig";

export interface FoodDrink {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  type: "SNACK" | "DRINK" | "COMBO";
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FoodDrinksResponse {
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  data: FoodDrink[];
}

export const fooddrinkService = {
  // Get all food drinks (combos)
  getFoodDrinks: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isAvailable?: boolean;
  }): Promise<FoodDrinksResponse> => {
    try {
      const queryParams: any = {};
      if (params?.page) queryParams.page = params.page;
      if (params?.limit) queryParams.limit = params.limit;
      if (params?.search) queryParams.search = params.search;
      if (params?.isAvailable !== undefined)
        queryParams.isAvailable = params.isAvailable;

      const response = await axiosConfig.get(`/food-drinks/public`, {
        params: queryParams,
      });

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch food drinks"
      );
    }
  },

  // Get food drink by ID
  getFoodDrinkById: async (id: string): Promise<FoodDrink> => {
    try {
      const response = await axiosConfig.get(`/food-drinks/public/${id}`);

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch food drink"
      );
    }
  },

  // Get food drinks by IDs (for batch fetching)
  getFoodDrinksByIds: async (ids: string[]): Promise<FoodDrink[]> => {
    try {
      const response = await axiosConfig.post(`/food-drinks/public/by-ids`, {
        ids,
      });

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch food drinks"
      );
    }
  },
};
