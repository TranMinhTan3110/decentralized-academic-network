import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { accountAuthService } from '../services/accountAuthService';

export interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  isSubmitting?: boolean;
}

export function ForgotPasswordForm({ onSuccess, isSubmitting = false }: ForgotPasswordFormProps) {
  const navigate = useNavigate();

  // Current Step: 1 = Enter Email, 2 = Enter OTP & New Password
  const [step, setStep] = useState<1 | 2>(1);

  // Form fields
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field errors
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Submitting states
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);
  const isBusy = isSubmitting || isLocalSubmitting;

  // Validation
  const validateEmail = (val: string) => {
    if (!val.trim()) return 'Vui lòng nhập địa chỉ email của bạn';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) return 'Địa chỉ email không đúng định dạng';
    return '';
  };

  const validateOtp = (val: string) => {
    if (!val.trim()) return 'Vui lòng nhập mã OTP';
    if (!/^[0-9]{6}$/.test(val.trim())) return 'Mã OTP phải gồm 6 chữ số';
    return '';
  };

  const validateNewPassword = (val: string) => {
    if (!val) return 'Vui lòng nhập mật khẩu mới';
    if (val.length < 6) return 'Mật khẩu mới phải có ít nhất 6 ký tự';
    return '';
  };

  const validateConfirmPassword = (val: string, currentNewPass: string) => {
    if (!val) return 'Vui lòng xác nhận mật khẩu mới';
    if (val !== currentNewPass) return 'Mật khẩu xác nhận không trùng khớp';
    return '';
  };

  // Step 1: Submit email to request OTP
  const handleStep1Submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    setIsLocalSubmitting(true);
    try {
      await accountAuthService.forgotPassword(email.trim().toLowerCase());
      toast.success('Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn!');
      setStep(2);
    } catch (error: any) {
      toast.error(error.message || 'Không thể gửi mã xác nhận. Vui lòng kiểm tra lại email!');
    } finally {
      setIsLocalSubmitting(false);
    }
  };

  // Step 2: Submit OTP and new password
  const handleStep2Submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errOtp = validateOtp(otp);
    const errPass = validateNewPassword(newPassword);
    const errConfirm = validateConfirmPassword(confirmPassword, newPassword);

    setOtpError(errOtp);
    setNewPasswordError(errPass);
    setConfirmPasswordError(errConfirm);

    if (errOtp || errPass || errConfirm) {
      toast.error('Vui lòng kiểm tra lại thông tin!');
      return;
    }

    setIsLocalSubmitting(true);
    try {
      await accountAuthService.resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });

      toast.success('Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.');
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/login');
      }
    } catch (error: any) {
      toast.error(error.message || 'Đổi mật khẩu thất bại. Mã OTP không hợp lệ hoặc đã hết hạn!');
    } finally {
      setIsLocalSubmitting(false);
    }
  };

  // Resend OTP in Step 2
  const handleResendOtp = async () => {
    if (isBusy) return;
    setIsLocalSubmitting(true);
    try {
      await accountAuthService.forgotPassword(email.trim().toLowerCase());
      toast.success('Mã OTP mới đã được gửi lại vào email của bạn!');
    } catch (error: any) {
      toast.error(error.message || 'Không thể gửi lại mã OTP lúc này!');
    } finally {
      setIsLocalSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[460px] mx-auto bg-white px-3.5 py-5 sm:p-8 rounded-xl sm:rounded-2xl border border-[#d8deea] shadow-lg">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 mx-auto mb-4 bg-[#eff4ff] text-[#315dff] rounded-2xl flex items-center justify-center border border-[#d8deea] shadow-xs">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-[#121827] tracking-tight">Quên mật khẩu</h1>
        <p className="text-xs text-[#5f6878] mt-1.5">
          {step === 1
            ? 'Nhập địa chỉ email đăng ký để nhận mã OTP khôi phục mật khẩu'
            : 'Nhập mã xác thực OTP và thiết lập mật khẩu mới cho tài khoản'}
        </p>
      </div>

      {/* Stepper indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            step === 1 ? 'bg-[#315dff] text-white' : 'bg-[#eaf0ff] text-[#315dff]'
          }`}
        >
          <span>1. Gửi mã</span>
        </div>
        <div className="w-6 h-[2px] bg-[#d8deea]" />
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            step === 2 ? 'bg-[#315dff] text-white' : 'bg-[#f1f5f9] text-[#94a3b8]'
          }`}
        >
          <span>2. Đổi mật khẩu</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BƯỚC 1: Ô nhập Email + Nút "Gửi mã"                                      */}
      {/* ========================================================================= */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} noValidate className="space-y-4">
          <div>
            <label htmlFor="forgot-email" className="block text-xs font-semibold text-[#121827] mb-1.5">
              Email tài khoản <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 text-[#5f6878] w-4 h-4 pointer-events-none" />
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                onBlur={() => setEmailError(validateEmail(email))}
                placeholder="student@university.edu.vn"
                disabled={isBusy}
                className={`w-full h-11 pl-10 pr-3 bg-white border-2 border-[#d8deea] rounded-lg text-xs text-[#121827] placeholder:text-[#94a3b8] focus:border-[#315dff] focus:outline-none transition-colors ${
                  emailError ? '!border-[#b42318]' : ''
                }`}
                required
                autoComplete="email"
              />
            </div>
            {emailError && <p className="text-[11px] text-[#b42318] mt-1 font-medium">{emailError}</p>}
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="w-full h-11 bg-[#315dff] hover:bg-[#1d42d8] text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isBusy ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Gửi mã</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* BƯỚC 2: Ô nhập OTP + Mật khẩu mới + Xác nhận mật khẩu mới + Nút "Đổi mật khẩu" */}
      {/* ========================================================================= */}
      {step === 2 && (
        <form onSubmit={handleStep2Submit} noValidate className="space-y-4">
          {/* Target email badge */}
          <div className="p-3 bg-[#f8fafc] border border-[#d8deea] rounded-xl flex items-center justify-between text-xs">
            <div className="truncate mr-2">
              <span className="text-[#5f6878]">Email nhận mã: </span>
              <span className="font-semibold text-[#121827]">{email}</span>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[11px] font-semibold text-[#315dff] hover:underline shrink-0 cursor-pointer"
            >
              Thay đổi
            </button>
          </div>

          {/* Ô nhập OTP */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="reset-otp" className="block text-xs font-semibold text-[#121827]">
                Mã OTP (6 chữ số) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isBusy}
                className="text-[11px] font-semibold text-[#315dff] hover:underline cursor-pointer disabled:opacity-50"
              >
                Gửi lại mã
              </button>
            </div>
            <div className="relative flex items-center">
              <ShieldAlert className="absolute left-3.5 text-[#5f6878] w-4 h-4 pointer-events-none" />
              <input
                id="reset-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setOtp(val);
                  if (otpError) setOtpError('');
                }}
                onBlur={() => setOtpError(validateOtp(otp))}
                placeholder="123456"
                disabled={isBusy}
                className={`w-full h-11 pl-10 pr-3 bg-white border-2 border-[#d8deea] rounded-lg text-xs font-mono tracking-widest text-[#121827] placeholder:text-[#94a3b8] focus:border-[#315dff] focus:outline-none transition-colors ${
                  otpError ? '!border-[#b42318]' : ''
                }`}
                required
              />
            </div>
            {otpError && <p className="text-[11px] text-[#b42318] mt-1 font-medium">{otpError}</p>}
          </div>

          {/* Mật khẩu mới */}
          <div>
            <label htmlFor="reset-new-password" className="block text-xs font-semibold text-[#121827] mb-1.5">
              Mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 text-[#5f6878] w-4 h-4 pointer-events-none" />
              <input
                id="reset-new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (newPasswordError) setNewPasswordError('');
                  if (confirmPassword && confirmPasswordError) {
                    setConfirmPasswordError(validateConfirmPassword(confirmPassword, e.target.value));
                  }
                }}
                onBlur={() => setNewPasswordError(validateNewPassword(newPassword))}
                placeholder="Tối thiểu 6 ký tự"
                disabled={isBusy}
                className={`w-full h-11 pl-10 pr-10 bg-white border-2 border-[#d8deea] rounded-lg text-xs text-[#121827] placeholder:text-[#94a3b8] focus:border-[#315dff] focus:outline-none transition-colors ${
                  newPasswordError ? '!border-[#b42318]' : ''
                }`}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3 p-1 text-[#5f6878] hover:text-[#121827] focus:outline-none cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPasswordError && <p className="text-[11px] text-[#b42318] mt-1 font-medium">{newPasswordError}</p>}
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div>
            <label htmlFor="reset-confirm-password" className="block text-xs font-semibold text-[#121827] mb-1.5">
              Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 text-[#5f6878] w-4 h-4 pointer-events-none" />
              <input
                id="reset-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) setConfirmPasswordError('');
                }}
                onBlur={() => setConfirmPasswordError(validateConfirmPassword(confirmPassword, newPassword))}
                placeholder="Nhập lại mật khẩu mới"
                disabled={isBusy}
                className={`w-full h-11 pl-10 pr-10 bg-white border-2 border-[#d8deea] rounded-lg text-xs text-[#121827] placeholder:text-[#94a3b8] focus:border-[#315dff] focus:outline-none transition-colors ${
                  confirmPasswordError ? '!border-[#b42318]' : ''
                }`}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3 p-1 text-[#5f6878] hover:text-[#121827] focus:outline-none cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="text-[11px] text-[#b42318] mt-1 font-medium">{confirmPasswordError}</p>
            )}
          </div>

          {/* Nút bấm Đổi mật khẩu */}
          <button
            type="submit"
            disabled={isBusy}
            className="w-full h-11 bg-[#315dff] hover:bg-[#1d42d8] text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-3"
          >
            {isBusy ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Đổi mật khẩu</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Quay lại Đăng nhập */}
      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5f6878] hover:text-[#315dff] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại Đăng nhập</span>
        </Link>
      </div>
    </div>
  );
}
