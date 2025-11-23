export interface Cinema {
  id: string;
  name: string;
  city: string;
  address: string;
  longitude: number | null;
  latitude: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  brandLogo?: string;
}

export type CinemaPublic = Pick<
  Cinema,
  "id" | "name" | "city" | "address" | "longitude" | "latitude" | "isActive"
>;

export type CinemaParams = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
};

export type CreateCinemaRequest = Omit<
  Cinema,
  "id" | "createdAt" | "isActive" | "updatedAt"
>;
export type UpdateCinemaRequest = Partial<
  Omit<Cinema, "id" | "createdAt" | "updatedAt">
>;
