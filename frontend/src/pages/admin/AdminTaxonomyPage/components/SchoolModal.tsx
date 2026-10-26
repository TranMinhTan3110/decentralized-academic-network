import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

export interface SchoolData {
    id: string;
    code: string;
    name: string;
    short: string;
    city: string;
    facultyCount?: number;
    documentCount: number;
}

interface SchoolModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (school: SchoolData) => void;
    initialData?: SchoolData | null;
}

const VIETNAM_CITIES = [
    'Hà Nội',
    'TP. Hồ Chí Minh',
    'Đà Nẵng',
    'Cần Thơ',
    'Hải Phòng',
    'Thái Nguyên',
    'Huế',
    'Bình Dương',
    'Khánh Hòa',
    'Đồng Nai',
];

export const SchoolModal: React.FC<SchoolModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
}) => {
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [short, setShort] = useState('');
    const [city, setCity] = useState('Hà Nội');
    const [errors, setErrors] = useState<{ code?: string; name?: string }>({});

    // Populate or reset form when modal opens or initialData changes
    useEffect(() => {
        if (initialData) {
            setCode(initialData.code || initialData.id?.toUpperCase() || '');
            setName(initialData.name || '');
            setShort(initialData.short || '');
            setCity(initialData.city || 'Hà Nội');
        } else {
            setCode('');
            setName('');
            setShort('');
            setCity('Hà Nội');
        }
        setErrors({});
    }, [initialData, isOpen]);

    // Keyboard support: Escape closes modal
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Auto-generate avatar initials when code or name changes if user hasn't set custom
    const handleNameChange = (val: string) => {
        setName(val);
        if (!initialData && !short) {
            const words = val.trim().split(/\s+/).filter(Boolean);
            if (words.length >= 2) {
                const initials = (words[0][0] + words[1][0]).toUpperCase();
                setShort(initials);
            }
        }
    };

    const handleCodeChange = (val: string) => {
        const clean = val.toUpperCase().replace(/\s+/g, '');
        setCode(clean);
        if (!initialData && !short && clean.length >= 2) {
            setShort(clean.slice(0, 2));
        }
    };

    const validate = () => {
        const newErrors: { code?: string; name?: string } = {};
        if (!code.trim()) {
            newErrors.code = 'Vui lòng nhập mã trường (VD: HUST, NEU, UIT)';
        }
        if (!name.trim()) {
            newErrors.name = 'Vui lòng nhập tên đầy đủ của trường đại học';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const avatarText = short.trim() || code.trim().slice(0, 2).toUpperCase() || 'DH';

        const payload: SchoolData = {
            id: initialData?.id || code.trim().toLowerCase(),
            code: code.trim().toUpperCase(),
            name: name.trim(),
            short: avatarText,
            city: city.trim() || 'Hà Nội',
            facultyCount: initialData?.facultyCount ?? 0,
            documentCount: initialData?.documentCount ?? 0,
        };

        onSubmit(payload);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="school-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/50 backdrop-blur-xs transition-opacity"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-[#dce9ff] flex flex-col overflow-hidden max-h-[92vh]">
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafd]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#eff4ff] border border-[#cbe0ff] text-[#0051d5] flex items-center justify-center">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 id="school-modal-title" className="text-lg font-bold text-[#0b1c30]">
                                {initialData ? 'Chỉnh sửa trường đại học' : 'Thêm trường đại học mới'}
                            </h2>
                            <p className="text-xs text-[#5a6a80]">
                                {initialData
                                    ? 'Cập nhật thông tin nhận diện cơ sở đào tạo'
                                    : 'Khai báo cơ sở đào tạo mới vào danh mục học thuật phi tập trung'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[#5a6a80] hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors cursor-pointer"
                        aria-label="Đóng cửa sổ"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {/* Mã trường & Avatar viết tắt */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 space-y-1.5">
                            <label htmlFor="school-code" className="block text-xs font-semibold text-[#0b1c30]">
                                Mã trường <span className="text-[#ba1a1a]">*</span>
                            </label>
                            <input
                                id="school-code"
                                type="text"
                                value={code}
                                onChange={(e) => handleCodeChange(e.target.value)}
                                placeholder="VD: HUST, NEU, UEH"
                                maxLength={12}
                                className={`w-full px-3 py-2 text-sm font-mono uppercase rounded-xl border bg-white text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] transition-all ${
                                    errors.code ? 'border-[#ba1a1a] bg-[#fff5f4]' : 'border-[#cbd5e1]'
                                }`}
                            />
                            {errors.code && (
                                <p className="text-xs text-[#ba1a1a] flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {errors.code}
                                </p>
                            )}
                        </div>

                        {/* Avatar Ký hiệu */}
                        <div className="space-y-1.5">
                            <label htmlFor="school-short" className="block text-xs font-semibold text-[#0b1c30]">
                                Avatar viết tắt
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="school-short"
                                    type="text"
                                    value={short}
                                    onChange={(e) => setShort(e.target.value.toUpperCase().slice(0, 4))}
                                    placeholder="HU"
                                    maxLength={4}
                                    className="w-full px-3 py-2 text-sm font-bold uppercase text-center rounded-xl border border-[#cbd5e1] bg-white text-[#0051d5] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                                />
                                <div
                                    className="w-9 h-9 rounded-full bg-[#eff4ff] border border-[#cbe0ff] text-[#0051d5] flex items-center justify-center font-bold text-xs shrink-0"
                                    title="Xem trước huy hiệu"
                                >
                                    {short || code.slice(0, 2) || 'DH'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tên trường đầy đủ */}
                    <div className="space-y-1.5">
                        <label htmlFor="school-name" className="block text-xs font-semibold text-[#0b1c30]">
                            Tên trường đại học <span className="text-[#ba1a1a]">*</span>
                        </label>
                        <input
                            id="school-name"
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="VD: Đại học Bách Khoa Hà Nội"
                            className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] transition-all ${
                                errors.name ? 'border-[#ba1a1a] bg-[#fff5f4]' : 'border-[#cbd5e1]'
                            }`}
                        />
                        {errors.name && (
                            <p className="text-xs text-[#ba1a1a] flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Thành phố */}
                    <div className="space-y-1.5">
                        <label htmlFor="school-city" className="block text-xs font-semibold text-[#0b1c30] flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#5a6a80]" />
                            Tỉnh / Thành phố
                        </label>
                        <select
                            id="school-city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-[#cbd5e1] bg-white text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                        >
                            {VIETNAM_CITIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-[#cbd5e1] bg-white hover:bg-[#f1f5f9] text-[#0b1c30] transition-colors cursor-pointer"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-[#0051d5] hover:bg-[#0041ab] active:bg-[#00368c] text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {initialData ? 'Lưu thay đổi' : 'Thêm trường'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
