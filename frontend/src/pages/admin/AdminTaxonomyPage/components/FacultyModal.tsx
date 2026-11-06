import React, { useState, useEffect } from 'react';
import { X, FolderTree, CheckCircle2, AlertCircle } from 'lucide-react';
import type { SchoolData } from './SchoolModal';

export interface FacultyData {
    id: string;
    code: string;
    name: string;
    schoolId: string;
    schoolName: string;
    subjectCount: number;
    description?: string;
}

interface FacultyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (faculty: FacultyData) => void;
    initialData?: FacultyData | null;
    schools: SchoolData[];
    defaultSchoolId?: string;
}

export const FacultyModal: React.FC<FacultyModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    schools,
    defaultSchoolId,
}) => {
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [schoolId, setSchoolId] = useState('');
    const [description, setDescription] = useState('');
    const [errors, setErrors] = useState<{ code?: string; name?: string; schoolId?: string }>({});

    useEffect(() => {
        if (initialData) {
            setCode(initialData.code || '');
            setName(initialData.name || '');
            setSchoolId(initialData.schoolId || (schools[0]?.id ?? ''));
            setDescription(initialData.description || '');
        } else {
            setCode('');
            setName('');
            setSchoolId(defaultSchoolId || (schools[0]?.id ?? ''));
            setDescription('');
        }
        setErrors({});
    }, [initialData, isOpen, schools, defaultSchoolId]);

    // Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const validate = () => {
        const newErrors: { code?: string; name?: string; schoolId?: string } = {};
        if (!code.trim()) {
            newErrors.code = 'Vui lòng nhập mã khoa / viện (VD: CNTT, KT, DT)';
        }
        if (!name.trim()) {
            newErrors.name = 'Vui lòng nhập tên khoa / viện';
        }
        if (!schoolId) {
            newErrors.schoolId = 'Vui lòng chọn trường đại học trực thuộc';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const selectedSchool = schools.find((s) => s.id === schoolId);
        const payload: FacultyData = {
            id: initialData?.id || `${schoolId}-${code.trim().toLowerCase()}`,
            code: code.trim().toUpperCase(),
            name: name.trim(),
            schoolId,
            schoolName: selectedSchool ? `${selectedSchool.code} - ${selectedSchool.name}` : 'Chưa phân bổ',
            subjectCount: initialData?.subjectCount ?? 0,
            description: description.trim(),
        };

        onSubmit(payload);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="faculty-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/50 backdrop-blur-xs transition-opacity"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-[#dce9ff] flex flex-col overflow-hidden max-h-[92vh]">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafd]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#eff4ff] border border-[#cbe0ff] text-[#0051d5] flex items-center justify-center">
                            <FolderTree className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 id="faculty-modal-title" className="text-lg font-bold text-[#0b1c30]">
                                {initialData ? 'Chỉnh sửa Khoa / Viện' : 'Thêm Khoa / Viện mới'}
                            </h2>
                            <p className="text-xs text-[#5a6a80]">
                                Quản lý đơn vị đào tạo trực thuộc trường đại học
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[#5a6a80] hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors"
                        aria-label="Đóng cửa sổ"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {/* Chọn trường */}
                    <div className="space-y-1.5">
                        <label htmlFor="faculty-school" className="block text-xs font-semibold text-[#0b1c30]">
                            Trường đại học trực thuộc <span className="text-[#ba1a1a]">*</span>
                        </label>
                        <select
                            id="faculty-school"
                            value={schoolId}
                            onChange={(e) => setSchoolId(e.target.value)}
                            className={`w-full px-3 py-2 text-sm rounded-xl border bg-white text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] ${
                                errors.schoolId ? 'border-[#ba1a1a] bg-[#fff5f4]' : 'border-[#cbd5e1]'
                            }`}
                        >
                            {schools.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.code} - {s.name}
                                </option>
                            ))}
                        </select>
                        {errors.schoolId && (
                            <p className="text-xs text-[#ba1a1a] flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {errors.schoolId}
                            </p>
                        )}
                    </div>

                    {/* Mã khoa & Tên khoa */}
                    <div className="space-y-1.5">
                        <label htmlFor="faculty-code" className="block text-xs font-semibold text-[#0b1c30]">
                            Mã Khoa / Viện <span className="text-[#ba1a1a]">*</span>
                        </label>
                        <input
                            id="faculty-code"
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                            placeholder="VD: CNTT, KT, DT, SAMI"
                            maxLength={15}
                            className={`w-full px-3 py-2 text-sm font-mono uppercase rounded-xl border bg-white text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] ${
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

                    <div className="space-y-1.5">
                        <label htmlFor="faculty-name" className="block text-xs font-semibold text-[#0b1c30]">
                            Tên Khoa / Viện <span className="text-[#ba1a1a]">*</span>
                        </label>
                        <input
                            id="faculty-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="VD: Công nghệ thông tin, Viện Toán ứng dụng..."
                            className={`w-full px-3 py-2 text-sm rounded-xl border bg-white text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] ${
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

                    {/* Ghi chú / Mô tả */}
                    <div className="space-y-1.5">
                        <label htmlFor="faculty-desc" className="block text-xs font-semibold text-[#0b1c30]">
                            Mô tả / Ghi chú (tùy chọn)
                        </label>
                        <textarea
                            id="faculty-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            placeholder="Thông tin thêm về viện/khoa..."
                            className="w-full px-3 py-2 text-sm rounded-xl border border-[#cbd5e1] bg-white text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                        />
                    </div>

                    {/* Footer buttons */}
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
                            {initialData ? 'Lưu thay đổi' : 'Tạo Khoa mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
