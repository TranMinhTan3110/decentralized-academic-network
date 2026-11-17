import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../../features/auth';
import { ArrowLeft, BookOpen, Users, Shield, Network } from 'lucide-react';
import loginBg from '../../assets/login-bg.jpg';

const HERO_FEATURES = [
    {
        icon: BookOpen,
        title: 'Chia sẻ tài liệu học thuật',
        desc: 'Đăng tải, khám phá và tải về tài liệu từ cộng đồng sinh viên toàn quốc.',
    },
    {
        icon: Network,
        title: 'Mạng lưới phi tập trung',
        desc: 'Dữ liệu được phân tán, không phụ thuộc một máy chủ trung tâm duy nhất.',
    },
    {
        icon: Users,
        title: 'Kết nối cộng đồng học thuật',
        desc: 'Giao lưu, trao đổi kiến thức cùng sinh viên, giảng viên và nhà nghiên cứu.',
    },
    {
        icon: Shield,
        title: 'An toàn & minh bạch',
        desc: 'Tài liệu được kiểm duyệt, lưu trữ bền vững và truy xuất nguồn gốc rõ ràng.',
    },
];

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const searchParams = new URLSearchParams(location.search);
    const redirectParam = searchParams.get('redirect');
    const redirectUrl = redirectParam ? decodeURIComponent(redirectParam) : '/explore';

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    const handleLoginSuccess = async () => {
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            navigate(redirectUrl);
        }, 500);
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            <h1 className="sr-only">LoginPage</h1>

            {/* Blurred Background Image Layer */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 filter blur-[6px] brightness-[0.65]"
                style={{ backgroundImage: `url(${loginBg})` }}
            />

            {/* Deep gradient overlay — heavier at bottom for legibility */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/60 via-slate-900/40 to-blue-950/50 pointer-events-none" />

            {/* Top action bar */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between relative z-10">
                <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-lg border border-white/20 shadow-md hover:shadow-lg transition-all cursor-pointer backdrop-blur-md focus-visible:outline-2 focus-visible:outline-[#315dff]"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                </button>

                {/* Logo badge top-right on mobile */}
                <div className="flex lg:hidden items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                        <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-bold text-white tracking-tight">DeDocu Hub</span>
                </div>
            </div>

            {/* Main split layout */}
            <div className="flex-1 flex items-center justify-center relative z-10">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
                    {/* ── LEFT: Hero / Branding panel ── */}
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
                                <span className="text-[11px] text-blue-200/80 font-medium tracking-wide uppercase">
                                    Academic Network
                                </span>
                            </div>
                        </div>

                        {/* Main headline */}
                        <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.15] mb-5">
                            Mạng xã hội học thuật{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">
                                phi tập trung
                            </span>
                        </h2>

                        {/* Subtitle */}
                        <p className="text-white/75 text-base xl:text-lg mb-10 leading-relaxed max-w-md">
                            Nền tảng chia sẻ, khám phá và lưu trữ tài liệu học thuật an toàn, minh bạch trên mạng lưới
                            phi tập trung dành cho sinh viên Việt Nam.
                        </p>

                        {/* Value props */}
                        <div className="space-y-4 w-full max-w-sm">
                            {HERO_FEATURES.map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="flex items-start gap-4 group">
                                    <div className="mt-0.5 w-9 h-9 flex-shrink-0 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/25 transition-colors">
                                        <Icon className="w-4 h-4 text-blue-200" />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-semibold leading-tight">{title}</p>
                                        <p className="text-white/60 text-xs mt-0.5 leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── RIGHT: Login Form panel ── */}
                    <div className="w-full lg:w-auto lg:flex-shrink-0 flex items-center justify-center">
                        <LoginForm onLoginSuccess={handleLoginSuccess} isSubmitting={isSubmitting} />
                    </div>
                </div>
            </div>

            {/* Subtle bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
        </div>
    );
}
