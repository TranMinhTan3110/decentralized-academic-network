import { useState, useMemo } from 'react';
import {
    Plus,
    Search,
    MapPin,
    Building2,
    FileText,
    Pencil,
    Trash2,
    BookOpen,
    FolderTree,
    CheckCircle2,
} from 'lucide-react';
import { AdminLayout } from '../../../components/admin';
import { SchoolModal, type SchoolData } from './components/SchoolModal';
import { FacultyModal, type FacultyData } from './components/FacultyModal';
import { SubjectModal, type SubjectData } from './components/SubjectModal';
import { ConfirmModal } from '../../../components/ui';

// Mock initial schools
const initialSchools: SchoolData[] = [
    {
        id: 'hust',
        code: 'HUST',
        name: 'ĐH Bách Khoa Hà Nội',
        short: 'HU',
        city: 'Hà Nội',
        facultyCount: 16,
        documentCount: 38420,
    },
    {
        id: 'neu',
        code: 'NEU',
        name: 'ĐH Kinh tế Quốc dân',
        short: 'NE',
        city: 'Hà Nội',
        facultyCount: 14,
        documentCount: 24115,
    },
    {
        id: 'ftu',
        code: 'FTU',
        name: 'ĐH Ngoại thương',
        short: 'FT',
        city: 'Hà Nội',
        facultyCount: 11,
        documentCount: 19872,
    },
    {
        id: 'ueh',
        code: 'UEH',
        name: 'ĐH Kinh tế TP.HCM',
        short: 'UE',
        city: 'TP. Hồ Chí Minh',
        facultyCount: 15,
        documentCount: 27640,
    },
    {
        id: 'ptit',
        code: 'PTIT',
        name: 'Học viện Bưu chính Viễn thông',
        short: 'PT',
        city: 'Hà Nội',
        facultyCount: 9,
        documentCount: 32533,
    },
    {
        id: 'new1',
        code: 'NEW1',
        name: 'Trường mới #1',
        short: 'NE',
        city: 'Chưa cập nhật',
        facultyCount: 0,
        documentCount: 0,
    },
    {
        id: 'new2',
        code: 'NEW2',
        name: 'Trường mới #2',
        short: 'NE',
        city: 'Chưa cập nhật',
        facultyCount: 0,
        documentCount: 0,
    },
];

// Initial faculties reflecting user screenshot (HUST has CNTT, KT, DT)
const initialFaculties: FacultyData[] = [
    {
        id: 'hust-cntt',
        code: 'CNTT',
        name: 'Công nghệ thông tin',
        schoolId: 'hust',
        schoolName: 'HUST - ĐH Bách Khoa Hà Nội',
        subjectCount: 42,
    },
    {
        id: 'hust-kt',
        code: 'KT',
        name: 'Kinh tế',
        schoolId: 'hust',
        schoolName: 'HUST - ĐH Bách Khoa Hà Nội',
        subjectCount: 36,
    },
    {
        id: 'hust-dt',
        code: 'DT',
        name: 'Điện tử viễn thông',
        schoolId: 'hust',
        schoolName: 'HUST - ĐH Bách Khoa Hà Nội',
        subjectCount: 29,
    },
    {
        id: 'neu-fbf',
        code: 'FBF',
        name: 'Viện Ngân hàng - Tài chính',
        schoolId: 'neu',
        schoolName: 'NEU - ĐH Kinh tế Quốc dân',
        subjectCount: 32,
    },
    {
        id: 'neu-mkt',
        code: 'MKT',
        name: 'Khoa Marketing',
        schoolId: 'neu',
        schoolName: 'NEU - ĐH Kinh tế Quốc dân',
        subjectCount: 26,
    },
    {
        id: 'ueh-isb',
        code: 'ISB',
        name: 'Viện Đào tạo Quốc tế',
        schoolId: 'ueh',
        schoolName: 'UEH - ĐH Kinh tế TP.HCM',
        subjectCount: 28,
    },
];

// Initial subjects reflecting user screenshot under HUST -> CNTT
const initialSubjects: SubjectData[] = [
    {
        id: 'sub-1',
        code: 'INT1332',
        name: 'Lập trình mạng',
        schoolId: 'hust',
        facultyId: 'hust-cntt',
        facultyCode: 'CNTT',
        credits: 3,
    },
    {
        id: 'sub-2',
        code: 'INT1306',
        name: 'Cấu trúc dữ liệu và giải thuật',
        schoolId: 'hust',
        facultyId: 'hust-cntt',
        facultyCode: 'CNTT',
        credits: 3,
    },
    {
        id: 'sub-3',
        code: 'INT1313',
        name: 'Cơ sở dữ liệu',
        schoolId: 'hust',
        facultyId: 'hust-cntt',
        facultyCode: 'CNTT',
        credits: 3,
    },
    {
        id: 'sub-4',
        code: 'INT1340',
        name: 'Nhập môn An toàn thông tin',
        schoolId: 'hust',
        facultyId: 'hust-cntt',
        facultyCode: 'CNTT',
        credits: 2,
    },
    {
        id: 'sub-5',
        code: 'KT201',
        name: 'Kinh tế vi mô',
        schoolId: 'hust',
        facultyId: 'hust-kt',
        facultyCode: 'KT',
        credits: 3,
    },
];

export function AdminTaxonomyPage() {
    const [activeTab, setActiveTab] = useState<'schools' | 'faculties' | 'subjects'>('schools');

    // State data
    const [schools, setSchools] = useState<SchoolData[]>(initialSchools);
    const [faculties, setFaculties] = useState<FacultyData[]>(initialFaculties);
    const [subjects, setSubjects] = useState<SubjectData[]>(initialSubjects);

    // Filters for School tab
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState('ALL');

    // Filter for Faculty tab
    const [selectedFacultySchoolId, setSelectedFacultySchoolId] = useState('hust');

    // Filters for Subject tab
    const [selectedSubjectSchoolId, setSelectedSubjectSchoolId] = useState('hust');
    const [selectedSubjectFacultyCode, setSelectedSubjectFacultyCode] = useState('CNTT');

    // Modals state
    const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
    const [editingSchool, setEditingSchool] = useState<SchoolData | null>(null);

    const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState<FacultyData | null>(null);

    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<SubjectData | null>(null);

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<{
        type: 'school' | 'faculty' | 'subject';
        id: string;
        name: string;
    } | null>(null);

    // Toast feedback
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Filtered schools
    const filteredSchools = useMemo(() => {
        return schools.filter((item) => {
            const query = searchTerm.toLowerCase().trim();
            const matchesQuery =
                !query ||
                item.code.toLowerCase().includes(query) ||
                item.name.toLowerCase().includes(query) ||
                item.city.toLowerCase().includes(query);

            const matchesCity = selectedCity === 'ALL' || item.city === selectedCity;

            return matchesQuery && matchesCity;
        });
    }, [schools, searchTerm, selectedCity]);

    // Unique cities for school filter
    const citiesList = useMemo(() => {
        const set = new Set<string>();
        schools.forEach((s) => {
            if (s.city && s.city !== 'Chưa cập nhật') {
                set.add(s.city);
            }
        });
        return Array.from(set);
    }, [schools]);

    // Faculties filtered by selected school in Faculty tab
    const filteredFaculties = useMemo(() => {
        return faculties.filter((f) => f.schoolId === selectedFacultySchoolId);
    }, [faculties, selectedFacultySchoolId]);

    // Faculties available for selected school in Subject tab
    const subjectTabFaculties = useMemo(() => {
        return faculties.filter((f) => f.schoolId === selectedSubjectSchoolId);
    }, [faculties, selectedSubjectSchoolId]);

    // Subjects filtered by selected school and faculty in Subject tab
    const filteredSubjects = useMemo(() => {
        return subjects.filter((s) => {
            const matchSchool = s.schoolId === selectedSubjectSchoolId;
            const matchFaculty =
                !selectedSubjectFacultyCode ||
                s.facultyCode === selectedSubjectFacultyCode;
            return matchSchool && matchFaculty;
        });
    }, [subjects, selectedSubjectSchoolId, selectedSubjectFacultyCode]);

    // Handler when school changes in Subject tab -> sync faculty dropdown
    const handleSubjectSchoolChange = (newSchoolId: string) => {
        setSelectedSubjectSchoolId(newSchoolId);
        const available = faculties.filter((f) => f.schoolId === newSchoolId);
        setSelectedSubjectFacultyCode(available[0]?.code || '');
    };

    // --- Save Handlers ---
    const handleSaveSchool = (data: SchoolData) => {
        if (editingSchool) {
            setSchools((prev) =>
                prev.map((item) => (item.id === editingSchool.id ? { ...item, ...data } : item))
            );
            showToast(`Đã cập nhật trường ${data.code} thành công!`);
        } else {
            setSchools((prev) => [data, ...prev]);
            showToast(`Đã thêm trường ${data.code} vào danh mục học thuật!`);
        }
        setEditingSchool(null);
    };

    const handleSaveFaculty = (data: FacultyData) => {
        if (editingFaculty) {
            setFaculties((prev) =>
                prev.map((item) => (item.id === editingFaculty.id ? { ...item, ...data } : item))
            );
            showToast(`Đã cập nhật Khoa / Viện ${data.code} thành công!`);
        } else {
            setFaculties((prev) => [data, ...prev]);
            // Increment school's facultyCount
            setSchools((prev) =>
                prev.map((s) =>
                    s.id === data.schoolId ? { ...s, facultyCount: (s.facultyCount ?? 0) + 1 } : s
                )
            );
            showToast(`Đã thêm Khoa / Viện ${data.code} thành công!`);
        }
        setEditingFaculty(null);
    };

    const handleSaveSubject = (data: SubjectData) => {
        if (editingSubject) {
            setSubjects((prev) =>
                prev.map((item) => (item.id === editingSubject.id ? { ...item, ...data } : item))
            );
            showToast(`Đã cập nhật môn học ${data.code} thành công!`);
        } else {
            setSubjects((prev) => [data, ...prev]);
            // Increment faculty's subjectCount
            setFaculties((prev) =>
                prev.map((f) =>
                    f.id === data.facultyId ? { ...f, subjectCount: (f.subjectCount ?? 0) + 1 } : f
                )
            );
            showToast(`Đã thêm môn học ${data.code} thành công!`);
        }
        setEditingSubject(null);
    };

    // Delete handler
    const handleConfirmDelete = () => {
        if (!deleteTarget) return;

        if (deleteTarget.type === 'school') {
            setSchools((prev) => prev.filter((s) => s.id !== deleteTarget.id));
            showToast(`Đã xóa trường ${deleteTarget.name}!`);
        } else if (deleteTarget.type === 'faculty') {
            setFaculties((prev) => prev.filter((f) => f.id !== deleteTarget.id));
            showToast(`Đã xóa khoa ${deleteTarget.name}!`);
        } else if (deleteTarget.type === 'subject') {
            setSubjects((prev) => prev.filter((s) => s.id !== deleteTarget.id));
            showToast(`Đã xóa môn học ${deleteTarget.name}!`);
        }
        setDeleteTarget(null);
    };

    // Top action button dynamically changes with activeTab
    const renderActionButton = () => {
        if (activeTab === 'schools') {
            return (
                <button
                    type="button"
                    onClick={() => {
                        setEditingSchool(null);
                        setIsSchoolModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#0051d5] hover:bg-[#0041ab] active:bg-[#00368c] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0051d5]/40"
                >
                    <Plus className="w-4 h-4" />
                    <span>Thêm trường mới</span>
                </button>
            );
        }
        if (activeTab === 'faculties') {
            return (
                <button
                    type="button"
                    onClick={() => {
                        setEditingFaculty(null);
                        setIsFacultyModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#0051d5] hover:bg-[#0041ab] active:bg-[#00368c] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0051d5]/40"
                >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Khoa mới</span>
                </button>
            );
        }
        return (
            <button
                type="button"
                onClick={() => {
                    setEditingSubject(null);
                    setIsSubjectModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#0051d5] hover:bg-[#0041ab] active:bg-[#00368c] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0051d5]/40"
            >
                <Plus className="w-4 h-4" />
                <span>Thêm môn học mới</span>
            </button>
        );
    };

    return (
        <AdminLayout
            breadcrumb="Admin / Danh mục học thuật"
            title="Quản lý danh mục học thuật"
            subtitle="Trường đại học → Khoa / Viện → Môn học"
            actions={renderActionButton()}
        >
            {/* Feedback notification toast */}
            {toastMessage && (
                <div className="bg-[#effcf5] border border-[#a6f0cc] text-[#007a52] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-all">
                    <CheckCircle2 className="w-4 h-4 text-[#009668]" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Navigation Tabs with horizontal scrollbar for small screens */}
            <div className="overflow-x-auto overflow-y-hidden border-b border-[#e2e8f0] pb-px scroll-smooth">
                <div className="flex items-center gap-1 sm:gap-2 min-w-max">
                    <button
                        type="button"
                        onClick={() => setActiveTab('schools')}
                        className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                            activeTab === 'schools'
                                ? 'border-[#0051d5] text-[#0051d5]'
                                : 'border-transparent text-[#5a6a80] hover:text-[#0b1c30] hover:border-[#cbd5e1]'
                        }`}
                    >
                        <Building2 className="w-4 h-4 shrink-0" />
                        <span>Trường Đại học</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#eff4ff] text-[#0051d5]">
                            {schools.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('faculties')}
                        className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                            activeTab === 'faculties'
                                ? 'border-[#0051d5] text-[#0051d5]'
                                : 'border-transparent text-[#5a6a80] hover:text-[#0b1c30] hover:border-[#cbd5e1]'
                        }`}
                    >
                        <FolderTree className="w-4 h-4 shrink-0" />
                        <span>Khoa / Viện</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#f1f5f9] text-[#5a6a80]">
                            {faculties.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('subjects')}
                        className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                            activeTab === 'subjects'
                                ? 'border-[#0051d5] text-[#0051d5]'
                                : 'border-transparent text-[#5a6a80] hover:text-[#0b1c30] hover:border-[#cbd5e1]'
                        }`}
                    >
                        <BookOpen className="w-4 h-4 shrink-0" />
                        <span>Môn học</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#f1f5f9] text-[#5a6a80]">
                            {subjects.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* TAB 1: Trường Đại học */}
            {activeTab === 'schools' && (
                <div className="bg-white border border-[#dce9ff] rounded-2xl shadow-2xs overflow-hidden flex flex-col">
                    {/* Table Filter & Search Toolbar */}
                    <div className="p-4 sm:p-5 border-b border-[#e2e8f0] bg-[#fafcff] flex flex-wrap gap-3 items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Tìm mã trường, tên trường, tỉnh thành..."
                                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#cbd5e1] bg-white text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                                />
                            </div>

                            <select
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#cbd5e1] bg-white text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                            >
                                <option value="ALL">Tất cả thành phố</option>
                                {citiesList.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="text-xs text-[#5a6a80] font-medium">
                            Hiển thị <span className="font-bold text-[#0b1c30]">{filteredSchools.length}</span> / {schools.length} trường
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto min-w-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] bg-[#f8fafd] text-[11px] font-bold text-[#5a6a80] uppercase tracking-wider">
                                    <th className="py-3.5 px-4 sm:px-6">Mã trường</th>
                                    <th className="py-3.5 px-4 sm:px-6">Tên trường</th>
                                    <th className="py-3.5 px-4 sm:px-6">Thành phố</th>
                                    <th className="py-3.5 px-4 sm:px-6 text-center">Khoa / Viện</th>
                                    <th className="py-3.5 px-4 sm:px-6 text-right">Tài liệu</th>
                                    <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#edf2f7] text-xs sm:text-sm">
                                {filteredSchools.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-[#5a6a80]">
                                            <Building2 className="w-8 h-8 text-[#cbd5e1] mx-auto mb-2" />
                                            <p className="font-semibold text-[#0b1c30]">Không tìm thấy trường nào phù hợp</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSchools.map((school) => (
                                        <tr
                                            key={school.id}
                                            className="hover:bg-[#f8faff] transition-colors group"
                                        >
                                            <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#eff4ff] text-[#0051d5] border border-[#cbe0ff]">
                                                    {school.code}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 sm:px-6">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-9 h-9 rounded-full bg-[#eff4ff] border border-[#cbe0ff] text-[#0051d5] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs"
                                                        aria-hidden="true"
                                                    >
                                                        {school.short || school.code.slice(0, 2)}
                                                    </div>
                                                    <div className="font-bold text-[#0b1c30] group-hover:text-[#0051d5] transition-colors">
                                                        {school.name}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-[#0b1c30]">
                                                <span className="flex items-center gap-1.5 text-xs text-[#5a6a80]">
                                                    <MapPin className="w-3.5 h-3.5 text-[#94a3b8]" />
                                                    {school.city}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 sm:px-6 text-center whitespace-nowrap">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-[#f1f5f9] text-[#0b1c30]">
                                                    {school.facultyCount ?? 0} Khoa
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap font-semibold text-[#0b1c30]">
                                                <span className="inline-flex items-center gap-1 text-xs">
                                                    <FileText className="w-3.5 h-3.5 text-[#5a6a80]" />
                                                    {school.documentCount.toLocaleString('vi-VN')}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingSchool(school);
                                                            setIsSchoolModalOpen(true);
                                                        }}
                                                        className="p-1.5 rounded-lg text-[#5a6a80] hover:text-[#0051d5] hover:bg-[#eff4ff] transition-colors cursor-pointer"
                                                        title="Chỉnh sửa thông tin trường"
                                                        aria-label={`Chỉnh sửa ${school.name}`}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDeleteTarget({
                                                                type: 'school',
                                                                id: school.id,
                                                                name: school.name,
                                                            })
                                                        }
                                                        className="p-1.5 rounded-lg text-[#5a6a80] hover:text-[#ba1a1a] hover:bg-[#fff5f4] transition-colors cursor-pointer"
                                                        title="Xóa trường khỏi danh mục"
                                                        aria-label={`Xóa ${school.name}`}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: Khoa / Viện */}
            {activeTab === 'faculties' && (
                <div className="bg-white border border-[#dce9ff] rounded-2xl shadow-2xs overflow-hidden flex flex-col">
                    {/* Top dropdown: Select School */}
                    <div className="p-4 sm:p-5 border-b border-[#e2e8f0] bg-[#fafcff]">
                        <label htmlFor="select-faculty-school" className="sr-only">
                            Chọn trường đại học
                        </label>
                        <select
                            id="select-faculty-school"
                            value={selectedFacultySchoolId}
                            onChange={(e) => setSelectedFacultySchoolId(e.target.value)}
                            className="w-full px-4 py-3 text-sm font-semibold rounded-xl border border-[#cbd5e1] bg-white text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                        >
                            {schools.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.code} · {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] bg-[#f8fafd] text-[11px] font-bold text-[#5a6a80] uppercase tracking-wider">
                                    <th className="py-3.5 px-4 sm:px-6">Mã khoa</th>
                                    <th className="py-3.5 px-4 sm:px-6">Tên Khoa / Viện</th>
                                    <th className="py-3.5 px-4 sm:px-6">Số môn học</th>
                                    <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#edf2f7] text-xs sm:text-sm">
                                {filteredFaculties.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-[#5a6a80]">
                                            <FolderTree className="w-8 h-8 text-[#cbd5e1] mx-auto mb-2" />
                                            <p className="font-semibold text-[#0b1c30]">Chưa có Khoa / Viện nào thuộc trường này</p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingFaculty(null);
                                                    setIsFacultyModalOpen(true);
                                                }}
                                                className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0051d5] text-white inline-flex items-center gap-1 cursor-pointer"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Thêm Khoa mới ngay</span>
                                            </button>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredFaculties.map((f) => (
                                        <tr key={f.id} className="hover:bg-[#f8faff] transition-colors group">
                                            <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#eff4ff] text-[#0051d5] border border-[#cbe0ff]">
                                                    {f.code}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 sm:px-6 font-bold text-[#0b1c30]">
                                                {f.name}
                                            </td>

                                            <td className="py-3.5 px-4 sm:px-6 text-[#0b1c30] font-medium">
                                                {f.subjectCount} môn
                                            </td>

                                            <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingFaculty(f);
                                                            setIsFacultyModalOpen(true);
                                                        }}
                                                        className="p-1.5 rounded-lg text-[#5a6a80] hover:text-[#0051d5] hover:bg-[#eff4ff] transition-colors cursor-pointer"
                                                        title="Chỉnh sửa Khoa / Viện"
                                                        aria-label={`Chỉnh sửa ${f.name}`}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDeleteTarget({
                                                                type: 'faculty',
                                                                id: f.id,
                                                                name: f.name,
                                                            })
                                                        }
                                                        className="p-1.5 rounded-lg text-[#5a6a80] hover:text-[#ba1a1a] hover:bg-[#fff5f4] transition-colors cursor-pointer"
                                                        title="Xóa Khoa / Viện"
                                                        aria-label={`Xóa ${f.name}`}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: Môn học */}
            {activeTab === 'subjects' && (
                <div className="bg-white border border-[#dce9ff] rounded-2xl shadow-2xs overflow-hidden flex flex-col">
                    {/* Top 2 side-by-side dropdown filters: School & Faculty */}
                    <div className="p-4 sm:p-5 border-b border-[#e2e8f0] bg-[#fafcff] grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="select-subject-school" className="sr-only">
                                Chọn trường
                            </label>
                            <select
                                id="select-subject-school"
                                value={selectedSubjectSchoolId}
                                onChange={(e) => handleSubjectSchoolChange(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-[#cbd5e1] bg-white text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                            >
                                {schools.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.code}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="select-subject-faculty" className="sr-only">
                                Chọn khoa
                            </label>
                            <select
                                id="select-subject-faculty"
                                value={selectedSubjectFacultyCode}
                                onChange={(e) => setSelectedSubjectFacultyCode(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-[#cbd5e1] bg-white text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                            >
                                {subjectTabFaculties.length === 0 ? (
                                    <option value="">(Chưa có khoa nào)</option>
                                ) : (
                                    subjectTabFaculties.map((f) => (
                                        <option key={f.id} value={f.code}>
                                            {f.code}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] bg-[#f8fafd] text-[11px] font-bold text-[#5a6a80] uppercase tracking-wider">
                                    <th className="py-3.5 px-4 sm:px-6">Mã môn</th>
                                    <th className="py-3.5 px-4 sm:px-6">Tên môn học</th>
                                    <th className="py-3.5 px-4 sm:px-6">Tín chỉ</th>
                                    <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#edf2f7] text-xs sm:text-sm">
                                {filteredSubjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-[#5a6a80]">
                                            <BookOpen className="w-8 h-8 text-[#cbd5e1] mx-auto mb-2" />
                                            <p className="font-semibold text-[#0b1c30]">Chưa có môn học nào thuộc khoa này</p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingSubject(null);
                                                    setIsSubjectModalOpen(true);
                                                }}
                                                className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0051d5] text-white inline-flex items-center gap-1 cursor-pointer"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Thêm môn học mới</span>
                                            </button>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSubjects.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-[#f8faff] transition-colors group">
                                            <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap font-mono font-bold text-[#0051d5]">
                                                {sub.code}
                                            </td>

                                            <td className="py-3.5 px-4 sm:px-6 font-bold text-[#0b1c30]">
                                                {sub.name}
                                            </td>

                                            <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#0b1c30]">
                                                {sub.credits}
                                            </td>

                                            <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingSubject(sub);
                                                            setIsSubjectModalOpen(true);
                                                        }}
                                                        className="p-1.5 rounded-lg text-[#5a6a80] hover:text-[#0051d5] hover:bg-[#eff4ff] transition-colors cursor-pointer"
                                                        title="Chỉnh sửa môn học"
                                                        aria-label={`Chỉnh sửa ${sub.name}`}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDeleteTarget({
                                                                type: 'subject',
                                                                id: sub.id,
                                                                name: sub.name,
                                                            })
                                                        }
                                                        className="p-1.5 rounded-lg text-[#5a6a80] hover:text-[#ba1a1a] hover:bg-[#fff5f4] transition-colors cursor-pointer"
                                                        title="Xóa môn học"
                                                        aria-label={`Xóa ${sub.name}`}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal: Thêm / Sửa Trường học */}
            <SchoolModal
                isOpen={isSchoolModalOpen}
                onClose={() => {
                    setIsSchoolModalOpen(false);
                    setEditingSchool(null);
                }}
                onSubmit={handleSaveSchool}
                initialData={editingSchool}
            />

            {/* Modal: Thêm / Sửa Khoa / Viện */}
            <FacultyModal
                isOpen={isFacultyModalOpen}
                onClose={() => {
                    setIsFacultyModalOpen(false);
                    setEditingFaculty(null);
                }}
                onSubmit={handleSaveFaculty}
                initialData={editingFaculty}
                schools={schools}
                defaultSchoolId={selectedFacultySchoolId}
            />

            {/* Modal: Thêm / Sửa Môn học */}
            <SubjectModal
                isOpen={isSubjectModalOpen}
                onClose={() => {
                    setIsSubjectModalOpen(false);
                    setEditingSubject(null);
                }}
                onSubmit={handleSaveSubject}
                initialData={editingSubject}
                schools={schools}
                faculties={faculties}
                defaultSchoolId={selectedSubjectSchoolId}
                defaultFacultyId={subjectTabFaculties[0]?.id}
            />

            {/* Modal: Xác nhận xóa */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                title={`Xóa ${
                    deleteTarget?.type === 'school'
                        ? 'trường đại học'
                        : deleteTarget?.type === 'faculty'
                        ? 'Khoa / Viện'
                        : 'môn học'
                }?`}
                description={`Bạn có chắc chắn muốn xóa "${deleteTarget?.name}"? Thao tác này không thể hoàn tác.`}
                confirmText="Xác nhận xóa"
                cancelText="Hủy bỏ"
                variant="danger"
            />
        </AdminLayout>
    );
}
