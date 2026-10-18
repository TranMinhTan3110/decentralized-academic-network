import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { VerifyOtpForm } from '../../features/auth';

export function VerifyOtpPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/login');
    }
  };

  const handleVerifySuccess = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between px-2 py-2 sm:p-6 relative overflow-y-auto">
      <h1 className="sr-only">Xác thực mã OTP</h1>

      {/* Top action bar: Back button */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between py-1 sm:py-2">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white/80 hover:bg-white text-[#121827] text-xs font-semibold rounded-lg border border-[#d8deea] shadow-xs hover:shadow-md transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#315dff]"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#315dff]" />
          <span>Quay lại</span>
        </button>
      </div>

      {/* Main content centered */}
      <div className="flex-1 flex items-center justify-center py-2 sm:py-8">
        <div className="w-full max-w-md">
          <VerifyOtpForm onVerifySuccess={handleVerifySuccess} />
        </div>
      </div>

      {/* Footer copyright note */}
      <footer className="text-center text-[10px] sm:text-[11px] text-[#5f6878] py-1 sm:py-2">
        © {new Date().getFullYear()} Decentralized Academic Network. Tất cả các quyền được bảo lưu.
      </footer>
    </div>
  );
}
