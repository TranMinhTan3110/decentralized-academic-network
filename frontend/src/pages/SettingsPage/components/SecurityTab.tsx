import { useState, type FormEvent } from 'react';
import { Lock, Eye, EyeOff, Save, ShieldCheck, AlertTriangle, Wallet, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input } from '../../../components/ui';

export function SecurityTab() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const getPasswordStrength = (pass: string) => {
        if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
        if (pass.length < 6) return { score: 1, label: 'Yếu', color: 'bg-rose-500' };
        if (pass.length < 10 || !/[A-Z]/.test(pass) || !/[0-9]/.test(pass)) {
            return { score: 2, label: 'Trung bình', color: 'bg-amber-500' };
        }
        return { score: 3, label: 'Rất mạnh', color: 'bg-emerald-500' };
    };

    const strength = getPasswordStrength(newPassword);

    const handlePasswordSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!currentPassword) {
            toast.error('Vui lòng nhập mật khẩu hiện tại!');
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            toast.error('Mật khẩu mới phải từ 6 ký tự trở lên!');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không trùng khớp!');
            return;
        }

        setIsUpdatingPassword(true);
        await new Promise((resolve) => setTimeout(resolve, 600));
        setIsUpdatingPassword(false);

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast.success('Đã cập nhật mật khẩu thành công!');
    };

    const handleDeleteAccount = () => {
        setShowDeleteModal(false);
        toast.error('Yêu cầu xóa tài khoản đã được gửi. Chúng tôi sẽ phản hồi qua email!');
    };

    return (
        <div className="space-y-8">
            {/* Tab Header */}
            <div className="border-b border-[#d8deea] pb-4">
                <h2 className="text-xl font-bold text-[#121827]">Mật khẩu & Bảo mật</h2>
                <p className="text-xs text-[#5f6878] mt-1">
                    Quản lý mật khẩu đăng nhập và nâng cao mức độ bảo mật cho tài khoản của bạn.
                </p>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <h3 className="text-sm font-bold text-[#121827] flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#315dff]" />
                    <span>Đổi mật khẩu</span>
                </h3>

                {/* Current Password */}
                <div className="-mt-3">
                    <Input
                        id="current-pass"
                        label="Mật khẩu hiện tại *"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        icon={<Lock className="w-4 h-4" />}
                        rightIcon={
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="p-1 text-[#5f6878] hover:text-[#121827] focus:outline-none cursor-pointer"
                            >
                                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        }
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* New Password */}
                    <div className="-mt-3">
                        <Input
                            id="new-pass"
                            label="Mật khẩu mới *"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                            icon={<Lock className="w-4 h-4" />}
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="p-1 text-[#5f6878] hover:text-[#121827] focus:outline-none cursor-pointer"
                                >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            }
                        />

                        {/* Strength meter */}
                        {newPassword && (
                            <div className="mt-3 space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-[#5f6878]">Độ mạnh mật khẩu:</span>
                                    <span className="font-semibold text-[#121827]">{strength.label}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex gap-1">
                                    <div
                                        className={`h-full flex-1 ${strength.score >= 1 ? strength.color : 'bg-transparent'}`}
                                    />
                                    <div
                                        className={`h-full flex-1 ${strength.score >= 2 ? strength.color : 'bg-transparent'}`}
                                    />
                                    <div
                                        className={`h-full flex-1 ${strength.score >= 3 ? strength.color : 'bg-transparent'}`}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="-mt-3">
                        <Input
                            id="confirm-pass"
                            label="Xác nhận mật khẩu mới *"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Nhập lại mật khẩu mới"
                            icon={<Lock className="w-4 h-4" />}
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isUpdatingPassword}
                        icon={
                            isUpdatingPassword ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )
                        }
                    >
                        Cập nhật mật khẩu
                    </Button>
                </div>
            </form>

            {/* Advanced Security & Web3 Connection */}
            <div className="space-y-4 pt-4 border-t border-[#d8deea]">
                <h3 className="text-sm font-bold text-[#121827] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#315dff]" />
                    <span>Xác thực nâng cao & Web3</span>
                </h3>
            </div>

            {/* Danger Zone */}
            <div className="p-5 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3">
                <h3 className="text-xs font-bold text-rose-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Khu vực nguy hiểm</span>
                </h3>
                <p className="text-xs text-[#5f6878]">
                    Khi xóa tài khoản, toàn bộ dữ liệu bài viết, tài liệu học thuật đã tải lên và điểm thưởng uy tín của
                    bạn sẽ bị xóa vĩnh viễn khỏi hệ thống phi tập trung.
                </p>
                <Button
                    variant="secondary"
                    onClick={() => setShowDeleteModal(true)}
                    className="!bg-rose-600 hover:!bg-rose-700 !text-white !border-none"
                >
                    Xóa tài khoản vĩnh viễn
                </Button>
            </div>

            {/* Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121827]/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-[#d8deea] animate-in fade-in zoom-in-95 duration-150">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="text-center space-y-1">
                            <h4 className="text-base font-bold text-[#121827]">Xác nhận xóa tài khoản?</h4>
                            <p className="text-xs text-[#5f6878]">
                                Hành động này không thể hoàn tác. Bạn có chắc chắn muốn gửi yêu cầu xóa tài khoản?
                            </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="flex-1">
                                Hủy bỏ
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleDeleteAccount}
                                className="flex-1 !bg-rose-600 hover:!bg-rose-700"
                            >
                                Xác nhận xóa
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
