import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ForgotPasswordForm } from '../../features/auth';
import loginBg from '../../assets/login-bg.jpg';

export function ForgotPasswordPage() {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/login');
        }
    };

    const handleSuccess = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex flex-col overflow-x-hidden overflow-y-auto">
            <h1 className="sr-only">Quên mật khẩu</h1>

            {/* Background */}
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat scale-110 blur-[8px] brightness-[0.6] pointer-events-none"
                style={{ backgroundImage: `url(${loginBg})` }}
            />
            <div className="fixed inset-0 bg-gradient-to-br from-slate-950/65 via-slate-900/45 to-blue-950/55 pointer-events-none" />

            {/* Top bar */}
            <header className="relative z-10 w-full px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
                <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-semibold rounded-lg border border-white/20 shadow backdrop-blur-md transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#315dff]"
                >
                    <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>Quay lại</span>
                </button>
            </header>

            {/* Main — vertically centered, padded on all sides */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
                <div className="w-full max-w-md">
                    <ForgotPasswordForm onSuccess={handleSuccess} />
                </div>
            </main>
        </div>
    );
}
