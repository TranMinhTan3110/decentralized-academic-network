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
        /*
         * Root: min-h-screen + overflow-hidden so the blurred bg never causes scrollbar.
         * On mobile the form is centered vertically via flex-col + flex-1.
         */
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            <h1 className="sr-only">LoginPage</h1>

            {/* ── Background ── */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110 blur-[8px] brightness-[0.6]"
                style={{ backgroundImage: `url(${loginBg})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/65 via-slate-900/45 to-blue-950/55 pointer-events-none" />

            {/* ── Top bar ── */}
            <header className="relative z-10 w-full px-4 sm:px-6 lg:px-10 py-3 sm:py-4 flex items-center justify-between">
                <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-semibold rounded-lg border border-white/20 shadow backdrop-blur-md transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#315dff]"
                >
                    <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>Quay lại</span>
                </button>

                {/* Logo — visible on mobile only (desktop shows the hero panel) */}
                <div className="flex lg:hidden items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                        <BookOpen className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-white tracking-tight">DeDocu Hub</span>
                </div>
            </header>

            {/* ── Main content ── */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
                {/*
                 * On mobile  → single column, form is centered.
                 * On lg+     → two columns: hero on left, form on right.
                 * items-center aligns both columns vertically at mid-screen.
                 */}
                <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center lg:items-center gap-8 lg:gap-14 xl:gap-20">

                    {/* ── LEFT hero (desktop only) ── */}
                    <div className="hidden lg:flex flex-1 flex-col items-start">
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-7 xl:mb-8">
                            <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                                <BookOpen className="w-6 h-6 xl:w-7 xl:h-7 text-white" />
                            </div>
                            <div>
                                <span className="text-xl xl:text-2xl font-bold text-white tracking-tight block leading-none">
                                    DeDocu Hub
                                </span>
                                <span className="text-[10px] xl:text-[11px] text-blue-200/80 font-medium tracking-wide uppercase">
                                    Academic Network
                                </span>
                            </div>
                        </div>

                        {/* Headline */}
                        <h2 className="text-3xl xl:text-4xl 2xl:text-5xl font-extrabold text-white leading-[1.15] mb-4 xl:mb-5">
                            Mạng xã hội học thuật{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">
                                phi tập trung
                            </span>
                        </h2>

                        {/* Subtitle */}
                        <p className="text-white/75 text-sm xl:text-base mb-8 xl:mb-10 leading-relaxed max-w-sm xl:max-w-md">
                            Nền tảng chia sẻ, khám phá và lưu trữ tài liệu học thuật an toàn,
                            minh bạch trên mạng lưới phi tập trung dành cho sinh viên Việt Nam.
                        </p>

                        {/* Value props */}
                        <div className="space-y-3.5 xl:space-y-4 w-full max-w-xs xl:max-w-sm">
                            {HERO_FEATURES.map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="flex items-start gap-3 group">
                                    <div className="mt-0.5 w-8 h-8 xl:w-9 xl:h-9 flex-shrink-0 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/25 transition-colors">
                                        <Icon className="w-4 h-4 text-blue-200" />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-semibold leading-tight">{title}</p>
                                        <p className="text-white/55 text-xs mt-0.5 leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Stats */}
                        <div className="mt-8 xl:mt-10 flex items-center gap-5 xl:gap-6">
                            {[
                                { label: 'Tài liệu', value: '10K+' },
                                { label: 'Sinh viên', value: '5K+' },
                                { label: 'Trường ĐH', value: '50+' },
                            ].map(({ label, value }) => (
                                <div key={label} className="text-center">
                                    <p className="text-white text-lg xl:text-xl font-bold">{value}</p>
                                    <p className="text-white/50 text-[10px] xl:text-[11px] font-medium">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── RIGHT: form ──
                     * Mobile: w-full constrained by max-w of form itself.
                     * Desktop: auto-width, flex-shrink-0 so hero can expand.
                     */}
                    <div className="w-full lg:w-auto lg:flex-shrink-0 flex justify-center">
                        <LoginForm
                            onLoginSuccess={handleLoginSuccess}
                            isSubmitting={isSubmitting}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
