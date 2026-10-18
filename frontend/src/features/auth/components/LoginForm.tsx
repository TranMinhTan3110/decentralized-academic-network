import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleButton } from './GoogleButton';
import { authService, type UserDto } from '../../../services/authService';
import { useAuth } from '../../../lib/authStore';

declare global {
    interface Window {
        google?: any;
    }
}

export interface LoginFormProps {
    onLoginSuccess?: (data: { email: string; rememberMe: boolean; user?: UserDto }) => void;
    onGoogleLogin?: () => void;
    isSubmitting?: boolean;
}

export function LoginForm({ onLoginSuccess, onGoogleLogin, isSubmitting = false }: LoginFormProps) {
    const auth = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);
    const [isGoogleSdkReady, setIsGoogleSdkReady] = useState(false);
    const googleBtnRef = useRef<HTMLDivElement>(null);

    const isBusy = isSubmitting || isLocalSubmitting || isGoogleLoading;

    // Khởi tạo trạng thái Ghi nhớ đăng nhập từ localStorage
    useEffect(() => {
        try {
            const savedEmail = localStorage.getItem('dan_remembered_email');
            if (savedEmail) {
                setEmail(savedEmail);
                setRememberMe(true);
            }
        } catch {
            // ignore localStorage errors
        }
    }, []);

    // Khởi tạo Google Identity Services
    useEffect(() => {
        const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!googleClientId || googleClientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
            return;
        }

        const setupGoogle = () => {
            if (window.google?.accounts?.id) {
                window.google.accounts.id.initialize({
                    client_id: googleClientId,
                    callback: async (response: { credential?: string }) => {
                        if (!response?.credential) {
                            toast.error('Không nhận được mã xác thực từ Google');
                            return;
                        }
                        setIsGoogleLoading(true);
                        try {
                            const authData = await authService.loginWithGoogle(response.credential);
                            auth.login(authData);
                            toast.success(`Đăng nhập Google thành công! Chào mừng ${authData.user.fullName || authData.user.email}!`);
                            if (onLoginSuccess) {
                                onLoginSuccess({ email: authData.user.email, rememberMe: true, user: authData.user });
                            }
                        } catch (err: any) {
                            toast.error(err.message || 'Xác thực Google thất bại');
                        } finally {
                            setIsGoogleLoading(false);
                        }
                    },
                    auto_select: false,
                    cancel_on_tap_outside: true,
                });

                if (googleBtnRef.current) {
                    googleBtnRef.current.innerHTML = '';
                    window.google.accounts.id.renderButton(googleBtnRef.current, {
                        theme: 'outline',
                        size: 'large',
                        width: 376,
                        text: 'continue_with',
                        shape: 'rectangular',
                        logo_alignment: 'left',
                    });
                    setIsGoogleSdkReady(true);
                }
            }
        };

        if (window.google?.accounts?.id) {
            setupGoogle();
        } else {
            const checkTimer = setInterval(() => {
                if (window.google?.accounts?.id) {
                    clearInterval(checkTimer);
                    setupGoogle();
                }
            }, 300);
            return () => clearInterval(checkTimer);
        }
    }, [onLoginSuccess]);

    const validateEmail = (val: string) => {
        if (!val.trim()) {
            return 'Vui lòng nhập email của bạn';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
            return 'Địa chỉ email không hợp lệ (ví dụ: name@domain.com)';
        }
        return '';
    };

    const validatePassword = (val: string) => {
        if (!val) {
            return 'Vui lòng nhập mật khẩu';
        }
        if (val.length < 6) {
            return 'Mật khẩu phải chứa ít nhất 6 ký tự';
        }
        return '';
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (emailError) setEmailError('');
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (passwordError) setPasswordError('');
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const errEmail = validateEmail(email);
        const errPass = validatePassword(password);

        if (errEmail || errPass) {
            setEmailError(errEmail);
            setPasswordError(errPass);
            toast.error(errEmail || errPass || 'Vui lòng kiểm tra lại thông tin nhập!');
            return;
        }

        setIsLocalSubmitting(true);
        try {
            const authData = await authService.login({ email, password });
            auth.login(authData);

            // Xử lý ghi nhớ đăng nhập
            try {
                if (rememberMe) {
                    localStorage.setItem('dan_remembered_email', email.trim().toLowerCase());
                } else {
                    localStorage.removeItem('dan_remembered_email');
                }
            } catch {
                // ignore localStorage errors
            }

            toast.success(`Đăng nhập thành công! Chào mừng ${authData.user.fullName || authData.user.email}!`);
            if (onLoginSuccess) {
                onLoginSuccess({ email: authData.user.email, rememberMe, user: authData.user });
            }
        } catch (err: any) {
            toast.error(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu!');
        } finally {
            setIsLocalSubmitting(false);
        }
    };

    const handleGoogleClick = () => {
        if (onGoogleLogin) {
            onGoogleLogin();
        }
        if (window.google?.accounts?.id) {
            window.google.accounts.id.prompt();
        } else {
            toast.info('Đang nạp kết nối Google, vui lòng thử lại sau giây lát!');
        }
    };

    return (
        <div className="w-full max-w-[440px] mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-[#d8deea] shadow-lg">
            <div className="text-center mb-5">
                <h1 className="text-2xl font-bold text-[#121827] tracking-tight">Đăng nhập tài khoản</h1>
            </div>

            <form onSubmit={handleSubmit} noValidate autoComplete="off" className="space-y-4">
                {/* Email input */}
                <div>
                    <label htmlFor="login-email" className="block text-xs font-semibold text-[#121827] mb-1.5">
                        Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                        <Mail className="absolute left-3.5 text-[#5f6878] w-4 h-4 pointer-events-none" />
                        <input
                            id="login-email"
                            name="login_email"
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            onBlur={() => setEmailError(validateEmail(email))}
                            placeholder="name@example.com hoặc username"
                            disabled={isSubmitting}
                            className={`w-full h-11 pl-10 pr-3 bg-white border-2 border-[#d8deea] rounded-lg text-xs text-[#121827] placeholder:text-[#94a3b8] focus:border-[#315dff] focus:outline-none transition-colors ${
                                emailError ? '!border-[#b42318]' : ''
                            }`}
                            required
                            autoComplete="off"
                        />
                    </div>
                    {emailError && <p className="text-[11px] text-[#b42318] mt-1 font-medium">{emailError}</p>}
                </div>

                {/* Password input */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="login-password" className="block text-xs font-semibold text-[#121827]">
                            Mật khẩu <span className="text-rose-500">*</span>
                        </label>
                        <Link
                            to="/forgot-password"
                            className="text-[11px] font-semibold text-[#315dff] hover:underline"
                        >
                            Quên mật khẩu?
                        </Link>
                    </div>
                    <div className="relative flex items-center">
                        <Lock className="absolute left-3.5 text-[#5f6878] w-4 h-4 pointer-events-none" />
                        <input
                            id="login-password"
                            name="login_password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={handlePasswordChange}
                            onBlur={() => setPasswordError(validatePassword(password))}
                            placeholder="Nhập mật khẩu của bạn"
                            disabled={isSubmitting}
                            className={`w-full h-11 pl-10 pr-10 bg-white border-2 border-[#d8deea] rounded-lg text-xs text-[#121827] placeholder:text-[#94a3b8] focus:border-[#315dff] focus:outline-none transition-colors ${
                                passwordError ? '!border-[#b42318]' : ''
                            }`}
                            required
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            className="absolute right-3 p-1 text-[#5f6878] hover:text-[#121827] focus:outline-none"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {passwordError && <p className="text-[11px] text-[#b42318] mt-1 font-medium">{passwordError}</p>}
                </div>

                {/* Remember me option */}
                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-[#d8deea] text-[#315dff] focus:ring-[#315dff] cursor-pointer"
                        />
                        <span className="text-xs text-[#5f6878]">Ghi nhớ đăng nhập</span>
                    </label>
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full h-11 bg-[#315dff] hover:bg-[#1d42d8] text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                    {isBusy ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <span>Đăng nhập</span>
                    )}
                </button>
            </form>

            {/* Divider */}
            <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#d8deea]" />
                </div>
                <span className="relative bg-white px-3 text-[11px] text-[#5f6878] uppercase font-medium tracking-wider">
                    Hoặc tiếp tục với
                </span>
            </div>

            {/* Google login option */}
            <div className="w-full flex flex-col items-center justify-center">
                <div ref={googleBtnRef} className="w-full flex justify-center" />
                {!isGoogleSdkReady && (
                    <GoogleButton onClick={handleGoogleClick} isLoading={isGoogleLoading} disabled={isBusy} />
                )}
            </div>

            {/* Bottom link to register */}
            <p className="mt-6 text-center text-xs text-[#5f6878]">
                Chưa có tài khoản?{' '}
                <Link
                    to="/register"
                    className="font-semibold text-[#315dff] hover:underline"
                >
                    Đăng ký ngay
                </Link>
            </p>
        </div>
    );
}
