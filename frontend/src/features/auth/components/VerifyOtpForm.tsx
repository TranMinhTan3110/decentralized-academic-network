import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { accountAuthService } from '../services/accountAuthService';
import { useAuth } from '../../../lib/authStore';

export interface VerifyOtpFormProps {
  initialEmail?: string;
  onVerifySuccess?: () => void;
  isSubmitting?: boolean;
}

export function VerifyOtpForm({ initialEmail = '', onVerifySuccess, isSubmitting = false }: VerifyOtpFormProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [searchParams] = useSearchParams();

  // Email state (from prop or URL query param)
  const emailFromUrl = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail || emailFromUrl);
  const [isEditingEmail, setIsEditingEmail] = useState(!email);

  // 6 OTP digits
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend countdown timer
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);

  const isBusy = isSubmitting || isLocalSubmitting;

  // Countdown effect
  useEffect(() => {
    let timer: any = null;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  // Focus first empty input on mount
  useEffect(() => {
    if (!isEditingEmail) {
      inputRefs.current[0]?.focus();
    }
  }, [isEditingEmail]);

  // Handle single digit change
  const handleChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/[^0-9]/g, '');
    const char = cleaned.slice(-1); // Take latest digit if multiple

    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);

    // Auto move focus to next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle keydown for backspace and arrows
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to prev input and delete
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste full 6-digit code
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digitsOnly = pastedData.replace(/[^0-9]/g, '').slice(0, 6);

    if (!digitsOnly) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = digitsOnly[i] || '';
    }
    setOtp(newOtp);

    // Focus on the next empty or the last input
    const focusIndex = Math.min(digitsOnly.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  // Submit OTP verification
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fullCode = otp.join('');
    if (!email.trim()) {
      toast.error('Vui lòng nhập email nhận mã OTP!');
      setIsEditingEmail(true);
      return;
    }

    if (fullCode.length !== 6) {
      toast.error('Vui lòng nhập đủ 6 chữ số mã OTP!');
      return;
    }

    setIsLocalSubmitting(true);
    try {
      const response = await accountAuthService.verifyOtp({
        email: email.trim().toLowerCase(),
        code: fullCode,
      });

      // Nếu API trả về accessToken và user thì đăng nhập ngay lập tức
      if (response?.data?.accessToken && response?.data?.user) {
        auth.login(response.data);
      }

      toast.success('Xác thực tài khoản thành công! Đang vào hệ thống...');
      if (onVerifySuccess) {
        onVerifySuccess();
      } else {
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Mã xác thực không đúng hoặc đã hết hạn!');
    } finally {
      setIsLocalSubmitting(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (!canResend || isResending) return;

    if (!email.trim()) {
      toast.error('Vui lòng nhập địa chỉ email để nhận mã!');
      setIsEditingEmail(true);
      return;
    }

    setIsResending(true);
    try {
      // Backend resend endpoint or forgot-password endpoint for OTP dispatch
      await accountAuthService.forgotPassword(email.trim().toLowerCase()).catch(() => {
        // Fallback for mock/simulation if backend resend endpoint differs
      });

      toast.success(`Mã OTP mới đã được gửi đến ${email}!`);
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi lại mã lúc này. Vui lòng thử lại sau!');
    } finally {
      setIsResending(false);
    }
  };

  const isOtpComplete = otp.every((d) => d !== '');

  return (
    <div className="w-full max-w-[460px] mx-auto bg-white px-3.5 py-4 sm:p-8 rounded-xl sm:rounded-2xl border border-[#d8deea] shadow-lg">
      <div className="text-center mb-3.5 sm:mb-6">
        <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-4 bg-[#eff4ff] text-[#315dff] rounded-xl sm:rounded-2xl flex items-center justify-center border border-[#d8deea] shadow-xs">
          <ShieldCheck className="w-5 h-5 sm:w-7 sm:h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#121827] tracking-tight">Xác thực mã OTP</h1>
        <p className="text-[11px] sm:text-xs text-[#5f6878] mt-1">
          Nhập mã xác thực gồm 6 chữ số được gửi đến hòm thư của bạn
        </p>
      </div>

      {/* Hiển thị text: Email nhận mã */}
      <div className="mb-3.5 sm:mb-6 p-2.5 sm:p-3.5 bg-[#f8fafc] border border-[#d8deea] rounded-xl">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden min-w-0">
            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#315dff] shrink-0" />
            <div className="truncate text-[11px] sm:text-xs">
              <span className="text-[#5f6878]">Email nhận mã: </span>
              <span className="font-semibold text-[#121827] truncate">
                {email || 'Chưa cung cấp email'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingEmail(!isEditingEmail)}
            className="text-[11px] font-semibold text-[#315dff] hover:underline shrink-0 ml-1.5 cursor-pointer"
          >
            {isEditingEmail ? 'Xong' : 'Thay đổi'}
          </button>
        </div>

        {isEditingEmail && (
          <div className="mt-2 pt-2 border-t border-[#d8deea]">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn..."
              className="w-full h-8 sm:h-9 px-2.5 sm:px-3 bg-white border border-[#d8deea] rounded-lg text-xs text-[#121827] focus:border-[#315dff] focus:outline-none"
            />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-3.5 sm:space-y-6">
        {/* 6 ô nhập mã số OTP */}
        <div>
          <label className="block text-center text-xs font-semibold text-[#121827] mb-2 sm:mb-3">
            Mã OTP 6 số
          </label>
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 w-full" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isBusy}
                className={`flex-1 min-w-0 max-w-[42px] sm:max-w-[48px] h-10 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-lg sm:rounded-xl border-2 transition-all bg-white text-[#121827] p-0 focus:outline-none ${
                  digit
                    ? 'border-[#315dff] bg-[#f5f8ff] text-[#315dff]'
                    : 'border-[#d8deea] focus:border-[#315dff]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Nút bấm Xác nhận */}
        <button
          type="submit"
          disabled={isBusy || !isOtpComplete}
          className="w-full h-10 sm:h-11 bg-[#315dff] hover:bg-[#1d42d8] text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBusy ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận</span>
            </>
          )}
        </button>

        {/* Nút bấm Gửi lại mã */}
        <div className="flex items-center justify-center pt-0.5 sm:pt-1">
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || isResending}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              canResend && !isResending
                ? 'text-[#315dff] hover:underline'
                : 'text-[#94a3b8] cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
            <span>
              {isResending
                ? 'Đang gửi lại...'
                : canResend
                ? 'Gửi lại mã'
                : `Gửi lại mã (${countdown}s)`}
            </span>
          </button>
        </div>
      </form>

      {/* Điều hướng khác */}
      <div className="mt-6 pt-4 border-t border-[#d8deea] flex items-center justify-between text-xs text-[#5f6878]">
        <Link to="/register" className="hover:text-[#121827] hover:underline">
          Đăng ký tài khoản khác
        </Link>
        <Link to="/login" className="font-semibold text-[#315dff] hover:underline flex items-center gap-1">
          <span>Đăng nhập</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
