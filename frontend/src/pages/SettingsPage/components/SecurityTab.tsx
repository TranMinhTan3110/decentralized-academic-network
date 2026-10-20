import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Save, KeyRound, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { userService } from '../../../services';

export function SecurityTab() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await userService.deleteAccount();
            logout();
            toast.success('Tài khoản của bạn đã được xóa thành công.');
            navigate('/login');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Xóa tài khoản thất bại, vui lòng thử lại';
            toast.error(message);
        } finally {
            setIsDeleting(false);
            setShowConfirmDelete(false);
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

            {/* Danger Zone: Delete Account */}
            <div className="pt-6 border-t border-[#e2e8f0]">
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-5 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-rose-100 text-rose-600 shrink-0 mt-0.5">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <h3 className="text-sm font-bold text-rose-900">Khu vực nguy hiểm: Xóa tài khoản</h3>
                            <p className="text-xs text-rose-700 leading-relaxed">
                                Khi bạn xóa tài khoản, phiên làm việc sẽ kết thúc ngay lập tức và tài khoản sẽ bị vô hiệu hóa. Mọi dữ liệu liên quan sẽ không còn khả dụng trên hệ thống.
                            </p>
                        </div>
                    </div>

                    {!showConfirmDelete ? (
                        <div className="flex justify-end pt-1">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowConfirmDelete(true)}
                                className="!border-rose-300 !text-rose-700 hover:!bg-rose-100 hover:!border-rose-400 !font-semibold text-xs"
                                icon={<Trash2 className="w-4 h-4 text-rose-600" />}
                            >
                                Xóa tài khoản này
                            </Button>
                        </div>
                    ) : (
                        <div className="p-4 bg-white rounded-lg border border-rose-200 shadow-xs space-y-3">
                            <p className="text-xs font-semibold text-rose-800">
                                Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản không? Hành động này không thể hoàn tác!
                            </p>
                            <div className="flex items-center justify-end gap-2.5">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setShowConfirmDelete(false)}
                                    disabled={isDeleting}
                                    className="text-xs"
                                >
                                    Hủy bỏ
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                    className="!bg-rose-600 hover:!bg-rose-700 !text-white text-xs !shadow-none"
                                    icon={
                                        isDeleting ? (
                                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                        )
                                    }
                                >
                                    {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa tài khoản'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
