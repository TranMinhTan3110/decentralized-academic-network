import React, { useState, useEffect } from 'react';
import { X, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import type { SchoolData } from './SchoolModal';
import type { FacultyData } from './FacultyModal';

export interface SubjectData {
    id: string;
    code: string;
    name: string;
    schoolId: string;
    facultyId: string;
    facultyCode: string;
    credits: number;
    description?: string;
}

interface SubjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (subject: SubjectData) => void;
    initialData?: SubjectData | null;
    schools: SchoolData[];
    faculties: FacultyData[];
    defaultSchoolId?: string;
    defaultFacultyId?: string;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    schools,
    faculties,
    defaultSchoolId,
    defaultFacultyId,
}) => {
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [schoolId, setSchoolId] = useState('');
    const [facultyId, setFacultyId] = useState('');
    const [credits, setCredits] = useState<number>(3);
    const [description, setDescription] = useState('');
    const [errors, setErrors] = useState<{ code?: string; name?: string; schoolId?: string; facultyId?: string }>({});

    // Filter faculties belonging to selected school
    const availableFaculties = faculties.filter((f) => !schoolId || f.schoolId === schoolId);

    useEffect(() => {
        if (initialData) {
            setCode(initialData.code || '');
            setName(initialData.name || '');
            setSchoolId(initialData.schoolId || (schools[0]?.id ?? ''));
            setFacultyId(initialData.facultyId || '');
            setCredits(initialData.credits ?? 3);
            setDescription(initialData.description || '');
        } else {
            const initialSchool = defaultSchoolId || (schools[0]?.id ?? '');
            setCode('');
            setName('');
            setSchoolId(initialSchool);
            const defaultFac = faculties.find((f) => f.schoolId === initialSchool);
            setFacultyId(defaultFacultyId || defaultFac?.id || faculties[0]?.id || '');
            setCredits(3);
            setDescription('');
        }
        setErrors({});
    }, [initialData, isOpen, schools, faculties, defaultSchoolId, defaultFacultyId]);

    // Handle school change -> auto-select first faculty of new school
    const handleSchoolChange = (newSchoolId: string) => {
        setSchoolId(newSchoolId);
        const match = faculties.find((f) => f.schoolId === newSchoolId);
        setFacultyId(match ? match.id : '');
    };

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
        const newErrors: { code?: string; name?: string; schoolId?: string; facultyId?: string } = {};
        if (!code.trim()) {
            newErrors.code = 'Vui lòng nhập mã môn học (VD: INT1332, IT3011)';
        }
        if (!name.trim()) {
            newErrors.name = 'Vui lòng nhập tên môn học';
        }
        if (!schoolId) {
            newErrors.schoolId = 'Vui lòng chọn trường';
        }
        if (!facultyId) {
            newErrors.facultyId = 'Vui lòng chọn khoa / viện phụ trách';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const facultyObj = faculties.find((f) => f.id === facultyId);

        const payload: SubjectData = {
            id: initialData?.id || `${schoolId}-${facultyId}-${code.trim().toLowerCase()}`,
            code: code.trim().toUpperCase(),
            name: name.trim(),
            schoolId,
            facultyId,
            facultyCode: facultyObj?.code || 'CNTT',
            credits: Number(credits) || 3,
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
            aria-labelledby="subject-modal-title"
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
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 id="subject-modal-title" className="text-lg font-bold text-[#0b1c30]">
                                {initialData ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
                            </h2>
                            <p className="text-xs text-[#5a6a80]">
                                Quản lý học phần / môn học và số tín chỉ đào tạo
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
                    {/* Chọn trường & Khoa */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label htmlFor="subject-school" className="block text-xs font-semibold text-[#0b1c30]">
                                Trường đại học <span className="text-[#ba1a1a]">*</span>
                            </label>
                            <select
                                id="subject-school"
                                value={schoolId}
                                onChange={(e) => handleSchoolChange(e.target.value)}
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
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="subject-faculty" className="block text-xs font-semibold text-[#0b1c30]">
                                Khoa / Viện phụ trách <span className="text-[#ba1a1a]">*</span>
                            </label>
                            <select
                                id="subject-faculty"
                                value={facultyId}
                                onChange={(e) => setFacultyId(e.target.value)}
                                className={`w-full px-3 py-2 text-sm rounded-xl border bg-white text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] ${
                                    errors.facultyId ? 'border-[#ba1a1a] bg-[#fff5f4]' : 'border-[#cbd5e1]'
                                }`}
                            >
                                {availableFaculties.length === 0 ? (
                                    <option value="">(Chưa có khoa nào)</option>
                                ) : (
                                    availableFaculties.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.code} - {f.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Mã môn & Số tín chỉ */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 space-y-1.5">
                            <label htmlFor="subject-code" className="block text-xs font-semibold text-[#0b1c30]">
                                Mã môn học <span className="text-[#ba1a1a]">*</span>
                            </label>
                            <input
                                id="subject-code"
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                                placeholder="VD: INT1332, INT1306"
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
                            <label htmlFor="subject-credits" className="block text-xs font-semibold text-[#0b1c30]">
                                Số tín chỉ
                            </label>
                            <input
                                id="subject-credits"
                                type="number"
                                min={1}
                                max={10}
                                value={credits}
                                onChange={(e) => setCredits(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full px-3 py-2 text-sm font-bold text-center rounded-xl border border-[#cbd5e1] bg-white text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                            />
                        </div>
                    </div>

                    {/* Tên môn học */}
                    <div className="space-y-1.5">
                        <label htmlFor="subject-name" className="block text-xs font-semibold text-[#0b1c30]">
                            Tên môn học <span className="text-[#ba1a1a]">*</span>
                        </label>
                        <input
                            id="subject-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="VD: Lập trình mạng, Cấu trúc dữ liệu..."
                            className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] ${
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

                    {/* Footer */}
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
                            {initialData ? 'Lưu thay đổi' : 'Tạo môn học mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
