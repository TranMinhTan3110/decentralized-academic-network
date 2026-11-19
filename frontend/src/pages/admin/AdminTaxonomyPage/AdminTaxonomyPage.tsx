import { useState, useMemo, useEffect } from 'react';
import {
    Plus,
    Search,
    MapPin,
    Building2,
    Pencil,
    Trash2,
    BookOpen,
    FolderTree,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { AdminLayout } from '../../../components/admin';
import { SchoolModal, VIETNAM_CITIES, type SchoolData } from './components/SchoolModal';
import { FacultyModal, type FacultyData } from './components/FacultyModal';
import { SubjectModal, type SubjectData } from './components/SubjectModal';
import { ConfirmModal } from '../../../components/ui';
import { taxonomyService } from '../../../services/taxonomyService';

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
        id: 'uet',
        code: 'UET',
        name: 'ĐH Công nghệ - ĐHQGHN',
        short: 'UE',
        city: 'Hà Nội',
        facultyCount: 8,
        documentCount: 18240,
    },
    {
        id: 'utc',
        code: 'UTC',
        name: 'ĐH Giao thông Vận tải (UTC / UTC2)',
        short: 'UT',
        city: 'Hà Nội',
        facultyCount: 12,
        documentCount: 15680,
    },
    {
        id: 'uit',
        code: 'UIT',
        name: 'ĐH Công nghệ Thông tin - ĐHQG TP.HCM',
        short: 'UI',
        city: 'TP. Hồ Chí Minh',
        facultyCount: 7,
        documentCount: 14350,
    },
    {
        id: 'ussh',
        code: 'USSH',
        name: 'ĐH Khoa học Xã hội & Nhân văn',
        short: 'US',
        city: 'Hà Nội',
        facultyCount: 16,
        documentCount: 11200,
    },
    {
        id: 'dav',
        code: 'DAV',
        name: 'Học viện Ngoại giao',
        short: 'DA',
        city: 'Hà Nội',
        facultyCount: 6,
        documentCount: 9480,
    },
];

// Initial faculties catalog (fallback & test data; live data is loaded from backend V10 seed)
const initialFaculties: FacultyData[] = [
    { id: 'cntt', code: 'CNTT', name: 'Công nghệ thông tin', description: 'Đào tạo Công nghệ thông tin và hệ thống máy tính' },
    { id: 'khmt', code: 'KHMT', name: 'Khoa học máy tính', description: 'Đào tạo thuật toán, trí tuệ nhân tạo và tính toán' },
    { id: 'ktpm', code: 'KTPM', name: 'Kỹ thuật phần mềm', description: 'Đào tạo quy trình phát triển và kiểm thử phần mềm' },
    { id: 'httt', code: 'HTTT', name: 'Hệ thống thông tin', description: 'Đào tạo phân tích, thiết kế và quản trị hệ thống thông tin' },
    { id: 'ttnt', code: 'TTNT', name: 'Trí tuệ nhân tạo & Khoa học dữ liệu', description: 'Đào tạo AI, Học máy, NLP và Dữ liệu lớn' },
    { id: 'attt', code: 'ATTT', name: 'An toàn thông tin', description: 'Đào tạo an ninh mạng, mật mã học và bảo mật hệ thống' },
    { id: 'mmt', code: 'MMT', name: 'Mạng máy tính & Truyền thông', description: 'Đào tạo hạ tầng mạng và điện toán đám mây' },
    { id: 'ktmt', code: 'KTMT', name: 'Kỹ thuật máy tính', description: 'Đào tạo hệ thống nhúng, vi mạch và kiến trúc máy tính' },
    { id: 'dien', code: 'DIEN', name: 'Kỹ thuật Điện - Điện tử', description: 'Đào tạo hệ thống điện và năng lượng tái tạo' },
    { id: 'dt', code: 'DT', name: 'Điện tử viễn thông', description: 'Đào tạo mạch điện tử, xử lý tín hiệu và viễn thông' },
    { id: 'tdh', code: 'TDH', name: 'Tự động hóa & Điều khiển', description: 'Đào tạo điều khiển tự động, robot và đo lường' },
    { id: 'cokhi', code: 'COKHI', name: 'Cơ khí & Chế tạo máy', description: 'Đào tạo chế tạo máy và cơ khí động lực' },
    { id: 'cdt', code: 'CDT', name: 'Cơ điện tử', description: 'Đào tạo hệ thống cơ điện tử thông minh' },
    { id: 'oto', code: 'OTO', name: 'Kỹ thuật Ô tô & Máy động lực', description: 'Đào tạo công nghệ ô tô và động cơ' },
    { id: 'xddd', code: 'XDDD', name: 'Xây dựng Dân dụng & Công nghiệp', description: 'Đào tạo kết cấu công trình và quản lý xây dựng' },
    { id: 'cauduong', code: 'CAUDUONG', name: 'Kỹ thuật Cầu đường & Giao thông', description: 'Đào tạo hạ tầng giao thông, cầu hầm' },
    { id: 'kientruc', code: 'KIENTRUC', name: 'Kiến trúc & Quy hoạch', description: 'Đào tạo thiết kế kiến trúc và quy hoạch đô thị' },
    { id: 'kthh', code: 'KTHH', name: 'Hóa học & Kỹ thuật Hóa học', description: 'Đào tạo công nghệ hóa học và hóa dầu' },
    { id: 'cntp', code: 'CNTP', name: 'Công nghệ Thực phẩm & Sinh học', description: 'Đào tạo chế biến thực phẩm và công nghệ sinh học' },
    { id: 'moitruong', code: 'MOITRUONG', name: 'Kỹ thuật Môi trường & Tài nguyên', description: 'Đào tạo quản lý môi trường và phát triển bền vững' },
    { id: 'kt', code: 'KT', name: 'Kinh tế & Quản lý', description: 'Đào tạo kinh tế học, kinh tế đầu tư và quản lý' },
    { id: 'qtkd', code: 'QTKD', name: 'Quản trị Kinh doanh', description: 'Đào tạo quản trị doanh nghiệp và chiến lược' },
    { id: 'tcnh', code: 'TCNH', name: 'Tài chính - Ngân hàng', description: 'Đào tạo tài chính doanh nghiệp, ngân hàng và đầu tư' },
    { id: 'ketoan', code: 'KETOAN', name: 'Kế toán - Kiểm toán', description: 'Đào tạo kế toán tài chính, quản trị và kiểm toán' },
    { id: 'ktqt', code: 'KTQT', name: 'Kinh tế Quốc tế & Ngoại thương', description: 'Đào tạo thương mại quốc tế và xuất nhập khẩu' },
    { id: 'mkt', code: 'MKT', name: 'Marketing', description: 'Đào tạo quản trị marketing và digital marketing' },
    { id: 'tmdt', code: 'TMDT', name: 'Thương mại điện tử & Kinh tế số', description: 'Đào tạo kinh doanh số và thương mại điện tử' },
    { id: 'logistics', code: 'LOGISTICS', name: 'Logistics & Quản lý Chuỗi cung ứng', description: 'Đào tạo vận tải, kho vận và chuỗi cung ứng' },
    { id: 'mis', code: 'MIS', name: 'Hệ thống Thông tin Quản lý', description: 'Đào tạo ERP và phân tích dữ liệu kinh doanh' },
    { id: 'toan', code: 'TOAN', name: 'Toán ứng dụng & Tin học', description: 'Đào tạo toán giải tích, đại số và xác suất thống kê' },
    { id: 'vatly', code: 'VATLY', name: 'Vật lý & Vật lý Kỹ thuật', description: 'Đào tạo vật lý đại cương, quang học và bán dẫn' },
    { id: 'ydakhoa', code: 'YDAKHOA', name: 'Y Đa khoa', description: 'Đào tạo bác sĩ đa khoa và lâm sàng' },
    { id: 'duoc', code: 'DUOC', name: 'Dược học', description: 'Đào tạo dược lý, hóa dược và dược lâm sàng' },
    { id: 'dieuduong', code: 'DIEUDUONG', name: 'Điều dưỡng & Kỹ thuật Y học', description: 'Đào tạo điều dưỡng và xét nghiệm y học' },
    { id: 'luat', code: 'LUAT', name: 'Luật & Luật Kinh tế', description: 'Đào tạo pháp luật dân sự, hình sự và thương mại' },
    { id: 'ngoaingu', code: 'NGOAINGU', name: 'Ngoại ngữ (Anh, Trung, Nhật, Hàn)', description: 'Đào tạo biên phiên dịch và ngôn ngữ quốc tế' },
    { id: 'supham', code: 'SUPHAM', name: 'Sư phạm & Khoa học Giáo dục', description: 'Đào tạo nghiệp vụ sư phạm và quản lý giáo dục' },
    { id: 'baochi', code: 'BAOCHI', name: 'Báo chí & Truyền thông', description: 'Đào tạo báo chí đa phương tiện và PR' },
    { id: 'qhqt', code: 'QHQT', name: 'Quan hệ Quốc tế & Ngoại giao', description: 'Đào tạo chính trị quốc tế và ngoại giao' },
    { id: 'dulich', code: 'DULICH', name: 'Du lịch & Quản trị Khách sạn', description: 'Đào tạo quản trị dịch vụ du lịch và lữ hành' },
    { id: 'llct', code: 'LLCT', name: 'Lý luận Chính trị', description: 'Đào tạo Triết học, Kinh tế chính trị, CNXHKH, Tư tưởng HCM' },
    { id: 'khcb', code: 'KHCB', name: 'Khoa học Cơ bản & Đại cương', description: 'Đào tạo các học phần đại cương' },
];

// Initial subjects covering common undergraduate, engineering, and business curricula
const initialSubjects: SubjectData[] = [
    // CNTT (HUST)
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
        code: 'INT1303',
        name: 'Lập trình hướng đối tượng (OOP)',
        schoolId: 'hust',
        facultyId: 'hust-cntt',
        facultyCode: 'CNTT',
        credits: 3,
    },
    {
        id: 'sub-6',
        code: 'INT1310',
        name: 'Hệ điều hành',
        schoolId: 'hust',
        facultyId: 'hust-cntt',
        facultyCode: 'CNTT',
        credits: 3,
    },
    {
        id: 'sub-7',
        code: 'INT1321',
        name: 'Kiến trúc máy tính',
        schoolId: 'hust',
        facultyId: 'hust-cntt',
        facultyCode: 'CNTT',
        credits: 3,
    },
    {
        id: 'sub-8',
        code: 'INT1358',
        name: 'Kỹ thuật phần mềm',
        schoolId: 'hust',
        facultyId: 'hust-cntt',
        facultyCode: 'CNTT',
        credits: 3,
    },
    {
        id: 'sub-9',
        code: 'INT1435',
        name: 'Phát triển ứng dụng Web',
        schoolId: 'hust',
        facultyId: 'hust-cntt',
        facultyCode: 'CNTT',
        credits: 3,
    },
    // Kinh tế (HUST KT & NEU)
    {
        id: 'sub-10',
        code: 'KT201',
        name: 'Kinh tế vi mô',
        schoolId: 'hust',
        facultyId: 'hust-kt',
        facultyCode: 'KT',
        credits: 3,
    },
    {
        id: 'sub-11',
        code: 'KT202',
        name: 'Kinh tế vĩ mô',
        schoolId: 'hust',
        facultyId: 'hust-kt',
        facultyCode: 'KT',
        credits: 3,
    },
    {
        id: 'sub-12',
        code: 'KT301',
        name: 'Nguyên lý kế toán',
        schoolId: 'hust',
        facultyId: 'hust-kt',
        facultyCode: 'KT',
        credits: 3,
    },
    {
        id: 'sub-13',
        code: 'KT305',
        name: 'Quản trị học đại cương',
        schoolId: 'hust',
        facultyId: 'hust-kt',
        facultyCode: 'KT',
        credits: 3,
    },
    // Toán & Khoa học cơ bản (HUST TOAN)
    {
        id: 'sub-14',
        code: 'MI1111',
        name: 'Giải tích 1',
        schoolId: 'hust',
        facultyId: 'hust-toan',
        facultyCode: 'TOAN',
        credits: 4,
    },
    {
        id: 'sub-15',
        code: 'MI1121',
        name: 'Giải tích 2',
        schoolId: 'hust',
        facultyId: 'hust-toan',
        facultyCode: 'TOAN',
        credits: 3,
    },
    {
        id: 'sub-16',
        code: 'MI1141',
        name: 'Đại số đại cương & Tuyến tính',
        schoolId: 'hust',
        facultyId: 'hust-toan',
        facultyCode: 'TOAN',
        credits: 3,
    },
    {
        id: 'sub-17',
        code: 'MI2020',
        name: 'Xác suất thống kê',
        schoolId: 'hust',
        facultyId: 'hust-toan',
        facultyCode: 'TOAN',
        credits: 3,
    },
    // Lý luận chính trị & Đại cương (HUST LLCT)
    {
        id: 'sub-18',
        code: 'SSH1111',
        name: 'Triết học Mác - Lênin',
        schoolId: 'hust',
        facultyId: 'hust-llct',
        facultyCode: 'LLCT',
        credits: 3,
    },
    {
        id: 'sub-19',
        code: 'SSH1121',
        name: 'Kinh tế chính trị Mác - Lênin',
        schoolId: 'hust',
        facultyId: 'hust-llct',
        facultyCode: 'LLCT',
        credits: 2,
    },
    {
        id: 'sub-20',
        code: 'SSH1050',
        name: 'Pháp luật đại cương',
        schoolId: 'hust',
        facultyId: 'hust-llct',
        facultyCode: 'LLCT',
        credits: 2,
    },
    // NEU & UEH
    {
        id: 'sub-21',
        code: 'FBF101',
        name: 'Thị trường tài chính và tiền tệ',
        schoolId: 'neu',
        facultyId: 'neu-fbf',
        facultyCode: 'FBF',
        credits: 3,
    },
    {
        id: 'sub-22',
        code: 'MKT101',
        name: 'Marketing căn bản',
        schoolId: 'neu',
        facultyId: 'neu-mkt',
        facultyCode: 'MKT',
        credits: 3,
    },
    {
        id: 'sub-23',
        code: 'ISB101',
        name: 'Giao tiếp kinh doanh quốc tế',
        schoolId: 'ueh',
        facultyId: 'ueh-isb',
        facultyCode: 'ISB',
        credits: 3,
    },
    // Điện tử viễn thông (HUST DT)
    {
        id: 'sub-24',
        code: 'ET2010',
        name: 'Kỹ thuật mạch điện tử',
        schoolId: 'hust',
        facultyId: 'hust-dt',
        facultyCode: 'DT',
        credits: 3,
    },
    {
        id: 'sub-25',
        code: 'ET3220',
        name: 'Xử lý tín hiệu số',
        schoolId: 'hust',
        facultyId: 'hust-dt',
        facultyCode: 'DT',
        credits: 3,
    },
];

export function AdminTaxonomyPage() {
    const [activeTab, setActiveTab] = useState<'schools' | 'faculties' | 'subjects'>('schools');

    // State data
    const [schools, setSchools] = useState<SchoolData[]>(initialSchools);
    const [faculties, setFaculties] = useState<FacultyData[]>(initialFaculties);
    const [subjects, setSubjects] = useState<SubjectData[]>(initialSubjects);

    const isTestEnv = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';

    // Load live taxonomy data from backend (universities, faculties, courses)
    useEffect(() => {
        if (isTestEnv) return;
        let cancelled = false;

        const loadAllTaxonomy = async () => {
            try {
                const [uniRes, facRes, courseRes] = await Promise.allSettled([
                    taxonomyService.getUniversities(),
                    taxonomyService.getFaculties(),
                    taxonomyService.getCourses(),
                ]);

                if (cancelled) return;

                if (uniRes.status === 'fulfilled' && Array.isArray(uniRes.value) && uniRes.value.length > 0) {
                    setSchools(
                        uniRes.value.map((u: any) => ({
                            id: String(u.id),
                            code: u.code || String(u.id).slice(0, 6).toUpperCase(),
                            name: u.name,
                            short: (u.code || u.name || 'DH').slice(0, 2).toUpperCase(),
                            city: u.city || 'Hà Nội',
                            documentCount: u.totalDocumentsCount ?? 0,
                        }))
                    );
                }

                if (facRes.status === 'fulfilled' && Array.isArray(facRes.value) && facRes.value.length > 0) {
                    setFaculties(
                        facRes.value.map((f: any) => ({
                            id: String(f.id),
                            code: f.code || String(f.id).slice(0, 6).toUpperCase(),
                            name: f.name,
                            description: f.description || '',
                        }))
                    );
                }

                if (courseRes.status === 'fulfilled' && Array.isArray(courseRes.value) && courseRes.value.length > 0) {
                    setSubjects(
                        courseRes.value.map((c: any) => ({
                            id: String(c.id),
                            code: c.code || String(c.id).slice(0, 6).toUpperCase(),
                            name: c.name,
                            area: c.area || 'Đại cương',
                            credits: c.credits ?? 3,
                            description: c.description || '',
                        }))
                    );
                }
            } catch {
                // Keep initial fallback list if backend is unreachable
            }
        };

        loadAllTaxonomy();
        return () => {
            cancelled = true;
        };
    }, [isTestEnv]);

    // Filters for School tab
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState('ALL');
    const [schoolPage, setSchoolPage] = useState(1);

    // Search filter for Faculty tab (search by code & name)
    const [facultySearchTerm, setFacultySearchTerm] = useState('');
    const [facultyPage, setFacultyPage] = useState(1);

    // Search filter for Subject tab (search by code & name)
    const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
    const [subjectPage, setSubjectPage] = useState(1);

    const ITEMS_PER_PAGE = 10;

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

    // Full 64 provinces/cities list for school filter
    const citiesList = useMemo(() => {
        const set = new Set<string>(VIETNAM_CITIES);
        schools.forEach((s) => {
            if (s.city && s.city !== 'Chưa cập nhật') {
                set.add(s.city);
            }
        });
        return Array.from(set);
    }, [schools]);

    // Faculties filtered by search term (code & name)
    const filteredFaculties = useMemo(() => {
        const query = facultySearchTerm.toLowerCase().trim();
        if (!query) return faculties;
        return faculties.filter(
            (f) =>
                f.code.toLowerCase().includes(query) ||
                f.name.toLowerCase().includes(query) ||
                (f.description && f.description.toLowerCase().includes(query))
        );
    }, [faculties, facultySearchTerm]);

    // Subjects filtered by search term (code & name)
    const filteredSubjects = useMemo(() => {
        const query = subjectSearchTerm.toLowerCase().trim();
        if (!query) return subjects;
        return subjects.filter(
            (s) =>
                s.code.toLowerCase().includes(query) ||
                s.name.toLowerCase().includes(query) ||
                (s.area && s.area.toLowerCase().includes(query))
        );
    }, [subjects, subjectSearchTerm]);

    // Pagination slices (10 items per page for all 3 tabs)
    const totalSchoolPages = Math.max(1, Math.ceil(filteredSchools.length / ITEMS_PER_PAGE));
    const safeSchoolPage = Math.min(schoolPage, totalSchoolPages);
    const paginatedSchools = useMemo(
        () => filteredSchools.slice((safeSchoolPage - 1) * ITEMS_PER_PAGE, safeSchoolPage * ITEMS_PER_PAGE),
        [filteredSchools, safeSchoolPage]
    );

    const totalFacultyPages = Math.max(1, Math.ceil(filteredFaculties.length / ITEMS_PER_PAGE));
    const safeFacultyPage = Math.min(facultyPage, totalFacultyPages);
    const paginatedFaculties = useMemo(
        () => filteredFaculties.slice((safeFacultyPage - 1) * ITEMS_PER_PAGE, safeFacultyPage * ITEMS_PER_PAGE),
        [filteredFaculties, safeFacultyPage]
    );

    const totalSubjectPages = Math.max(1, Math.ceil(filteredSubjects.length / ITEMS_PER_PAGE));
    const safeSubjectPage = Math.min(subjectPage, totalSubjectPages);
    const paginatedSubjects = useMemo(
        () => filteredSubjects.slice((safeSubjectPage - 1) * ITEMS_PER_PAGE, safeSubjectPage * ITEMS_PER_PAGE),
        [filteredSubjects, safeSubjectPage]
    );

    const renderPaginationBar = (
        currentPage: number,
        totalPages: number,
        totalItems: number,
        unitLabel: string,
        onPageChange: (page: number) => void
    ) => {
        if (totalItems === 0) return null;
        const startIdx = (currentPage - 1) * ITEMS_PER_PAGE + 1;
        const endIdx = Math.min(totalItems, currentPage * ITEMS_PER_PAGE);

        const getPageNumbers = (): (number | 'ellipsis')[] => {
            if (totalPages <= 7) {
                return Array.from({ length: totalPages }, (_, i) => i + 1);
            }
            const pages: (number | 'ellipsis')[] = [1];
            if (currentPage > 3) pages.push('ellipsis');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let p = start; p <= end; p++) pages.push(p);
            if (currentPage < totalPages - 2) pages.push('ellipsis');
            pages.push(totalPages);
            return pages;
        };

        return (
            <div className="px-4 sm:px-6 py-3.5 border-t border-[#e2e8f0] bg-[#fafcff] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-[#5a6a80] font-medium">
                    Hiển thị <span className="font-bold text-[#0b1c30]">{startIdx}–{endIdx}</span> trong tổng số{' '}
                    <span className="font-bold text-[#0b1c30]">{totalItems}</span> {unitLabel} (Trang {currentPage}/{totalPages})
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                        aria-label="Trang trước"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#cbd5e1] bg-white text-[#0b1c30] font-semibold hover:bg-[#eff4ff] hover:text-[#0051d5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Trước</span>
                    </button>

                    {getPageNumbers().map((p, idx) =>
                        p === 'ellipsis' ? (
                            <span key={`el-${idx}`} className="px-1.5 text-[#94a3b8] select-none">
                                ...
                            </span>
                        ) : (
                            <button
                                key={p}
                                type="button"
                                onClick={() => onPageChange(p)}
                                aria-current={p === currentPage ? 'page' : undefined}
                                className={`min-w-[30px] h-[30px] px-2 rounded-lg font-bold transition-colors cursor-pointer ${
                                    p === currentPage
                                        ? 'bg-[#0051d5] text-white shadow-2xs'
                                        : 'border border-[#cbd5e1] bg-white text-[#0b1c30] hover:bg-[#eff4ff] hover:text-[#0051d5]'
                                }`}
                            >
                                {p}
                            </button>
                        )
                    )}

                    <button
                        type="button"
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages}
                        aria-label="Trang tiếp"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#cbd5e1] bg-white text-[#0b1c30] font-semibold hover:bg-[#eff4ff] hover:text-[#0051d5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                        <span>Tiếp</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        );
    };

    // --- Save Handlers ---
    const handleSaveSchool = async (data: SchoolData) => {
        if (editingSchool) {
            setSchools((prev) =>
                prev.map((item) => (item.id === editingSchool.id ? { ...item, ...data } : item))
            );
            showToast(`Đã cập nhật trường ${data.code} thành công!`);
            if (!isTestEnv) {
                try {
                    const updated = await taxonomyService.updateUniversity(editingSchool.id, {
                        code: data.code,
                        name: data.name,
                        city: data.city,
                    });
                    if (updated?.id) {
                        setSchools((prev) =>
                            prev.map((item) =>
                                item.id === editingSchool.id ? { ...item, id: String(updated.id) } : item
                            )
                        );
                    }
                } catch {
                    // Fallback kept in local state
                }
            }
        } else {
            setSchools((prev) => [data, ...prev]);
            setSchoolPage(1);
            showToast(`Đã thêm trường ${data.code} vào danh mục học thuật!`);
            if (!isTestEnv) {
                try {
                    const created = await taxonomyService.createUniversity({
                        code: data.code,
                        name: data.name,
                        city: data.city,
                    });
                    if (created?.id) {
                        setSchools((prev) =>
                            prev.map((item) =>
                                item.id === data.id ? { ...item, id: String(created.id) } : item
                            )
                        );
                    }
                } catch {
                    // Fallback kept in local state
                }
            }
        }
        setEditingSchool(null);
    };

    const handleSaveFaculty = async (data: FacultyData) => {
        if (editingFaculty) {
            setFaculties((prev) =>
                prev.map((item) => (item.id === editingFaculty.id ? { ...item, ...data } : item))
            );
            showToast(`Đã cập nhật Khoa / Viện ${data.code} thành công!`);
            if (!isTestEnv) {
                try {
                    const updated = await taxonomyService.updateFaculty(editingFaculty.id, {
                        code: data.code,
                        name: data.name,
                        description: data.description,
                    });
                    if (updated?.id) {
                        setFaculties((prev) =>
                            prev.map((item) =>
                                item.id === editingFaculty.id ? { ...item, id: String(updated.id) } : item
                            )
                        );
                    }
                } catch {
                    // Fallback kept in local state
                }
            }
        } else {
            setFaculties((prev) => [data, ...prev]);
            setFacultyPage(1);
            showToast(`Đã thêm Khoa / Viện ${data.code} thành công!`);
            if (!isTestEnv) {
                try {
                    const created = await taxonomyService.createFaculty({
                        code: data.code,
                        name: data.name,
                        description: data.description,
                    });
                    if (created?.id) {
                        setFaculties((prev) =>
                            prev.map((item) =>
                                item.id === data.id ? { ...item, id: String(created.id) } : item
                            )
                        );
                    }
                } catch {
                    // Fallback kept in local state
                }
            }
        }
        setEditingFaculty(null);
    };

    const handleSaveSubject = async (data: SubjectData) => {
        if (editingSubject) {
            setSubjects((prev) =>
                prev.map((item) => (item.id === editingSubject.id ? { ...item, ...data } : item))
            );
            showToast(`Đã cập nhật môn học ${data.code} thành công!`);
            if (!isTestEnv) {
                try {
                    const updated = await taxonomyService.updateCourse(editingSubject.id, {
                        code: data.code,
                        name: data.name,
                        area: data.area,
                        description: data.description,
                    });
                    if (updated?.id) {
                        setSubjects((prev) =>
                            prev.map((item) =>
                                item.id === editingSubject.id ? { ...item, id: String(updated.id) } : item
                            )
                        );
                    }
                } catch {
                    // Fallback kept in local state
                }
            }
        } else {
            setSubjects((prev) => [data, ...prev]);
            setSubjectPage(1);
            showToast(`Đã thêm môn học ${data.code} thành công!`);
            if (!isTestEnv) {
                try {
                    const created = await taxonomyService.createCourse({
                        code: data.code,
                        name: data.name,
                        area: data.area,
                        description: data.description,
                    });
                    if (created?.id) {
                        setSubjects((prev) =>
                            prev.map((item) =>
                                item.id === data.id ? { ...item, id: String(created.id) } : item
                            )
                        );
                    }
                } catch {
                    // Fallback kept in local state
                }
            }
        }
        setEditingSubject(null);
    };

    // Delete handler
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        const target = deleteTarget;
        setDeleteTarget(null);

        if (target.type === 'school') {
            setSchools((prev) => prev.filter((s) => s.id !== target.id));
            showToast(`Đã xóa trường ${target.name}!`);
            if (!isTestEnv) {
                try {
                    await taxonomyService.deleteUniversity(target.id);
                } catch {
                    // Ignore
                }
            }
        } else if (target.type === 'faculty') {
            setFaculties((prev) => prev.filter((f) => f.id !== target.id));
            showToast(`Đã xóa khoa ${target.name}!`);
            if (!isTestEnv) {
                try {
                    await taxonomyService.deleteFaculty(target.id);
                } catch {
                    // Ignore
                }
            }
        } else if (target.type === 'subject') {
            setSubjects((prev) => prev.filter((s) => s.id !== target.id));
            showToast(`Đã xóa môn học ${target.name}!`);
            if (!isTestEnv) {
                try {
                    await taxonomyService.deleteCourse(target.id);
                } catch {
                    // Ignore
                }
            }
        }
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
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setSchoolPage(1);
                                    }}
                                    placeholder="Tìm mã trường, tên trường, tỉnh thành..."
                                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#cbd5e1] bg-white text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                                />
                            </div>

                            <select
                                value={selectedCity}
                                onChange={(e) => {
                                    setSelectedCity(e.target.value);
                                    setSchoolPage(1);
                                }}
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
                                    <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#edf2f7] text-xs sm:text-sm">
                                {filteredSchools.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-[#5a6a80]">
                                            <Building2 className="w-8 h-8 text-[#cbd5e1] mx-auto mb-2" />
                                            <p className="font-semibold text-[#0b1c30]">Không tìm thấy trường nào phù hợp</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedSchools.map((school) => (
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

                    {renderPaginationBar(
                        safeSchoolPage,
                        totalSchoolPages,
                        filteredSchools.length,
                        'trường',
                        setSchoolPage
                    )}
                </div>
            )}

            {/* TAB 2: Khoa / Viện */}
            {activeTab === 'faculties' && (
                <div className="bg-white border border-[#dce9ff] rounded-2xl shadow-2xs overflow-hidden flex flex-col">
                    {/* Top filter: Search Input by Code & Name */}
                    <div className="p-4 sm:p-5 border-b border-[#e2e8f0] bg-[#fafcff] flex flex-wrap gap-3 items-center justify-between">
                        <div className="relative flex-1 min-w-[220px] max-w-xl">
                            <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={facultySearchTerm}
                                onChange={(e) => {
                                    setFacultySearchTerm(e.target.value);
                                    setFacultyPage(1);
                                }}
                                placeholder="Tìm mã khoa, tên khoa / viện..."
                                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#cbd5e1] bg-white text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] transition-all"
                            />
                        </div>

                        <div className="text-xs text-[#5a6a80] font-medium">
                            Hiển thị <span className="font-bold text-[#0b1c30]">{filteredFaculties.length}</span> / {faculties.length} khoa / viện
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] bg-[#f8fafd] text-[11px] font-bold text-[#5a6a80] uppercase tracking-wider">
                                    <th className="py-3.5 px-4 sm:px-6">Mã khoa</th>
                                    <th className="py-3.5 px-4 sm:px-6">Tên Khoa / Viện</th>
                                    <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#edf2f7] text-xs sm:text-sm">
                                {filteredFaculties.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-12 text-center text-[#5a6a80]">
                                            <FolderTree className="w-8 h-8 text-[#cbd5e1] mx-auto mb-2" />
                                            <p className="font-semibold text-[#0b1c30]">
                                                {facultySearchTerm
                                                    ? `Không tìm thấy Khoa / Viện nào khớp với "${facultySearchTerm}"`
                                                    : 'Chưa có Khoa / Viện nào trong danh mục'}
                                            </p>
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
                                    paginatedFaculties.map((f) => (
                                        <tr key={f.id} className="hover:bg-[#f8faff] transition-colors group">
                                            <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#eff4ff] text-[#0051d5] border border-[#cbe0ff]">
                                                    {f.code}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 sm:px-6 font-bold text-[#0b1c30]">
                                                {f.name}
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

                    {renderPaginationBar(
                        safeFacultyPage,
                        totalFacultyPages,
                        filteredFaculties.length,
                        'khoa / viện',
                        setFacultyPage
                    )}
                </div>
            )}

            {/* TAB 3: Môn học */}
            {activeTab === 'subjects' && (
                <div className="bg-white border border-[#dce9ff] rounded-2xl shadow-2xs overflow-hidden flex flex-col">
                    {/* Top filter: Search Input by Code & Name */}
                    <div className="p-4 sm:p-5 border-b border-[#e2e8f0] bg-[#fafcff] flex flex-wrap gap-3 items-center justify-between">
                        {/* Search Input for Subject */}
                        <div className="relative flex-1 min-w-[220px] max-w-xl">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] w-4 h-4 pointer-events-none" />
                            <input
                                type="text"
                                value={subjectSearchTerm}
                                onChange={(e) => {
                                    setSubjectSearchTerm(e.target.value);
                                    setSubjectPage(1);
                                }}
                                placeholder="Tìm mã môn, tên môn học..."
                                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#cbd5e1] bg-white text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] transition-all"
                            />
                        </div>

                        <div className="text-xs text-[#5a6a80] font-medium">
                            Hiển thị <span className="font-bold text-[#0b1c30]">{filteredSubjects.length}</span> / {subjects.length} môn
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] bg-[#f8fafd] text-[11px] font-bold text-[#5a6a80] uppercase tracking-wider">
                                    <th className="py-3.5 px-4 sm:px-6">Mã môn</th>
                                    <th className="py-3.5 px-4 sm:px-6">Tên môn học</th>
                                    <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#edf2f7] text-xs sm:text-sm">
                                {filteredSubjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-12 text-center text-[#5a6a80]">
                                            <BookOpen className="w-8 h-8 text-[#cbd5e1] mx-auto mb-2" />
                                            <p className="font-semibold text-[#0b1c30]">
                                                {subjectSearchTerm
                                                    ? `Không tìm thấy môn học nào khớp với "${subjectSearchTerm}"`
                                                    : 'Chưa có môn học nào thuộc bộ lọc này'}
                                            </p>
                                            <p className="text-xs text-[#5a6a80] mt-1">
                                                Bạn có thể thử tìm kiếm từ khóa khác hoặc thêm môn học mới vào hệ thống.
                                            </p>
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
                                    paginatedSubjects.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-[#f8faff] transition-colors group">
                                            <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap font-mono font-bold text-[#0051d5]">
                                                {sub.code}
                                            </td>

                                            <td className="py-3.5 px-4 sm:px-6 font-bold text-[#0b1c30]">
                                                {sub.name}
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

                    {renderPaginationBar(
                        safeSubjectPage,
                        totalSubjectPages,
                        filteredSubjects.length,
                        'môn học',
                        setSubjectPage
                    )}
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
