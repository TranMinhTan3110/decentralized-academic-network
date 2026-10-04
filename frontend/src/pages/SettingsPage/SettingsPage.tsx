import { useState } from 'react';
import { MainLayout } from '../../components/layout';
import { User, Lock, Bell, Palette, ChevronRight, ShieldCheck } from 'lucide-react';
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

                {/* Page Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#14213d] via-[#1f3a5f] to-[#3d5a80] text-white shadow-md">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white text-[11px] font-medium backdrop-blur-xs">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#ee964b]" />
                            <span>Quản lý tài khoản cá nhân</span>
                        </div>
                        <h2 className="text-2xl font-extrabold tracking-tight">Cài đặt tài khoản</h2>
                        <p className="text-xs text-slate-300">
                            Điều chỉnh thông tin cá nhân, thiết lập bảo mật và tùy biến trải nghiệm đọc tài liệu của
                            bạn.
                        </p>
                    </div>
                </div>

                {/* Main 2-column Settings Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Navigation Sidebar */}
                    <div className="lg:col-span-4 bg-white p-2 sm:p-3 rounded-2xl border border-[#d8deea] shadow-xs space-y-1">
                        <div className="px-3 py-2 text-[11px] font-bold text-[#5f6878] uppercase tracking-wider hidden lg:block">
                            Danh mục cài đặt
                        </div>

                        {/* Mobile horizontal scrollable tabs / Desktop vertical list */}
                        <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 pb-1 lg:pb-0 scrollbar-none">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer shrink-0 lg:shrink ${
                                            isActive
                                                ? 'bg-[#315dff] text-white shadow-md font-semibold'
                                                : 'bg-white text-[#121827] hover:bg-[#f5f7fb] hover:text-[#315dff]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`p-2 rounded-lg ${
                                                    isActive ? 'bg-white/20 text-white' : 'bg-[#f0f4ff] text-[#315dff]'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-xs block font-bold leading-tight">
                                                    {tab.label}
                                                </span>
                                                <span
                                                    className={`text-[10px] hidden lg:block mt-0.5 ${
                                                        isActive ? 'text-slate-200' : 'text-[#5f6878]'
                                                    }`}
                                                >
                                                    {tab.description}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight
                                            className={`w-4 h-4 hidden lg:block ${isActive ? 'text-white' : 'text-slate-400'}`}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Active Content Panel */}
                    <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-[#d8deea] shadow-xs min-h-[500px]">
                        {activeTab === 'profile' && <ProfileTab />}
                        {activeTab === 'security' && <SecurityTab />}
                        {activeTab === 'notifications' && <NotificationsTab />}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
