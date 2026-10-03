import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../../features/auth';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    const handleLoginSuccess = async (data: { email: string; rememberMe: boolean }) => {
        setIsSubmitting(true);
        toast.success(`Đăng nhập thành công với ${data.email}!`, {
            description: 'Đang chuyển hướng đến trang Khám phá...',
        });
        setTimeout(() => {
            setIsSubmitting(false);
            navigate('/explore');
        }, 1200);
    };

    const handleGoogleLogin = async () => {
        // Simulating OAuth Google Login sequence
        await new Promise((resolve) => setTimeout(resolve, 600));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#edf2fc] to-[#eaf0ff] flex flex-col justify-between p-4 sm:p-6 relative">
            <h1 className="sr-only">LoginPage</h1>

            {/* Top action bar: Back button */}
            <div className="w-full max-w-6xl mx-auto flex items-center justify-between py-2">
                <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/80 hover:bg-white text-[#121827] text-xs font-semibold rounded-lg border border-[#d8deea] shadow-xs hover:shadow-md transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#315dff]"
                >
                    <ArrowLeft className="w-4 h-4 text-[#315dff]" />
                    <span>Quay lại</span>
                </button>
            </div>

            {/* Main content centered */}
            <div className="flex-1 flex items-center justify-center py-8">
                <div className="w-full max-w-md">
                    <LoginForm
                        onLoginSuccess={handleLoginSuccess}
                        onGoogleLogin={handleGoogleLogin}
                        isSubmitting={isSubmitting}
                    />
                </div>
            </div>

            {/* Footer copyright note */}
            <footer className="text-center text-[11px] text-[#5f6878] py-2">
                © {new Date().getFullYear()} Decentralized Academic Network. Tất cả các quyền được bảo lưu.
            </footer>
        </div>
    );
}
