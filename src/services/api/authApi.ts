import { apiClient } from './client';

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Request password reset link/token to be sent to user's registered email
 */
export const requestPasswordResetApi = async (email: string): Promise<ForgotPasswordResponse> => {
  const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', {
    email: email.trim().toLowerCase(),
  });
  return response.data;
};

/**
 * Reset password using the verification token sent to email
 */
export const resetPasswordApi = async (data: {
  token: string;
  password: string;
  confirmPassword?: string;
}): Promise<ResetPasswordResponse> => {
  const response = await apiClient.post<ResetPasswordResponse>('/auth/reset-password', {
    token: data.token.trim(),
    password: data.password,
    confirmPassword: data.confirmPassword || data.password,
  });
  return response.data;
};
