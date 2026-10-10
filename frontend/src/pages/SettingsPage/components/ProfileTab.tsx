import { useState, useRef, type FormEvent } from 'react';
import { Camera, Save, CheckCircle2, User, Building2, GraduationCap, FileText, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, Button, Input } from '../../../components/ui';

export function ProfileTab() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>('');
    const [name, setName] = useState('Nguyễn Văn A');
    const [email] = useState('demo.student@university.edu.vn');
    const [institution, setInstitution] = useState('Đại học Bách Khoa TP.HCM');
    const [major, setMajor] = useState('Khoa học Máy tính');
    const [bio, setBio] = useState(
        'Sinh viên năm 3, đam mê nghiên cứu Khoa học Máy tính và chia sẻ tài liệu học thuật.',
    );
    const [isSaving, setIsSaving] = useState(false);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Kích thước ảnh tối đa là 5MB!');
                return;
            }
            const url = URL.createObjectURL(file);
            setAvatarUrl(url);
            toast.success('Đã cập nhật ảnh đại diện mới!');
        }
    };

    const handleRemoveAvatar = () => {
        setAvatarUrl(null);
        toast.info('Đã gỡ ảnh đại diện.');
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await new Promise((resolve) => setTimeout(resolve, 600));
        setIsSaving(false);
        toast.success('Đã lưu thay đổi hồ sơ cá nhân thành công!');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tab Header */}
            <div className="border-b border-[#d8deea] pb-4">
                <h2 className="text-xl font-bold text-[#121827]">Hồ sơ cá nhân</h2>
                <p className="text-xs text-[#5f6878] mt-1">
                    Cập nhật thông tin công khai của bạn để đồng nghiệp và cộng đồng học thuật dễ dàng kết nối.
                </p>
            </div>

            {/* Avatar Section */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#f5f7fb] border border-[#d8deea] flex flex-col sm:flex-row items-center gap-5">
                <div className="relative group">
                    <Avatar
                        name={name}
                        avatar={avatarUrl || undefined}
                        size="lg"
                        className="!w-24 !h-24 !text-2xl border-2 border-[#315dff] shadow-sm"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-2 bg-white text-[#121827] hover:bg-[#315dff] hover:text-white rounded-full border border-[#d8deea] shadow-md transition-colors cursor-pointer"
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
                        Hỗ trợ định dạng PNG, JPG hoặc WEBP. Tỉ lệ khuyến nghị 1:1, tối đa 5MB.
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                        <Button
                            variant="secondary"
                            onClick={() => fileInputRef.current?.click()}
                            className="!min-h-[34px] !py-1.5 !px-3"
                        >
                            Tải ảnh mới
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
                        label="Trường học / Tổ chức"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="VD: ĐHQG TP.HCM"
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
                        placeholder="VD: Khoa học Máy tính"
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
                            className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-[#aebbd0] rounded-[7px] text-xs text-[#121827] focus:border-[#315dff] focus:outline-none transition-colors resize-y min-h-[90px]"
                        />
                    </div>
                </div>
            </div>

            {/* Action Footer */}
            <div className="flex justify-end pt-4 border-t border-[#d8deea]">
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
