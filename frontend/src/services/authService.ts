// ==============================================================================
// AUTH SERVICE - DECENTRALIZED ACADEMIC NETWORK (DEDOCU)
// Handles API calls to User Service Backend (Port 8081) & JWT Session Storage
// ==============================================================================

export interface LoginRequest {
  email?: string;
  username?: string;
  password?: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface UserDto {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: 'USER' | 'VIP' | 'ADMIN' | string;
  avatarUrl?: string;
  avatarText?: string;
  major?: string;
  uploadPointsBalance?: number;
  reputationPoints?: number;
  isVerified?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: UserDto;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

// Ưu tiên gateway khi cấu hình; ngược lại gọi thẳng user-service (dev)
const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

const ACCESS_TOKEN_KEY = 'accessToken';
const CURRENT_USER_KEY = 'currentUser';

class AuthService {
  /**
   * Đăng nhập thường qua Email / Username & Mật khẩu
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data: ApiResponse<AuthResponse> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Đăng nhập không thành công');
    }

    this.setSession(data.data);
    return data.data;
  }

  /**
   * Đăng nhập nhanh qua Google OAuth2 (Google Identity Services idToken)
   */
  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    const data: ApiResponse<AuthResponse> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Xác thực Google không thành công');
    }

    this.setSession(data.data);
    return data.data;
  }

  /**
   * Lưu Token và thông tin User vào trình duyệt
   */
  setSession(authData: AuthResponse): void {
    if (authData?.accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, authData.accessToken);
    }
    if (authData?.user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(authData.user));
    }
  }

  /**
   * Đăng xuất và xóa phiên đăng nhập
   */
  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  /**
   * Lấy Access Token hiện tại
   */
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  /**
   * Lấy thông tin User hiện tại
   */
  getCurrentUser(): UserDto | null {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as UserDto;
    } catch {
      return null;
    }
  }

  /**
   * Kiểm tra người dùng đã đăng nhập chưa
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Kiểm tra người dùng có quyền Quản trị viên (ADMIN) không
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN';
  }
}

export const authService = new AuthService();
