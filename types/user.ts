export type User = {
  id: string;
  email: string;
  password: string;
  fullname: string;
  gender: string;
  role: Role;
  avatarUrl: string;
  publicId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  refreshTokens: RefreshToken[];
  VerificationToken: VerificationToken[];
  OTP: OTP[];
};

export enum Role {
  "USER",
  "ADMIN",
}

export type RefreshToken = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user: User;
};

export type VerificationToken = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user: User;
};

export type OTP = {
  id: string;
  userId: string;
  otp: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user: User;
};
