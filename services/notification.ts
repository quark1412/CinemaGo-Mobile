import axiosConfig from "@/configs/axiosConfig";

export interface SendEmailRequest {
  to: string;
  subject: string;
  html: string;
}

export const notificationService = {
  sendEmail: async (data: SendEmailRequest) => {
    try {
      const response = await axiosConfig.post(
        "/notifications/public/send-email",
        data,
        {
          requiresAuth: true,
        } as any
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Failed to send email notification"
      );
    }
  },
};
