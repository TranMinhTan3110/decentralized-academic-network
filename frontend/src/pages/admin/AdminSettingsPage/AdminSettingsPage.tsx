import { useState, type FormEvent } from 'react';
import { Save, User, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '../../../components/admin';
import { ProfileTab } from '../../SettingsPage/components/ProfileTab';
import { SecurityTab } from '../../SettingsPage/components/SecurityTab';

export function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

    // System configuration parameters state
    const [gUpload, setGUpload] = useState<number>(20);
    const [gUnlock, setGUnlock] = useState<number>(10);
    const [isSaved, setIsSaved] = useState(false);

    const handleSaveGovernance = (e: FormEvent) => {
        e.preventDefault();
        toast.success('Đã lưu cấu hình hệ thống & chính sách học liệu thành công');
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <AdminLayout
            breadcrumb="Admin / Cài đặt"
            title="Cài đặt & Hồ sơ quản trị viên"
            subtitle="Hồ sơ cá nhân, bảo mật tài khoản và chính sách hệ thống"
        >
            <div className="space-y-6">
                {/* USER PROFILE & SECURITY SECTION (Reusing real backend-integrated components) */}
                <div className="bg-white border border-[#dce9ff] rounded-[14px] p-5 sm:p-6 shadow-xs">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-[#e2e8f0] gap-4 sm:gap-6 mb-6">
                        <button
                            type="button"
                            onClick={() => setActiveTab('profile')}
                            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                                activeTab === 'profile'
                                    ? 'border-[#0051d5] text-[#0051d5]'
                                    : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
                            }`}
                        >
                            <User size={16} />
                            <span>Hồ sơ cá nhân</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('security')}
                            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                                activeTab === 'security'
                                    ? 'border-[#0051d5] text-[#0051d5]'
                                    : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
                            }`}
                        >
                            <Lock size={16} />
                            <span>Mật khẩu & Bảo mật</span>
                        </button>
                    </div>

                    {/* Tab Contents */}
                    <div>
                        {activeTab === 'profile' ? (
                            <ProfileTab showAcademicFields={false} />
                        ) : (
                            <SecurityTab showDeleteAccount={false} />
                        )}
                    </div>
                </div>

                {/*  SYSTEM CONFIGURATION CARD (Excluding moderation mode and PDF limit)  */}
                <div className="bg-white border border-[#dce9ff] rounded-[14px] p-5 sm:p-6 shadow-xs">
                    <h3 className="text-lg font-bold text-[#0b1c30]">Cấu hình hệ thống & Chính sách học liệu</h3>
                    <p className="text-xs sm:text-sm text-[#5a6a80] mt-1 mb-5">
                        Điều chỉnh cơ chế tính điểm thưởng chia sẻ và mở khóa học liệu
                    </p>

                    <form onSubmit={handleSaveGovernance}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 max-w-2xl">
                            {/* G1: Upload reward */}
                            <div className="flex flex-col">
                                <label htmlFor="g1" className="text-sm font-semibold text-[#1e293b] mb-2">
                                    Điểm thưởng upload
                                </label>
                                <input
                                    id="g1"
                                    type="number"
                                    value={gUpload}
                                    onChange={(e) => setGUpload(Number(e.target.value))}
                                    className="w-full border border-[#cbd5e1] bg-white rounded-xl py-2.5 px-3.5 text-sm font-medium text-[#0b1c30] outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#dce9ff] transition-all"
                                />
                                <span className="text-xs text-[#5a6a80] mt-2">Mặc định: 20 điểm</span>
                            </div>

                            {/* G2: Unlock reward */}
                            <div className="flex flex-col">
                                <label htmlFor="g2" className="text-sm font-semibold text-[#1e293b] mb-2">
                                    Điểm mở khóa tài liệu
                                </label>
                                <input
                                    id="g2"
                                    type="number"
                                    value={gUnlock}
                                    onChange={(e) => setGUnlock(Number(e.target.value))}
                                    className="w-full border border-[#cbd5e1] bg-white rounded-xl py-2.5 px-3.5 text-sm font-medium text-[#0b1c30] outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#dce9ff] transition-all"
                                />
                                <span className="text-xs text-[#5a6a80] mt-2">Mặc định: 10 điểm</span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                className="inline-flex items-center gap-1.5 rounded-[9px] py-2 px-3 text-[13px] font-semibold leading-tight bg-[#0b1c30] text-white hover:bg-[#1d3350] transition-colors cursor-pointer"
                            >
                                <Save size={16} />
                                <span>{isSaved ? 'Đã lưu cấu hình' : 'Lưu cấu hình'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
