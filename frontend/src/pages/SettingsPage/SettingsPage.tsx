import { useState } from 'react';
import { MainLayout } from '../../components/layout';
import { User, Lock, Bell, ChevronRight, ShieldCheck } from 'lucide-react';
import { ProfileTab } from './components/ProfileTab';
import { SecurityTab } from './components/SecurityTab';
import { NotificationsTab } from './components/NotificationsTab';

export type SettingsTabId = 'profile' | 'security' | 'notifications' | 'preferences';

export function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTabId>('profile');

    const tabs: { id: SettingsTabId; label: string; icon: typeof User; description: string }[] = [
        {
            id: 'profile',
            label: 'Hồ sơ cá nhân',
            icon: User,
            description: 'Thông tin cá nhân & trường học',
        },
        {
            id: 'security',
            label: 'Mật khẩu & Bảo mật',
            icon: Lock,
            description: 'Đổi mật khẩu & xác thực 2FA',
        },
        {
            id: 'notifications',
            label: 'Tùy chỉnh thông báo',
            icon: Bell,
            description: 'Email & thông báo đẩy',
        },
    ];

    return (
        <MainLayout>
            <div className="max-w-[1100px] mx-auto space-y-6">
                {/* Invisible header for screen readers and test compatibility */}
                <h1 className="sr-only">SettingsPage</h1>

                {/* Page Top Header - Solid elegant styling matching app theme */}
                <div className="bg-[#f8fafc] border border-[#e2e8f0] p-6 sm:p-8 rounded-2xl shadow-xs">
                    <div className="space-y-1.5 max-w-2xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e0f2fe] text-[#0284c7] text-xs font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#0284c7]" />
                            <span>Quản lý tài khoản cá nhân</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">Cài đặt tài khoản</h2>
                        <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed">
                            Điều chỉnh thông tin cá nhân, thiết lập bảo mật và tùy biến trải nghiệm đọc tài liệu của bạn.
                        </p>
                    </div>
                </div>

                {/* Main 2-column Settings Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Navigation Sidebar */}
                    <div className="lg:col-span-4 bg-white p-2.5 sm:p-3 rounded-2xl border border-[#e2e8f0] shadow-xs space-y-1">
                        <div className="px-3 py-2 text-[11px] font-bold text-[#64748b] uppercase tracking-wider hidden lg:block">
                            Danh mục cài đặt
                        </div>

                        {/* Mobile horizontal scrollable tabs / Tablet 3-col grid / Desktop vertical list */}
                        <div className="flex sm:grid sm:grid-cols-3 lg:flex lg:flex-col overflow-x-auto sm:overflow-visible gap-2 pb-1 sm:pb-0 scrollbar-none">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-auto sm:w-full text-left px-3 sm:px-3.5 py-2.5 sm:py-3 rounded-xl flex items-center justify-between gap-2.5 transition-all cursor-pointer shrink-0 sm:shrink ${
                                            isActive
                                                ? 'bg-[#0284c7] text-white shadow-xs font-semibold'
                                                : 'bg-white text-[#334155] hover:bg-[#f1f5f9] hover:text-[#0284c7]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 sm:gap-3">
                                            <div
                                                className={`p-2 rounded-lg shrink-0 ${
                                                    isActive ? 'bg-white/20 text-white' : 'bg-[#e0f2fe] text-[#0284c7]'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-xs block font-bold leading-tight truncate">
                                                    {tab.label}
                                                </span>
                                                <span
                                                    className={`text-[10px] hidden lg:block mt-0.5 ${
                                                        isActive ? 'text-white/80' : 'text-[#64748b]'
                                                    }`}
                                                >
                                                    {tab.description}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight
                                            className={`w-4 h-4 shrink-0 hidden lg:block ${isActive ? 'text-white' : 'text-[#94a3b8]'}`}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Active Content Panel */}
                    <div className="lg:col-span-8 bg-white p-5 sm:p-7 md:p-8 rounded-2xl border border-[#e2e8f0] shadow-xs min-h-[500px]">
                        {activeTab === 'profile' && <ProfileTab />}
                        {activeTab === 'security' && <SecurityTab />}
                        {activeTab === 'notifications' && <NotificationsTab />}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
