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
        /*
         * RegisterPage has a taller form (5 fields), so the page MUST scroll on
         * short screens. Strategy:
         *   - Root = min-h-screen, overflow-x-hidden (allow y-scroll).
         *   - Background = fixed so it doesn't scroll with content.
         *   - No overflow-hidden on root so the form is reachable on short displays.
         */
        <div className="min-h-screen flex flex-col overflow-x-hidden overflow-y-auto">
            <h1 className="sr-only">Đăng ký tài khoản</h1>

            {/* ── Background (fixed so it stays behind scrolled content) ── */}
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat scale-110 blur-[8px] brightness-[0.6] pointer-events-none"
                style={{ backgroundImage: `url(${loginBg})` }}
            />
            <div className="fixed inset-0 bg-gradient-to-br from-slate-950/65 via-slate-900/45 to-indigo-950/55 pointer-events-none" />

            {/* ── Top bar ── */}
            <header className="relative z-10 w-full px-4 sm:px-6 lg:px-10 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
                <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-semibold rounded-lg border border-white/20 shadow backdrop-blur-md transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#315dff]"
                >
                    <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>Quay lại</span>
                </button>

                {/* Logo — mobile only */}
                <div className="flex lg:hidden items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                        <BookOpen className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-white tracking-tight">DeDocu Hub</span>
                </div>
            </header>

            {/* ── Main content ── */}
            <main className="relative z-10 flex-1 flex items-start lg:items-center justify-center px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8">
                <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center lg:items-center gap-8 lg:gap-14 xl:gap-20">

                    {/* ── LEFT hero (desktop only) ── */}
                    <div className="hidden lg:flex flex-1 flex-col items-start self-center">
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-7 xl:mb-8">
                            <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                                <BookOpen className="w-6 h-6 xl:w-7 xl:h-7 text-white" />
                            </div>
                            <div>
                                <span className="text-xl xl:text-2xl font-bold text-white tracking-tight block leading-none">
                                    DeDocu Hub
                                </span>
                                <span className="text-[10px] xl:text-[11px] text-indigo-200/80 font-medium tracking-wide uppercase">
                                    Academic Network
                                </span>
                            </div>
                        </div>

                        {/* Headline */}
                        <h2 className="text-3xl xl:text-4xl 2xl:text-5xl font-extrabold text-white leading-[1.15] mb-4 xl:mb-5">
                            Tham gia cộng đồng{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-blue-300">
                                học thuật mở
                            </span>
                        </h2>

                        {/* Subtitle */}
                        <p className="text-white/75 text-sm xl:text-base mb-8 xl:mb-10 leading-relaxed max-w-sm xl:max-w-md">
                            Đăng ký tài khoản miễn phí và bắt đầu chia sẻ, học hỏi từ
                            kho tài liệu học thuật phi tập trung lớn nhất Việt Nam.
                        </p>

                        {/* Value props */}
                        <div className="space-y-3.5 xl:space-y-4 w-full max-w-xs xl:max-w-sm">
                            {REGISTER_FEATURES.map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="flex items-start gap-3 group">
                                    <div className="mt-0.5 w-8 h-8 xl:w-9 xl:h-9 flex-shrink-0 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/25 transition-colors">
                                        <Icon className="w-4 h-4 text-indigo-200" />
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
                                { label: 'Thành viên', value: '5K+' },
                                { label: 'Trường ĐH', value: '50+' },
                            ].map(({ label, value }) => (
                                <div key={label} className="text-center">
                                    <p className="text-white text-lg xl:text-xl font-bold">{value}</p>
                                    <p className="text-white/50 text-[10px] xl:text-[11px] font-medium">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── RIGHT: form ── */}
                    <div className="w-full lg:w-auto lg:flex-shrink-0 flex justify-center pb-6 lg:pb-0">
                        <RegisterForm onRegisterSuccess={handleRegisterSuccess} />
                    </div>
                </div>
            </main>
        </div>
    );
}
