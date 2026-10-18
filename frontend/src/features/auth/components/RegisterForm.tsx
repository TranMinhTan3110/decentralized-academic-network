import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, AtSign, Mail, Lock, Eye, EyeOff, GraduationCap, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { accountAuthService } from '../services/accountAuthService';

export interface RegisterFormProps {
  onRegisterSuccess?: (email: string) => void;
  isSubmitting?: boolean;
}

const COMMON_MAJORS = [
  'Khoa học máy tính',
  'Kỹ thuật phần mềm',
  'Công nghệ thông tin',
  'Hệ thống thông tin',
  'An toàn thông tin',
  'Trí tuệ nhân tạo & Khoa học dữ liệu',
  'Kỹ thuật máy tính',
  'Kinh tế số & Thương mại điện tử',
];

export function RegisterForm({ onRegisterSuccess, isSubmitting = false }: RegisterFormProps) {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [major, setMajor] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Error states
  const [fullNameError, setFullNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [majorError, setMajorError] = useState('');

  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);
  const isBusy = isSubmitting || isLocalSubmitting;

  const validateFullName = (val: string) => {
    if (!val.trim()) return 'Vui lòng nhập họ và tên của bạn';
    if (val.trim().length > 150) return 'Họ và tên tối đa 150 ký tự';
    return '';
  };

  const validateUsername = (val: string) => {
    if (!val.trim()) return 'Vui lòng nhập tên người dùng (username)';
    if (val.trim().length < 3 || val.trim().length > 50) return 'Username phải từ 3 đến 50 ký tự';
    if (!/^[a-zA-Z0-9_.-]+$/.test(val.trim())) return 'Username chỉ chứa chữ cái, số, dấu chấm hoặc gạch dưới';
    return '';
  };

  const validateEmail = (val: string) => {
    if (!val.trim()) return 'Vui lòng nhập địa chỉ email';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) return 'Địa chỉ email không đúng định dạng';
    return '';
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Vui lòng nhập mật khẩu';
    if (val.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
    return '';
  };

  const validateMajor = (val: string) => {
    if (!val.trim()) return 'Vui lòng chọn hoặc nhập chuyên ngành học';
    return '';
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errFullName = validateFullName(fullName);
    const errUsername = validateUsername(username);
    const errEmail = validateEmail(email);
    const errPassword = validatePassword(password);
    const errMajor = validateMajor(major);

    setFullNameError(errFullName);
    setUsernameError(errUsername);
    setEmailError(errEmail);
    setPasswordError(errPassword);
    setMajorError(errMajor);

    if (errFullName || errUsername || errEmail || errPassword || errMajor) {
      toast.error('Vui lòng kiểm tra lại thông tin đăng ký!');
      return;
    }

    setIsLocalSubmitting(true);
    try {
      await accountAuthService.register({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        major: major.trim(),
      });

      toast.success('Đăng ký tài khoản thành công! Vui lòng xác thực mã OTP gửi về email.');
      if (onRegisterSuccess) {
        onRegisterSuccess(email.trim().toLowerCase());
      } else {
        navigate(`/verify-otp?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Đăng ký tài khoản thất bại. Vui lòng thử lại!');
    } finally {
      setIsLocalSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] mx-auto bg-white px-3.5 py-5 sm:p-8 rounded-xl sm:rounded-2xl border border-[#d8deea] shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#121827] tracking-tight">Tạo tài khoản mới</h1>
        <p className="text-xs text-[#5f6878] mt-1.5">
          Tham gia Mạng lưới học thuật phi tập trung để chia sẻ và tiếp cận tài liệu chất lượng
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Họ tên */}
        <div>
          <label htmlFor="register-fullName" className="block text-xs font-semibold text-[#121827] mb-1.5">
            Họ tên <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 text-[#5f6878] w-4 h-4 pointer-events-none" />
            <input
              id="register-fullName"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fullNameError) setFullNameError('');
              }}
              onBlur={() => setFullNameError(validateFullName(fullName))}
              placeholder="VD: Nguyễn Văn A"
              disabled={isBusy}
              className={`w-full h-11 pl-10 pr-3 bg-white border-2 border-[#d8deea] rounded-lg text-xs text-[#121827] placeholder:text-[#94a3b8] focus:border-[#315dff] focus:outline-none transition-colors ${
                fullNameError ? '!border-[#b42318]' : ''
              }`}
              required
              autoComplete="name"
            />
          </div>
          {fullNameError && <p className="text-[11px] text-[#b42318] mt-1 font-medium">{fullNameError}</p>}
        </div>

        {/* Username */}
        <div>
          <label htmlFor="register-username" className="block text-xs font-semibold text-[#121827] mb-1.5">
            Username <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <AtSign className="absolute left-3.5 text-[#5f6878] w-4 h-4 pointer-events-none" />
            <input
              id="register-username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (usernameError) setUsernameError('');
              }}
              onBlur={() => setUsernameError(validateUsername(username))}
              placeholder="VD: nguyen_van_a"
              disabled={isBusy}
              className={`w-full h-11 pl-10 pr-3 bg-white border-2 border-[#d8deea] rounded-lg text-xs text-[#121827] placeholder:text-[#94a3b8] focus:border-[#315dff] focus:outline-none transition-colors ${
                usernameError ? '!border-[#b42318]' : ''
              }`}
              required
              autoComplete="username"
            />
          </div>
          {usernameError && <p className="text-[11px] text-[#b42318] mt-1 font-medium">{usernameError}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="register-email" className="block text-xs font-semibold text-[#121827] mb-1.5">
            Email <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 text-[#5f6878] w-4 h-4 pointer-events-none" />
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              onBlur={() => setEmailError(validateEmail(email))}
              placeholder="name@example.com"
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

        {/* Mật khẩu */}
        <div>
          <label htmlFor="register-password" className="block text-xs font-semibold text-[#121827] mb-1.5">
            Mật khẩu <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 text-[#5f6878] w-4 h-4 pointer-events-none" />
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              onBlur={() => setPasswordError(validatePassword(password))}
              placeholder="Tối thiểu 6 ký tự"
              disabled={isBusy}
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
              className="absolute right-3 p-1 text-[#5f6878] hover:text-[#121827] focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {passwordError && <p className="text-[11px] text-[#b42318] mt-1 font-medium">{passwordError}</p>}
        </div>

        {/* Chuyên ngành */}
        <div>
          <label htmlFor="register-major" className="block text-xs font-semibold text-[#121827] mb-1.5">
            Chuyên ngành <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <GraduationCap className="absolute left-3.5 text-[#5f6878] w-4 h-4 pointer-events-none" />
            <input
              id="register-major"
              type="text"
              list="majors-list"
              value={major}
              onChange={(e) => {
                setMajor(e.target.value);
                if (majorError) setMajorError('');
              }}
              onBlur={() => setMajorError(validateMajor(major))}
              placeholder="Chọn hoặc nhập chuyên ngành (VD: Kỹ thuật phần mềm)"
              disabled={isBusy}
              className={`w-full h-11 pl-10 pr-3 bg-white border-2 border-[#d8deea] rounded-lg text-xs text-[#121827] placeholder:text-[#94a3b8] focus:border-[#315dff] focus:outline-none transition-colors ${
                majorError ? '!border-[#b42318]' : ''
              }`}
              required
            />
            <datalist id="majors-list">
              {COMMON_MAJORS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
          {majorError && <p className="text-[11px] text-[#b42318] mt-1 font-medium">{majorError}</p>}
        </div>

        {/* Nút bấm Đăng ký */}
        <button
          type="submit"
          disabled={isBusy}
          className="w-full h-11 bg-[#315dff] hover:bg-[#1d42d8] text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-3"
        >
          {isBusy ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Đăng ký</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Chuyển hướng sang đăng nhập */}
      <p className="mt-6 text-center text-xs text-[#5f6878]">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-semibold text-[#315dff] hover:underline">
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
}
