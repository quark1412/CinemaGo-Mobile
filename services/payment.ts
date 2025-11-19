import axiosConfig from "@/configs/axiosConfig";

export interface Payment {
  id: string;
  userId: string;
  bookingId: string;
  amount: number;
  method: "MOMO" | "VNPAY" | "ZALOPAY";
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: string;
  updatedAt: string;
}

export interface PaymentResponse {
  URL: string;
}

export const paymentService = {
  // Checkout with MoMo
  checkoutWithMoMo: async (
    amount: number,
    bookingId: string
  ): Promise<PaymentResponse> => {
    try {
      const response = await axiosConfig.post(`/payments/momo/checkout`, {
        amount,
        bookingId,
      });

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to checkout with MoMo"
      );
    }
  },

  // Checkout with VnPay
  checkoutWithVnPay: async (
    amount: number,
    bookingId: string
  ): Promise<PaymentResponse> => {
    try {
      const response = await axiosConfig.post(`/payments/vnpay/checkout`, {
        amount,
        bookingId,
      });

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to checkout with VnPay"
      );
    }
  },

  // Checkout with ZaloPay
  checkoutWithZaloPay: async (
    amount: number,
    bookingId: string
  ): Promise<PaymentResponse> => {
    try {
      const response = await axiosConfig.post(`/payments/zalopay/checkout`, {
        amount,
        bookingId,
      });

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to checkout with ZaloPay"
      );
    }
  },

  // Check payment status (MoMo)
  checkMoMoStatus: async (paymentId: string): Promise<Payment> => {
    try {
      const response = await axiosConfig.get(
        `/payments/public/momo/status/${paymentId}`
      );

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to check payment status"
      );
    }
  },

  // Get payment by ID
  getPaymentById: async (paymentId: string): Promise<Payment> => {
    try {
      const response = await axiosConfig.get(`/payments/${paymentId}`);

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch payment"
      );
    }
  },
};
