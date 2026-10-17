// ==============================================================================
// ACCOUNT AUTH SERVICE - DECENTRALIZED ACADEMIC NETWORK
// Handles Register, OTP Verification, and Forgot/Reset Password API Calls
// ==============================================================================

import type { AuthResponse } from '../../../services/authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

export interface RegisterPayload {
  fullName: string;
  username: string;
  email: string;
  password: string;
  major?: string;
}

export interface VerifyOtpPayload {
  email: string;
  code: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

class AccountAuthService {
  /**
   * Đăng ký tài khoản người dùng mới
   */
  async register(payload: RegisterPayload): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: ApiResponse = await response.json().catch(() => ({
      success: false,
      message: 'Không thể kết nối đến máy chủ',
      data: null,
    }));

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Đăng ký không thành công. Vui lòng thử lại!');
    }

    return data;
  }

  /**
   * Xác thực mã OTP 6 số để kích hoạt tài khoản và nhận phiên đăng nhập
   */
  async verifyOtp(payload: VerifyOtpPayload): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: ApiResponse<AuthResponse> = await response.json().catch(() => ({
      success: false,
      message: 'Không thể kết nối đến máy chủ',
      data: null as any,
    }));

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Mã OTP không chính xác hoặc đã hết hạn!');
    }

    return data;
  }

  /**
   * Yêu cầu gửi mã OTP đặt lại mật khẩu qua email
   */
  async forgotPassword(email: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data: ApiResponse = await response.json().catch(() => ({
      success: false,
      message: 'Không thể kết nối đến máy chủ',
      data: null,
    }));

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Không thể gửi mã xác thực đến email này!');
    }

    return data;
  }

  /**
   * Đặt lại mật khẩu mới bằng OTP
   */
  async resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: ApiResponse = await response.json().catch(() => ({
      success: false,
      message: 'Không thể kết nối đến máy chủ',
      data: null,
    }));

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP!');
    }

    return data;
  }
}

export const accountAuthService = new AccountAuthService();
