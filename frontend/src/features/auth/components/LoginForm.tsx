import { useState, type FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleButton } from './GoogleButton';

export interface LoginFormProps {
    onLoginSuccess?: (data: { email: string; rememberMe: boolean }) => void;
    onGoogleLogin?: () => void;
    isSubmitting?: boolean;
}

export function LoginForm({ onLoginSuccess, onGoogleLogin, isSubmitting = false }: LoginFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

    const handleFillDemo = () => {
        const demoEmail = 'demo.student@university.edu.vn';
        setEmail(demoEmail);
        setPassword('123456');
        setEmailError('');
        setPasswordError('');
        toast.info('Đã tự động điền tài khoản Demo!', {
            description: 'Email: demo.student@university.edu.vn',
        });
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

        try {
            if (onLoginSuccess) {
                onLoginSuccess({ email, rememberMe });
            }
        } catch {
            toast.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!');
        }
    };

    const handleGoogleClick = async () => {
        setIsGoogleLoading(true);
        try {
            if (onGoogleLogin) {
                await onGoogleLogin();
            } else {
                // Mock Google login
                await new Promise((resolve) => setTimeout(resolve, 800));
            }
            toast.success('Đăng nhập thành công qua Google!');
            if (onLoginSuccess) {
                onLoginSuccess({ email: 'google.user@academic.net', rememberMe: true });
            }
        } catch {
            toast.error('Đăng nhập qua Google không thành công. Vui lòng thử lại!');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[440px] mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-[#d8deea] shadow-lg">
            <div className="text-center mb-5">
                <h1 className="text-2xl font-bold text-[#121827] tracking-tight">Đăng nhập tài khoản</h1>
            </div>

            {/* Demo hint banner */}
            <div className="mb-5 p-3.5 bg-[#f0f4ff] border border-[#c7d7fe] rounded-xl flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#1d42d8] font-medium">
                    <Sparkles className="w-4 h-4 text-[#315dff] shrink-0" />
                    <span>Dùng thử tài khoản Demo?</span>
                </div>
                <button
                    type="button"
                    onClick={handleFillDemo}
                    className="px-2.5 py-1 bg-[#315dff] hover:bg-[#1d42d8] text-white text-[11px] font-semibold rounded-md transition-all cursor-pointer shrink-0"
                >
                    Tự động điền
                </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Email input */}
                <div>
                    <label htmlFor="login-email" className="block text-xs font-semibold text-[#121827] mb-1.5">
                        Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                        <Mail className="absolute left-3.5 text-[#5f6878] w-4 h-4 pointer-events-none" />
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            onBlur={() => setEmailError(validateEmail(email))}
                            placeholder="demo.student@university.edu.vn"
                            disabled={isSubmitting}
                            className={`w-full h-11 pl-10 pr-3 bg-white border-2 border-[#d8deea] rounded-lg text-xs text-[#121827] placeholder:text-[#94a3b8] focus:border-[#315dff] focus:outline-none transition-colors ${
                                emailError ? '!border-[#b42318]' : ''
                            }`}
                            required
                            autoComplete="email"
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
                        <a
                            href="#forgot-password"
                            onClick={(e) => {
                                e.preventDefault();
                                toast.info('Hướng dẫn khôi phục mật khẩu đã được gửi đến email!');
                            }}
                            className="text-[11px] font-semibold text-[#315dff] hover:underline"
                        >
                            Quên mật khẩu?
                        </a>
                    </div>
                    <div className="relative flex items-center">
                        <Lock className="absolute left-3.5 text-[#5f6878] w-4 h-4 pointer-events-none" />
                        <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={handlePasswordChange}
                            onBlur={() => setPasswordError(validatePassword(password))}
                            placeholder="••••••••"
                            disabled={isSubmitting}
                            className={`w-full h-11 pl-10 pr-10 bg-white border-2 border-[#d8deea] rounded-lg text-xs text-[#121827] placeholder:text-[#94a3b8] focus:border-[#315dff] focus:outline-none transition-colors ${
                                passwordError ? '!border-[#b42318]' : ''
                            }`}
                            required
                            autoComplete="current-password"
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
                    disabled={isSubmitting}
                    className="w-full h-11 bg-[#315dff] hover:bg-[#1d42d8] text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                    {isSubmitting ? (
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
            <GoogleButton onClick={handleGoogleClick} isLoading={isGoogleLoading} disabled={isSubmitting} />

            {/* Bottom link to register */}
            <p className="mt-6 text-center text-xs text-[#5f6878]">
                Chưa có tài khoản?{' '}
                <a
                    href="#register"
                    onClick={(e) => {
                        e.preventDefault();
                        toast.info('Chức năng đăng ký tài khoản mới sắp ra mắt!');
                    }}
                    className="font-semibold text-[#315dff] hover:underline"
                >
                    Đăng ký ngay
                </a>
            </p>
        </div>
    );
}
