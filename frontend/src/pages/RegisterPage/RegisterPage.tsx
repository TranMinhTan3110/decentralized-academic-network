import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, GraduationCap, FileText, Globe } from 'lucide-react';
import { RegisterForm } from '../../features/auth';
import loginBg from '../../assets/login-bg.jpg';

const REGISTER_FEATURES = [
    {
        icon: GraduationCap,
        title: 'Dành cho sinh viên & học giả',
        desc: 'Nơi kết nối mọi người học từ hàng trăm trường đại học trên cả nước.',
    },
    {
        icon: FileText,
        title: 'Kho tài liệu phong phú',
        desc: 'Hàng nghìn bài luận, giáo trình, đề thi được chia sẻ bởi cộng đồng.',
    },
    {
        icon: Globe,
        title: 'Phi tập trung & bền vững',
        desc: 'Dữ liệu được phân tán, không phụ thuộc một máy chủ trung tâm.',
    },
];

export function RegisterPage() {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    const handleRegisterSuccess = (email: string) => {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-x-hidden overflow-y-auto">
            <h1 className="sr-only">Đăng ký tài khoản</h1>

            {/* Blurred Background Image Layer */}
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat scale-105 filter blur-[6px] brightness-[0.65] pointer-events-none"
                style={{ backgroundImage: `url(${loginBg})` }}
            />

            {/* Deep gradient overlay */}
            <div className="fixed inset-0 bg-gradient-to-br from-slate-950/60 via-slate-900/40 to-indigo-950/50 pointer-events-none" />

            {/* Top action bar */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between relative z-10">
                <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-lg border border-white/20 shadow-md hover:shadow-lg transition-all cursor-pointer backdrop-blur-md focus-visible:outline-2 focus-visible:outline-[#315dff]"
                >
                    <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Quay lại</span>
                </button>

                {/* Logo badge — mobile */}
                <div className="flex lg:hidden items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                        <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-bold text-white tracking-tight">DeDocu Hub</span>
                </div>
            </div>

            {/* Main split layout */}
            <div className="flex-1 flex items-center justify-center relative z-10">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
                    {/* ── LEFT: Branding panel ── */}
                    <div className="hidden lg:flex lg:flex-1 flex-col justify-center items-start">
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                                <BookOpen className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <span className="text-2xl font-bold text-white tracking-tight block leading-none">
                                    DeDocu Hub
                                </span>
                                <span className="text-[11px] text-indigo-200/80 font-medium tracking-wide uppercase">
                                    Academic Network
                                </span>
                            </div>
                        </div>

                        {/* Main headline */}
                        <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.15] mb-5">
                            Tham gia cộng đồng{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-blue-300">
                                học thuật mở
                            </span>
                        </h2>

                        {/* Subtitle */}
                        <p className="text-white/75 text-base xl:text-lg mb-10 leading-relaxed max-w-md">
                            Đăng ký tài khoản miễn phí và bắt đầu chia sẻ, học hỏi từ kho tài liệu học thuật phi tập
                            trung lớn nhất Việt Nam.
                        </p>

                        {/* Value props */}
                        <div className="space-y-4 w-full max-w-sm">
                            {REGISTER_FEATURES.map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="flex items-start gap-4 group">
                                    <div className="mt-0.5 w-9 h-9 flex-shrink-0 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/25 transition-colors">
                                        <Icon className="w-4 h-4 text-indigo-200" />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-semibold leading-tight">{title}</p>
                                        <p className="text-white/60 text-xs mt-0.5 leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── RIGHT: Register Form panel ── */}
                    <div className="w-full lg:w-auto lg:flex-shrink-0 flex items-start justify-center py-2">
                        <RegisterForm onRegisterSuccess={handleRegisterSuccess} />
                    </div>
                </div>
            </div>

            {/* Subtle bottom fade */}
            <div className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
        </div>
    );
}
