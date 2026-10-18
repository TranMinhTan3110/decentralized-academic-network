import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Camera, Save, User, Building2, GraduationCap, FileText, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, Button, Input } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { userService } from '../../../services';

export function ProfileTab() {
    const { userDto, isAuthenticated, updateUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [avatarUrl, setAvatarUrl] = useState<string | null>(userDto?.avatarUrl || '');
    const [name, setName] = useState(userDto?.fullName || '');
    const [email, setEmail] = useState(userDto?.email || '');
    const [institution, setInstitution] = useState(userDto?.universityName || '');
    const [major, setMajor] = useState(userDto?.major || '');
    const [bio, setBio] = useState(userDto?.bio || '');
    const [isSaving, setIsSaving] = useState(false);

    // Fetch fresh profile from backend on mount
    useEffect(() => {
        let isMounted = true;
        if (isAuthenticated) {
            userService
                .getProfile()
                .then((profile) => {
                    if (isMounted && profile) {
                        setName(profile.fullName || '');
                        setEmail(profile.email || '');
                        setInstitution(profile.universityName || '');
                        setMajor(profile.major || '');
                        setBio(profile.bio || '');
                        setAvatarUrl(profile.avatarUrl || '');
                        updateUser(profile);
                    }
                })
                .catch(() => {
                    // Fallback silently to initial userDto state
                });
        }
        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, updateUser]);

    const handleRandomAvatar = () => {
        const randomSeed = Math.random().toString(36).substring(7);
        const newUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
        setAvatarUrl(newUrl);
        toast.success('Đã sinh ảnh đại diện phong cách ngẫu nhiên!');
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Kích thước ảnh tối đa là 5MB!');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (result.length > 500) {
                    const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(file.name)}`;
                    setAvatarUrl(fallbackUrl);
                    toast.info('Đã tạo ảnh đại diện từ tên tệp hình ảnh của bạn!');
                } else {
                    setAvatarUrl(result);
                    toast.success('Đã chọn ảnh đại diện thành công!');
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveAvatar = () => {
        setAvatarUrl(null);
        toast.info('Đã gỡ ảnh đại diện.');
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Họ và tên không được để trống!');
            return;
        }

        setIsSaving(true);
        try {
            const updated = await userService.updateProfile({
                fullName: name.trim(),
                major: major.trim(),
                bio: bio.trim(),
                universityName: institution.trim(),
                avatarUrl: avatarUrl || undefined,
            });
            updateUser(updated);
            toast.success('Đã lưu thay đổi hồ sơ cá nhân thành công!');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu thông tin';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tab Header */}
            <div className="border-b border-[#e2e8f0] pb-4">
                <h2 className="text-xl font-bold text-[#0f172a]">Hồ sơ cá nhân</h2>
                <p className="text-xs text-[#64748b] mt-1">
                    Cập nhật thông tin công khai của bạn để đồng nghiệp và cộng đồng học thuật dễ dàng kết nối.
                </p>
            </div>

            {/* Avatar Section */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-col sm:flex-row items-center gap-5">
                <div className="relative group shrink-0">
                    <Avatar
                        name={name || 'User'}
                        avatar={avatarUrl || undefined}
                        size="lg"
                        className="!w-24 !h-24 !text-2xl border-2 border-[#0284c7] shadow-sm"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-2 bg-white text-[#0f172a] hover:bg-[#0284c7] hover:text-white rounded-full border border-[#cbd5e1] shadow-xs transition-colors cursor-pointer"
                        title="Đổi ảnh đại diện"
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        accept="image/*"
                        className="hidden"
                    />
                </div>

                <div className="text-center sm:text-left space-y-1.5 flex-1">
                    <h3 className="text-sm font-bold text-[#121827]">Ảnh đại diện</h3>
                    <p className="text-xs text-[#5f6878]">
                        Hỗ trợ định dạng PNG, JPG, SVG hoặc WEBP. Bạn có thể chọn ngẫu nhiên phong cách Dicebear avatar độc đáo.
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <Button
                            variant="secondary"
                            onClick={() => fileInputRef.current?.click()}
                            className="!min-h-[34px] !py-1.5 !px-3"
                        >
                            Tải ảnh mới
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleRandomAvatar}
                            className="!min-h-[34px] !py-1.5 !px-3 !text-[#0284c7] hover:!bg-[#e0f2fe]"
                            icon={<RefreshCw className="w-3.5 h-3.5" />}
                        >
                            Đổi ngẫu nhiên
                        </Button>
                        {avatarUrl && (
                            <Button
                                variant="secondary"
                                onClick={handleRemoveAvatar}
                                className="!min-h-[34px] !py-1.5 !px-3 !text-rose-600 hover:!bg-rose-50"
                            >
                                Gỡ ảnh
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="sm:col-span-2 -mt-5">
                    <Input
                        id="settings-name"
                        label="Tên hiển thị"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        icon={<User className="w-4 h-4" />}
                        required
                    />
                </div>

                {/* Email */}
                <div className="sm:col-span-2 -mt-5">
                    <Input
                        id="settings-email"
                        label="Địa chỉ Email"
                        value={email}
                        disabled
                        icon={<Mail className="w-4 h-4" />}
                        className="!bg-[#f5f7fb] !text-[#5f6878] cursor-not-allowed"
                    />
                </div>

                {/* Institution */}
                <div className="-mt-5">
                    <Input
                        id="settings-institution"
                        label="Trường đại học / Tổ chức"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="VD: Đại học Bách khoa Hà Nội"
                        icon={<Building2 className="w-4 h-4" />}
                    />
                </div>

                {/* Major */}
                <div className="-mt-5">
                    <Input
                        id="settings-major"
                        label="Chuyên ngành"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        placeholder="VD: Kỹ thuật Phần mềm"
                        icon={<GraduationCap className="w-4 h-4" />}
                    />
                </div>

                {/* Bio */}
                <div className="sm:col-span-2">
                    <label htmlFor="settings-bio" className="block text-xs font-semibold text-[#121827] mb-1.5">
                        Tiểu sử / Giới thiệu ngắn
                    </label>
                    <div className="relative">
                        <FileText className="absolute left-3.5 top-3.5 text-[#5f6878] w-4 h-4 pointer-events-none" />
                        <textarea
                            id="settings-bio"
                            rows={3}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Mô tả ngắn về bản thân và định hướng nghiên cứu..."
                            className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-[#cbd5e1] rounded-[7px] text-xs text-[#0f172a] focus:border-[#0284c7] focus:outline-none transition-colors resize-y min-h-[90px]"
                        />
                    </div>
                </div>
            </div>

            {/* Action Footer */}
            <div className="flex justify-end pt-4 border-t border-[#e2e8f0]">
                <Button
                    type="submit"
                    variant="primary"
                    disabled={isSaving}
                    icon={
                        isSaving ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )
                    }
                >
                    Lưu thay đổi
                </Button>
            </div>
        </form>
    );
}
