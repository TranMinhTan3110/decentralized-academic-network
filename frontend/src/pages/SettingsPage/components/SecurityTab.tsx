import { useState, type FormEvent } from 'react';
import { Lock, Eye, EyeOff, Save, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input } from '../../../components/ui';
import { userService } from '../../../services';

export function SecurityTab() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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
        if (newPassword === currentPassword) {
            toast.error('Mật khẩu mới không được trùng với mật khẩu hiện tại!');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không trùng khớp!');
            return;
        }

        setIsUpdatingPassword(true);
        try {
            await userService.changePassword({
                currentPassword,
                newPassword,
            });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            toast.success('Đã cập nhật mật khẩu mới thành công!');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Đổi mật khẩu thất bại, vui lòng thử lại';
            toast.error(message);
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Tab Header */}
            <div className="border-b border-[#e2e8f0] pb-4">
                <h2 className="text-xl font-bold text-[#0f172a]">Mật khẩu & Bảo mật</h2>
                <p className="text-xs text-[#64748b] mt-1">
                    Quản lý mật khẩu đăng nhập để bảo vệ an toàn cho tài khoản và tài liệu học thuật của bạn.
                </p>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#0284c7]" />
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
        </div>
    );
}
