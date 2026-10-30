import { useState, type FormEvent } from 'react';
import { Save, Laptop, Smartphone, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '../../../components/admin';

interface SessionItem {
    id: string;
    icon: typeof Laptop;
    device: string;
    ip: string;
    time: string;
    current?: boolean;
}

const initialSessions: SessionItem[] = [
    {
        id: 'sess-1',
        icon: Laptop,
        device: 'MacBook Pro · Chrome 138',
        ip: '113.190.24.77',
        time: 'Hôm nay 09:41',
        current: true,
    },
    {
        id: 'sess-2',
        icon: Smartphone,
        device: 'iPhone 16 · Safari',
        ip: '113.190.24.81',
        time: 'Hôm qua 21:07',
        current: false,
    },
    {
        id: 'sess-3',
        icon: Monitor,
        device: 'Windows 11 · Edge',
        ip: '27.72.100.15',
        time: '14/10 08:22',
        current: false,
    },
];

export function AdminSettingsPage() {
    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // 2FA state
    const [tfa, setTfa] = useState(true);

    // Governance parameters state
    const [gUpload, setGUpload] = useState<number>(20);
    const [gUnlock, setGUnlock] = useState<number>(10);
    const [gSize, setGSize] = useState<number>(50);
    const [mode, setMode] = useState<'post' | 'pre'>('post');

    const [pwdUpdated, setPwdUpdated] = useState(false);

    const handleSavePassword = (e: FormEvent) => {
        e.preventDefault();
        if (!currentPassword) {
            toast.error('Vui lòng nhập mật khẩu hiện tại');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('Mật khẩu mới phải có tối thiểu 8 ký tự');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        toast.success('Đã cập nhật mật khẩu quản trị');
        setPwdUpdated(true);
        setTimeout(() => setPwdUpdated(false), 2000);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleToggle2fa = () => {
        const next = !tfa;
        setTfa(next);
        toast.success(next ? 'Đã bật xác thực 2 lớp' : 'Đã tắt xác thực 2 lớp');
    };

    const [isSaved, setIsSaved] = useState(false);

    const handleSaveGovernance = (e: FormEvent) => {
        e.preventDefault();
        const modeLabel = mode === 'post' ? 'Hậu kiểm' : 'Tiền kiểm';
        toast.success(`Đã lưu cấu hình ở chế độ ${modeLabel}`);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <AdminLayout
            breadcrumb="Admin / Cài đặt"
            title="Cài đặt & Hồ sơ quản trị viên"
            subtitle="Hồ sơ cá nhân, bảo mật và tham số quản trị mạng lưới"
        >
            {/*  ADMIN PROFILE CARD  */}
            <div className="bg-white border border-[#dce9ff] rounded-[14px] p-5 flex flex-wrap items-center gap-5">
                <span className="w-[72px] h-[72px] rounded-full bg-[#0b1c30] text-white flex items-center justify-center font-bold text-2xl shrink-0">
                    AT
                </span>
                <div className="flex-1 min-w-[260px]">
                    <h2 className="text-xl font-bold text-[#0b1c30] m-0">Âu Dương Tấn</h2>
                    <div className="text-xs text-[#5a6a80] my-1 mb-2">tan.auduong@dedocu.vn</div>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#e5eeff] text-[#0051d5] border border-[#c3d6ff]">
                        Council Auditor / Node Trưởng Đại học
                    </span>
                </div>
                <div className="flex-1 min-w-[300px] flex flex-col">
                    <div className="flex justify-between gap-2.5 text-[13px] border-b border-dashed border-[#e5eeff] py-1.5">
                        <span className="text-[#5a6a80]">Ví Web3</span>
                        <span className="font-mono text-xs font-medium text-[#0051d5]">0x71C82...4b9</span>
                    </div>
                    <div className="flex justify-between gap-2.5 text-[13px] border-b border-dashed border-[#e5eeff] py-1.5">
                        <span className="text-[#5a6a80]">Node ID IPFS</span>
                        <span className="font-mono text-xs font-medium text-[#0051d5]">QmZtmD2...82Fq</span>
                    </div>
                    <div className="flex justify-between gap-2.5 text-[13px] py-1.5">
                        <span className="text-[#5a6a80]">Node phụ trách</span>
                        <span className="text-[#0b1c30]">ĐH Bách Khoa HN · SLA 99.98%</span>
                    </div>
                </div>
            </div>

            {/*  TWO COLUMN: PASSWORD & SESSIONS  */}
            <div className="flex flex-wrap gap-4">
                {/* Column 1: Password & 2FA */}
                <div className="flex-1 min-w-[320px] bg-white border border-[#dce9ff] rounded-[14px] p-5 flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-bold text-[#0b1c30] mb-3.5">Đổi mật khẩu quản trị</h3>
                        <form onSubmit={handleSavePassword} className="space-y-3">
                            <div className="flex flex-col gap-1.5 mb-3">
                                <label htmlFor="p1" className="text-xs font-semibold text-[#44505f]">
                                    Mật khẩu hiện tại
                                </label>
                                <input
                                    id="p1"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="border border-[#c3d0e6] bg-white rounded-[9px] py-[9px] px-3 text-sm text-[#0b1c30] outline-none focus:border-[#0051d5] focus:ring-3 focus:ring-[#dce9ff] transition-all"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5 mb-3">
                                <label htmlFor="p2" className="text-xs font-semibold text-[#44505f]">
                                    Mật khẩu mới
                                </label>
                                <input
                                    id="p2"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Tối thiểu 12 ký tự"
                                    className="border border-[#c3d0e6] bg-white rounded-[9px] py-[9px] px-3 text-sm text-[#0b1c30] outline-none focus:border-[#0051d5] focus:ring-3 focus:ring-[#dce9ff] transition-all"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5 mb-3">
                                <label htmlFor="p3" className="text-xs font-semibold text-[#44505f]">
                                    Xác nhận mật khẩu
                                </label>
                                <input
                                    id="p3"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Nhập lại mật khẩu mới"
                                    className="border border-[#c3d0e6] bg-white rounded-[9px] py-[9px] px-3 text-sm text-[#0b1c30] outline-none focus:border-[#0051d5] focus:ring-3 focus:ring-[#dce9ff] transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                className="inline-flex items-center gap-1.5 rounded-[9px] py-2 px-3 text-[13px] font-semibold leading-tight bg-[#0b1c30] text-white hover:bg-[#1d3350] transition-colors cursor-pointer"
                            >
                                <span>{pwdUpdated ? 'Đã cập nhật ✓' : 'Cập nhật mật khẩu'}</span>
                            </button>
                        </form>
                    </div>

                    {/* 2FA Section */}
                    <div className="flex justify-between items-center gap-3 mt-5 pt-4.5 border-t border-[#e5eeff]">
                        <div>
                            <div className="font-semibold text-sm text-[#0b1c30]">Xác thực 2 lớp (2FA OTP)</div>
                            <div className="text-xs text-[#5a6a80]">Bảo vệ tài khoản Admin bằng mã OTP</div>
                        </div>

                        {/* Switch .sw */}
                        <button
                            type="button"
                            role="switch"
                            aria-checked={tfa}
                            aria-label="Bật tắt xác thực 2 lớp (2FA)"
                            onClick={handleToggle2fa}
                            className={`w-11 h-[26px] rounded-full transition-colors relative cursor-pointer shrink-0 border-0 ${
                                tfa ? 'bg-[#009668]' : 'bg-[#c3d0e6]'
                            }`}
                        >
                            <span
                                className={`block w-5 h-5 rounded-full bg-white transition-all duration-150 absolute top-[3px] ${
                                    tfa ? 'left-[21px]' : 'left-[3px]'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Column 2: Recent Sessions */}
                <div className="flex-1 min-w-[320px] bg-white border border-[#dce9ff] rounded-[14px] p-5">
                    <h3 className="text-base font-bold text-[#0b1c30] mb-1.5">Phiên đăng nhập gần nhất</h3>
                    <div>
                        {initialSessions.map((s, index) => {
                            const IconComponent = s.icon;
                            return (
                                <div
                                    key={s.id}
                                    className={`flex items-center gap-3 py-3 ${
                                        index < initialSessions.length - 1 ? 'border-b border-[#eef3ff]' : ''
                                    }`}
                                >
                                    <span className="text-[#5a6a80]">
                                        <IconComponent size={20} />
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm text-[#0b1c30]">{s.device}</div>
                                        <div className="font-mono text-xs text-[#5a6a80]">{s.ip}</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-xs text-[#5a6a80]">{s.time}</div>
                                        {s.current && (
                                            <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e6f9f0] text-[#009668] border border-[#b7ecd5]">
                                                Hiện tại
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/*  GOVERNANCE PARAMETERS CARD  */}
            <div className="bg-white border border-[#dce9ff] rounded-[14px] p-5">
                <h3 className="text-lg font-bold text-[#0b1c30]">Tham số mạng lưới (Governance Parameters)</h3>
                <p className="text-xs sm:text-sm text-[#5a6a80] mt-1 mb-5">
                    Điều chỉnh cơ chế khuyến khích chia sẻ học liệu và chính sách kiểm duyệt
                </p>

                <form onSubmit={handleSaveGovernance}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
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

                        {/* G3: PDF Size limit */}
                        <div className="flex flex-col">
                            <label htmlFor="g3" className="text-sm font-semibold text-[#1e293b] mb-2">
                                Giới hạn dung lượng PDF (MB)
                            </label>
                            <input
                                id="g3"
                                type="number"
                                value={gSize}
                                onChange={(e) => setGSize(Number(e.target.value))}
                                className="w-full border border-[#cbd5e1] bg-white rounded-xl py-2.5 px-3.5 text-sm font-medium text-[#0b1c30] outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#dce9ff] transition-all"
                            />
                            <span className="text-xs text-[#5a6a80] mt-2">Mặc định: 50 MB</span>
                        </div>
                    </div>

                    {/* Moderation Mode Label */}
                    <div className="text-xs font-semibold text-[#44505f] my-1.5 mb-2">Chế độ kiểm duyệt</div>

                    {/* Segmented Options .seg */}
                    <div className="flex flex-wrap gap-2">
                        {/* Option 1: Post-moderation */}
                        <button
                            type="button"
                            onClick={() => setMode('post')}
                            className={`flex-1 min-w-[220px] text-left border-[1.5px] rounded-xl p-[12px_14px] flex flex-col gap-1 transition-all cursor-pointer ${
                                mode === 'post'
                                    ? 'border-[#0b1c30] bg-[#f3f7ff]'
                                    : 'border-[#dce9ff] bg-white hover:border-[#c3d0e6]'
                            }`}
                        >
                            <span className="font-semibold text-sm text-[#0b1c30] flex items-center gap-2">
                                Hậu kiểm (Post-moderation)
                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#e6f9f0] text-[#009668] border border-[#b7ecd5]">
                                    Khuyến nghị
                                </span>
                            </span>
                            <span className="text-xs text-[#5a6a80]">
                                Đăng ngay, AI tự động duyệt, chỉ xử lý khi có báo cáo.
                            </span>
                        </button>

                        {/* Option 2: Pre-moderation */}
                        <button
                            type="button"
                            onClick={() => setMode('pre')}
                            className={`flex-1 min-w-[220px] text-left border-[1.5px] rounded-xl p-[12px_14px] flex flex-col gap-1 transition-all cursor-pointer ${
                                mode === 'pre'
                                    ? 'border-[#0b1c30] bg-[#f3f7ff]'
                                    : 'border-[#dce9ff] bg-white hover:border-[#c3d0e6]'
                            }`}
                        >
                            <span className="font-semibold text-sm text-[#0b1c30]">Tiền kiểm (Pre-moderation)</span>
                            <span className="text-xs text-[#5a6a80]">
                                Mọi tài liệu phải chờ Admin duyệt trước khi công khai.
                            </span>
                        </button>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-4.5">
                        <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-[9px] py-2 px-3 text-[13px] font-semibold leading-tight bg-[#0b1c30] text-white hover:bg-[#1d3350] transition-colors cursor-pointer"
                        >
                            <Save size={16} />
                            <span>{isSaved ? 'Đã lưu cấu hình ✓' : 'Lưu cấu hình'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
