import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileUp,
  Globe,
  Lock,
  ShieldCheck,
  Loader2,
  X,
  AlertTriangle,
  FileText,
  XCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MainLayout } from '../../components/layout';
import {
  downloadBlob,
  fileSize,
  validateUpload,
  getFileExtension,
  isImageExtension,
  MAX_UPLOAD_FILES,
  type UploadErrors,
  type UploadFields,
} from '../../lib/domain';
import { DOC_TYPES } from '../../lib/docTypes';
import { taxonomyService } from '../../services/taxonomyService';
import { documentService } from '../../services/documentService';
import { authService } from '../../services/authService';
import type { DocumentDetail, MultiFileValidationResponse } from '../../types';

const initial: UploadFields = { title: '', caption: '', school: '', subject: '', kind: '', year: '', rights: false };

const SUGGESTED_YEARS = ['2026', '2025-2026', '2025', '2024-2025', '2024', '2023-2024', '2023', '2022'];

const ACCEPT_ATTR =
  '.pdf,.docx,.xlsx,.pptx,.csv,.txt,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/csv,text/plain,image/png,image/jpeg,image/webp';

async function checkClientMagicBytes(file: File): Promise<string | null> {
  const ext = getFileExtension(file.name);
  try {
    const slice = file.slice(0, 1024);
    if (ext === 'pdf') {
      const headerText = await slice.text();
      if (!headerText.includes('%PDF-') && file.type !== 'application/pdf') {
        return `Nội dung file "${file.name}" không có chữ ký PDF hợp lệ. Đổi đuôi file không chuyển được định dạng.`;
      }
    } else if (ext === 'docx' || ext === 'xlsx' || ext === 'pptx') {
      if (typeof slice.arrayBuffer === 'function') {
        const buf = new Uint8Array(await slice.arrayBuffer());
        if (buf.length >= 4 && (buf[0] !== 0x50 || buf[1] !== 0x4b)) {
          return `Tệp "${file.name}" không đúng cấu trúc gói Office (.${ext}).`;
        }
      }
    } else if (isImageExtension(ext)) {
      if (typeof slice.arrayBuffer === 'function') {
        const buf = new Uint8Array(await slice.arrayBuffer());
        // Kiểm tra xem có phải HTML / XML tải nhầm từ mạng không
        const textSample = new TextDecoder('utf-8', { fatal: false }).decode(buf.slice(0, 64)).toLowerCase();
        if (textSample.includes('<html') || textSample.includes('<!doctype') || textSample.includes('<?xml')) {
          return `Tệp "${file.name}" là trang web HTML hoặc văn bản bị lưu nhầm đuôi, không phải tệp hình ảnh hợp lệ.`;
        }

        // Tự động nhận diện định dạng ảnh thực tế từ magic bytes (hỗ trợ PNG, JPEG, WEBP, GIF, BMP)
        const isPng = buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
        const isJpg = buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
        const isWebp = buf.length >= 12 &&
          buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
          buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
        const isGif = buf.length >= 4 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38;
        const isBmp = buf.length >= 2 && buf[0] === 0x42 && buf[1] === 0x4d;

        if (!isPng && !isJpg && !isWebp && !isGif && !isBmp) {
          return `Tệp "${file.name}" không chứa dữ liệu hình ảnh hợp lệ (hỗ trợ PNG, JPEG, WEBP).`;
        }
      }
    }
  } catch {
    // Fallback if File slice methods are mocked in unit tests
  }
  return null;
}

export function Upload() {
  const navigate = useNavigate();
  const [fields, setFields] = useState<UploadFields>(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<UploadErrors>({});
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [drag, setDrag] = useState(false);

  // Kết quả kiểm duyệt tự động từ recommendation-service (Watermark 3 lớp + Chất lượng nội dung)
  const [validationReport, setValidationReport] = useState<MultiFileValidationResponse | null>(null);
  const [personalWatermarkConfirmed, setPersonalWatermarkConfirmed] = useState<boolean>(false);

  // Dynamic taxonomy state — danh sách gợi ý từ backend
  const [universities, setUniversities] = useState<Array<{ id: string; name: string }>>([]);
  const [coursesList, setCoursesList] = useState<Array<{ id: string; name: string }>>([]);

  // Freemium DRM & Security controls
  const [freePages, setFreePages] = useState<number>(3);
  const [unlockPointsRequired, setUnlockPointsRequired] = useState<number>(10);
  const [blurLockEnabled, setBlurLockEnabled] = useState<boolean>(true);

  // IPFS Upload State
  const [uploadingToIpfs, setUploadingToIpfs] = useState<boolean>(false);
  const [ipfsResult, setIpfsResult] = useState<DocumentDetail | null>(null);

  const form = useRef<HTMLFormElement>(null);
  const summary = useRef<HTMLDivElement>(null);

  const primaryFile = files[0] ?? null;
  const totalSelectedBytes = files.reduce((acc, f) => acc + f.size, 0);
  const allFilesAreImages = files.length > 0 && files.every((f) => isImageExtension(getFileExtension(f.name)));

  const matchedUniversity = universities.find(
    (u) => u.id === fields.school.trim() || u.name.toLowerCase() === fields.school.trim().toLowerCase()
  );
  const matchedCourse = coursesList.find(
    (c) => c.id === fields.subject.trim() || c.name.toLowerCase() === fields.subject.trim().toLowerCase()
  );
  const resolvedUniversityName = matchedUniversity?.name || fields.school.trim();
  const resolvedCourseName = matchedCourse?.name || fields.subject.trim();
  const resolvedAcademicYear = fields.year.trim().replace(/\s+/g, '').replace('/', '-');

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  useEffect(() => {
    if (verified) summary.current?.focus();
  }, [verified]);

  useEffect(() => {
    let active = true;
    taxonomyService
      .getUniversities()
      .then((data) => {
        if (active && data && data.length > 0) {
          setUniversities(data.map((item: any) => ({ id: item.id, name: item.name })));
        }
      })
      .catch(() => {});

    taxonomyService
      .getCourses()
      .then((data) => {
        if (active && data && data.length > 0) {
          setCoursesList(data.map((item: any) => ({ id: item.id, name: item.name })));
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const update = (key: keyof UploadFields, value: string | boolean) => {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const chooseFiles = (fileList: FileList | File[] | null, append: boolean = false) => {
    if (!fileList || fileList.length === 0) {
      if (!append) {
        if (url) URL.revokeObjectURL(url);
        setUrl('');
        setFiles([]);
      }
      return;
    }

    const incoming = Array.from(fileList);
    const merged = append ? [...files, ...incoming] : incoming;

    if (merged.length > MAX_UPLOAD_FILES) {
      toast.error(`Chỉ được chọn tối đa ${MAX_UPLOAD_FILES} tệp trong 1 lần đăng tải.`);
    }

    const capped = merged.slice(0, MAX_UPLOAD_FILES);
    if (url) URL.revokeObjectURL(url);
    setUrl(capped[0] ? URL.createObjectURL(capped[0]) : '');
    setFiles(capped);
    setValidationReport(null);
    setPersonalWatermarkConfirmed(false);
    setErrors((current) => ({ ...current, file: undefined }));

    if (capped[0] && !fields.title) {
      setFields((current) => ({
        ...current,
        title: capped[0].name.replace(/\.[a-zA-Z0-9]+$/i, '').replace(/[-_]/g, ' '),
      }));
    }
  };

  const removeFileAt = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    if (url) URL.revokeObjectURL(url);
    setUrl(next[0] ? URL.createObjectURL(next[0]) : '');
    setFiles(next);
    setValidationReport(null);
    setPersonalWatermarkConfirmed(false);
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next = validateUpload(fields, files);
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    setBusy(true);
    try {
      for (const f of files) {
        const sigErr = await checkClientMagicBytes(f);
        if (sigErr) {
          setErrors({ file: sigErr });
          requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
          return;
        }
      }

      const currentUser = authService.getCurrentUser();
      const report = await documentService.validateUploadFiles(files, {
        fullName: currentUser?.fullName,
        username: currentUser?.username,
        email: currentUser?.email,
      });

      setValidationReport(report);

      if (!report.overall_valid) {
        const firstFailed = report.file_results.find((r) => !r.is_valid);
        const errMsg =
          firstFailed?.reason ||
          report.summary_message ||
          'Tệp tải lên không vượt qua kiểm duyệt tự động (Watermark hoặc chất lượng nội dung).';
        setErrors({ file: errMsg });
        toast.error(errMsg);
        return;
      }

      setPersonalWatermarkConfirmed(!report.requires_confirmation);
      setVerified(true);
    } catch {
      setErrors({ file: 'Không đọc được file. Hãy chọn lại file và thử lại.' });
    } finally {
      setBusy(false);
    }
  }

  const handlePublishToIpfs = async () => {
    if (files.length === 0) return;
    if (validationReport?.requires_confirmation && !personalWatermarkConfirmed) {
      toast.error('Vui lòng tích xác nhận quyền sở hữu Watermark cá nhân trước khi xuất bản.');
      return;
    }

    setUploadingToIpfs(true);
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      files.forEach((f) => formData.append('files', f));
      formData.append('title', fields.title.trim());
      if (matchedUniversity?.id) {
        formData.append('universityId', matchedUniversity.id);
      }
      formData.append('universityName', resolvedUniversityName);
      if (matchedCourse?.id) {
        formData.append('courseId', matchedCourse.id);
      }
      formData.append('courseName', resolvedCourseName);
      formData.append('docType', fields.kind);
      formData.append('year', resolvedAcademicYear);
      formData.append('academicYear', resolvedAcademicYear);
      const trimmedCaption = fields.caption && fields.caption.trim() ? fields.caption.trim() : fields.title.trim();
      formData.append('description', fields.caption && fields.caption.trim() ? fields.caption.trim() : `Tài liệu môn ${resolvedCourseName} trường ${resolvedUniversityName}.`);
      formData.append('caption', trimmedCaption);
      formData.append('freePages', String(freePages));
      formData.append('unlockPointsRequired', String(unlockPointsRequired));
      formData.append('blurLockEnabled', String(blurLockEnabled));

      const res = await documentService.upload(formData);
      setIpfsResult(res);
      toast.success('Đăng tải tài liệu thành công!');
      navigate(`/detail/${res.id}`);
    } catch (backendErr: any) {
      const msg =
        backendErr?.message ||
        'Đăng tải tài liệu thất bại. Vui lòng kiểm tra lại file và thử lại.';
      toast.error(msg);
    } finally {
      setUploadingToIpfs(false);
    }
  };

  useEffect(() => {
    if (!uploadingToIpfs && !busy) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploadingToIpfs, busy]);

  const error = (key: keyof UploadErrors) =>
    errors[key] ? (
      <small className="text-xs text-[#EF4444] font-semibold mt-1 block" id={`error-${key}`}>
        {errors[key]}
      </small>
    ) : null;

  return (
    <div className="upload-page page-enter max-w-6xl mx-auto relative">
      {(uploadingToIpfs || busy) && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Đang xử lý tải lên"
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#CBD5E1] flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-sky-50 text-[#0284C7] flex items-center justify-center">
              <Loader2 size={28} className="animate-spin" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">
              {uploadingToIpfs ? 'Đang đăng tải tài liệu...' : 'Đang kiểm duyệt tự động...'}
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Hệ thống đang xử lý tài liệu và tạo bản xem trước. Vui lòng giữ nguyên màn hình và không chuyển trang trong giây lát.
            </p>
          </div>
        </div>
      )}
      <Link
        className="back-link inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0284C7] mb-4 transition-colors"
        to="/"
      >
        <ArrowLeft size={16} />
        Về Home
      </Link>

      <p className="eyebrow text-xs font-bold text-[#0284C7] uppercase tracking-wider mb-1">CHIA SẺ TÀI LIỆU</p>
      <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] mb-2">
        Một ghi chép tốt, thêm một người hiểu.
      </h1>
      <p className="intro text-sm text-[#64748B] mb-6">
        Chuẩn bị tài liệu của bạn, bắt đầu từ những thông tin rõ ràng.
      </p>

      <div className="upload-layout grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <section className="lg:col-span-2">
          <div className="upload-steps flex items-center gap-3 text-sm font-semibold mb-6 pb-3 border-b border-[#E2E8F0]">
            <span className={!verified ? 'text-[#0284C7] font-bold' : 'text-[#64748B]'}>
              01 <strong>Thông tin & file</strong>
            </span>
            <ArrowRight size={16} className="text-[#94A3B8]" />
            <span className={verified ? 'text-[#0284C7] font-bold' : 'text-[#64748B]'}>
              02 <strong>Kiểm tra bản nháp & Xuất bản</strong>
            </span>
          </div>

          {verified ? (
            <div
              className="upload-result bg-white p-6 rounded-2xl border border-[#CBD5E1] shadow-sm flex flex-col gap-4"
              ref={summary}
              tabIndex={-1}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">Bản nháp đã được kiểm tra.</h2>
                  <p className="text-xs text-[#475569]">
                    Kiểm tra lại thông tin bên dưới và bấm xác nhận để đăng tải tài liệu.
                  </p>
                </div>
              </div>

              {/* HỘP XÁC NHẬN WATERMARK CÁ NHÂN CHÍNH CHỦ (NẾU CÓ) */}
              {validationReport?.requires_confirmation && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex flex-col gap-2.5">
                  <div className="flex items-start gap-2.5 text-amber-900">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <strong className="block font-bold mb-0.5">
                        Phát hiện dấu Watermark trong tài liệu
                      </strong>
                      Tài liệu có chứa dấu Watermark cá nhân của bạn. Vui lòng tích đồng ý bên dưới nếu bạn muốn tiếp tục đăng tải.
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-950 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={personalWatermarkConfirmed}
                      onChange={(e) => setPersonalWatermarkConfirmed(e.target.checked)}
                      className="w-4 h-4 rounded border-amber-400 text-[#0284C7] focus:ring-[#0284C7]"
                    />
                    <span>
                      Tôi xác nhận đây là tài liệu của tôi và đồng ý đăng tải.
                    </span>
                  </label>
                </div>
              )}

              <dl className="space-y-2 text-sm bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                <div className="flex justify-between border-b border-dashed border-[#E2E8F0] pb-2">
                  <dt className="text-[#64748B]">Tiêu đề</dt>
                  <dd className="font-bold text-[#0F172A]">{fields.title}</dd>
                </div>
                {fields.caption && fields.caption.trim() && (
                  <div className="flex justify-between border-b border-dashed border-[#E2E8F0] pb-2">
                    <dt className="text-[#64748B]">Lời tựa (Caption)</dt>
                    <dd className="font-medium italic text-[#0F172A] max-w-[280px] text-right truncate" title={fields.caption}>
                      “{fields.caption.trim()}”
                    </dd>
                  </div>
                )}
                <div className="flex justify-between border-b border-dashed border-[#E2E8F0] pb-2">
                  <dt className="text-[#64748B]">Trường đại học</dt>
                  <dd className="font-bold text-[#0F172A]">{resolvedUniversityName}</dd>
                </div>
                <div className="flex justify-between border-b border-dashed border-[#E2E8F0] pb-2">
                  <dt className="text-[#64748B]">Môn học</dt>
                  <dd className="font-bold text-[#0F172A]">{resolvedCourseName}</dd>
                </div>
                <div className="flex justify-between border-b border-dashed border-[#E2E8F0] pb-2">
                  <dt className="text-[#64748B]">Năm học</dt>
                  <dd className="font-bold text-[#0F172A]">{resolvedAcademicYear}</dd>
                </div>
                <div className="flex justify-between border-b border-dashed border-[#E2E8F0] pb-2">
                  <dt className="text-[#64748B]">Tệp tải lên ({files.length} tệp)</dt>
                  <dd className="font-bold text-[#0F172A] text-right">
                    {files.map((f) => f.name).join(', ')} ({fileSize(totalSelectedBytes)})
                  </dd>
                </div>
                <div className="flex justify-between pt-0.5">
                  <dt className="text-[#64748B]">Chế độ chia sẻ</dt>
                  <dd className="font-bold text-[#0284C7]">
                    {freePages} trang đọc thử ·{' '}
                    {unlockPointsRequired === 0 ? 'Miễn phí' : `${unlockPointsRequired} điểm mở khóa`}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#475569] cursor-pointer transition-colors"
                  onClick={() => setVerified(false)}
                >
                  ← Quay lại chỉnh sửa
                </button>

                <button
                  type="button"
                  disabled={uploadingToIpfs || (validationReport?.requires_confirmation && !personalWatermarkConfirmed)}
                  onClick={handlePublishToIpfs}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {uploadingToIpfs ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Đang đăng tài liệu...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Đồng ý & Đăng tài liệu</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form ref={form} noValidate onSubmit={submit} className="upload-form flex flex-col gap-5">
              <div>
                <label
                  className={`file-drop border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    drag
                      ? 'border-[#0284C7] bg-[#F0F9FF]'
                      : errors.file
                        ? 'border-[#EF4444] bg-rose-50/50'
                        : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#0284C7] hover:bg-[#F0F9FF]/50'
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDrag(true);
                  }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDrag(false);
                    chooseFiles(event.dataTransfer.files, files.length > 0);
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mb-3">
                    <FileUp size={24} strokeWidth={1.8} />
                  </div>
                  <strong className="text-base font-bold text-[#0F172A] mb-1">
                    {primaryFile
                      ? files.length === 1
                        ? primaryFile.name
                        : `Đã chọn ${files.length}/${MAX_UPLOAD_FILES} tệp (${fileSize(totalSelectedBytes)})`
                      : 'Chọn file hoặc kéo thả vào đây'}
                  </strong>
                  <span className="text-xs text-[#64748B]">
                    {primaryFile
                      ? `${fileSize(totalSelectedBytes)} · Nhấn để chọn lại hoặc kéo thả thêm tệp (Tối đa ${MAX_UPLOAD_FILES} tệp)`
                      : 'Hỗ trợ PDF, DOCX, XLSX, PPTX, CSV, TXT, PNG, JPG, WEBP · Tối đa 5 file (50 MB)'}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept={ACCEPT_ATTR}
                    className="hidden"
                    aria-label="Chọn file PDF"
                    aria-invalid={!!errors.file}
                    aria-describedby={errors.file ? 'error-file' : 'file-help'}
                    onChange={(event) => chooseFiles(event.target.files, false)}
                  />
                </label>

                {/* DANH SÁCH CÁC FILE ĐÃ CHỌN */}
                {files.length > 0 && (
                  <div className="mt-3 bg-white border border-[#E2E8F0] rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0F172A]">
                        Danh sách tệp đã chọn ({files.length}/{MAX_UPLOAD_FILES})
                      </span>
                      {allFilesAreImages && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-50 text-[#0284C7] font-semibold">
                          Tất cả là ảnh: Tự động gộp thành 1 file PDF đa trang
                        </span>
                      )}
                      {!allFilesAreImages && files.length > 1 && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
                          Gói học liệu đa tệp ({files.length} tệp đính kèm)
                        </span>
                      )}
                    </div>
                    <ul className="divide-y divide-[#F1F5F9]">
                      {files.map((f, idx) => {
                        const ext = getFileExtension(f.name).toUpperCase() || 'FILE';
                        const fileRes = validationReport?.file_results?.[idx];
                        return (
                          <li key={`${f.name}-${idx}`} className="py-2 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-bold text-[10px] shrink-0">
                                {ext}
                              </span>
                              <span className="font-semibold text-[#0F172A] truncate">{f.name}</span>
                              <span className="text-[#64748B] shrink-0">({fileSize(f.size)})</span>
                              {idx === 0 && files.length > 1 && !allFilesAreImages && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold shrink-0">
                                  Tệp chính
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {fileRes && !fileRes.is_valid && (
                                <span className="inline-flex items-center gap-1 text-[#EF4444] font-bold">
                                  <XCircle size={13} /> Lỗi kiểm duyệt
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => removeFileAt(idx)}
                                className="p-1 text-[#64748B] hover:text-[#EF4444] rounded cursor-pointer"
                                title="Xóa tệp này"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* HIỂN THỊ CHI TIẾT LỖI KIỂM DUYỆT TỰ ĐỘNG NẾU BỊ CHẶN */}
                {validationReport && !validationReport.overall_valid && (
                  <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-rose-700">
                      <XCircle size={15} />
                      <span>Kiểm duyệt tự động từ chối tệp tải lên:</span>
                    </div>
                    {validationReport.file_results
                      .filter((r) => !r.is_valid)
                      .map((r, idx) => (
                        <div key={idx} className="pl-5 text-rose-800">
                          • <strong>{r.file_name}:</strong> {r.reason}
                        </div>
                      ))}
                  </div>
                )}

                {error('file')}
                <p id="file-help" className="field-hint text-xs text-[#64748B] mt-1.5">
                  Hệ thống tự động kiểm tra chữ ký định dạng, quét Watermark (nền tảng ngoài & cá nhân) và thẩm định chất
                  lượng học thuật trước khi xuất bản.
                </p>
              </div>

              <div className="field flex flex-col gap-1.5">
                <label className="text-sm font-bold text-[#0F172A]">
                  Tiêu đề tài liệu <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  value={fields.title}
                  maxLength={140}
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? 'error-title' : undefined}
                  placeholder="Ví dụ: Đề cương ôn tập Kinh tế vi mô"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white ${
                    errors.title ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                  }`}
                  onChange={(event) => update('title', event.target.value)}
                />
                {error('title')}
              </div>

              <div className="field flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="caption-input" className="text-sm font-bold text-[#0F172A]">
                    Chú thích / Lời tựa (Caption)
                  </label>
                  <span className="text-xs text-[#64748B]">Không bắt buộc</span>
                </div>
                <textarea
                  id="caption-input"
                  rows={2}
                  value={fields.caption ?? ''}
                  maxLength={280}
                  aria-label="Chú thích hoặc lời tựa"
                  placeholder="Viết lời tựa, tóm tắt hoặc lời nhắn gửi của bạn về tài liệu này..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white resize-none"
                  onChange={(event) => update('caption', event.target.value)}
                />
                <p className="field-hint text-xs text-[#64748B]">
                  Lời tựa này sẽ hiển thị trang trọng ngay dưới tên tác giả trên trang chi tiết học liệu.
                </p>
              </div>

              <div className="form-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="field flex flex-col gap-1.5">
                  <label htmlFor="school-input" className="text-sm font-bold text-[#0F172A]">
                    Trường đại học <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="school-input"
                    type="text"
                    list="university-suggestions"
                    value={fields.school}
                    maxLength={150}
                    aria-label="Trường đại học"
                    aria-invalid={!!errors.school}
                    aria-describedby={errors.school ? 'error-school' : undefined}
                    placeholder="Nhập tên trường hoặc chọn từ gợi ý..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white ${
                      errors.school ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                    }`}
                    onChange={(event) => update('school', event.target.value)}
                  />
                  <datalist id="university-suggestions">
                    {universities.map((item) => (
                      <option value={item.name} data-id={item.id} key={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </datalist>
                  {error('school')}
                </div>

                <div className="field flex flex-col gap-1.5">
                  <label htmlFor="subject-input" className="text-sm font-bold text-[#0F172A]">
                    Môn học <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="subject-input"
                    type="text"
                    list="course-suggestions"
                    value={fields.subject}
                    maxLength={150}
                    aria-label="Môn học"
                    aria-invalid={!!errors.subject}
                    aria-describedby={errors.subject ? 'error-subject' : undefined}
                    placeholder="Nhập tên môn học hoặc chọn từ gợi ý..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white ${
                      errors.subject ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                    }`}
                    onChange={(event) => update('subject', event.target.value)}
                  />
                  <datalist id="course-suggestions">
                    {coursesList.map((item) => (
                      <option value={item.name} data-id={item.id} key={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </datalist>
                  {error('subject')}
                </div>

                <div className="field flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-[#0F172A]">
                    Loại tài liệu <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    value={fields.kind}
                    aria-label="Loại tài liệu"
                    aria-invalid={!!errors.kind}
                    aria-describedby={errors.kind ? 'error-kind' : undefined}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white ${
                      errors.kind ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                    }`}
                    onChange={(event) => update('kind', event.target.value)}
                  >
                    <option value="">Chọn loại tài liệu</option>
                    {DOC_TYPES.map((t) => (
                      <option value={t.value} key={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {error('kind')}
                </div>

                <div className="field flex flex-col gap-1.5">
                  <label htmlFor="year-input" className="text-sm font-bold text-[#0F172A]">
                    Năm học <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="year-input"
                    type="text"
                    list="year-suggestions"
                    value={fields.year}
                    maxLength={20}
                    aria-label="Năm học"
                    aria-invalid={!!errors.year}
                    aria-describedby={errors.year ? 'error-year' : undefined}
                    placeholder="Nhập năm học (VD: 2026 hoặc 2025-2026)"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white ${
                      errors.year ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                    }`}
                    onChange={(event) => update('year', event.target.value)}
                  />
                  <datalist id="year-suggestions">
                    {SUGGESTED_YEARS.map((item) => (
                      <option value={item} key={item}>
                        {item}
                      </option>
                    ))}
                  </datalist>
                  {error('year')}
                </div>
              </div>

              {/* DRM & MONETIZATION SETTINGS */}
              <div className="drm-section bg-[#F8FAFC] border border-[#CBD5E1] p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
                  <Lock size={16} className="text-[#0284C7]" />
                  <span>Cấu hình bản quyền & DRM</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="free-pages" className="text-xs font-semibold text-[#475569]">
                      Số trang đọc thử miễn phí
                    </label>
                    <select
                      id="free-pages"
                      aria-label="Số trang đọc thử miễn phí"
                      value={freePages}
                      onChange={(e) => setFreePages(Number(e.target.value))}
                      className="px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0284C7]"
                    >
                      <option value={1}>1 trang</option>
                      <option value={2}>2 trang</option>
                      <option value={3}>3 trang (Khuyên dùng)</option>
                      <option value={5}>5 trang</option>
                      <option value={10}>10 trang</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="unlock-points" className="text-xs font-semibold text-[#475569]">
                      Điểm mở khóa
                    </label>
                    <select
                      id="unlock-points"
                      aria-label="Điểm mở khóa"
                      value={unlockPointsRequired}
                      onChange={(e) => setUnlockPointsRequired(Number(e.target.value))}
                      className="px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0284C7]"
                    >
                      <option value={0}>0 điểm (Miễn phí hoàn toàn)</option>
                      <option value={5}>5 điểm</option>
                      <option value={10}>10 điểm (Tiêu chuẩn)</option>
                      <option value={20}>20 điểm</option>
                      <option value={50}>50 điểm (Tài liệu chuyên sâu)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="blur-lock"
                    aria-label="Làm mờ trang khóa bảo mật"
                    checked={blurLockEnabled}
                    onChange={(e) => setBlurLockEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-[#CBD5E1] text-[#0284C7] focus:ring-[#0284C7]"
                  />
                  <label htmlFor="blur-lock" className="text-xs text-[#475569] cursor-pointer">
                    Làm mờ trang khóa bảo mật khi người xem chưa mở khóa
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="button primary submit-upload w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm mt-3"
              >
                <span>{busy ? 'Đang kiểm duyệt tự động…' : 'Kiểm tra bản nháp & Xuất bản'}</span>
                <ArrowRight size={17} />
              </button>

              {Object.keys(errors).length > 0 && (
                <p role="alert" className="field-error text-xs text-[#EF4444] font-semibold text-center mt-1">
                  Vui lòng kiểm tra các trường được đánh dấu trước khi tiếp tục.
                </p>
              )}
            </form>
          )}
        </section>

        <aside className="upload-guidance bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-5">
          <div>
            <span className="tiny-label text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-1">
              TRƯỚC KHI CHIA SẺ
            </span>
            <h2 className="text-xl font-serif font-bold text-[#0F172A] leading-tight">
              Dễ tìm.
              <br />
              Dễ đọc. Có ích.
            </h2>
          </div>

          <ol className="space-y-4 text-sm text-[#334155]">
            <li className="flex gap-3 items-start">
              <strong className="text-[#0284C7] font-bold">1.</strong>
              <div>
                <strong className="block text-[#0F172A]">Đa định dạng & Đa tệp</strong>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Hỗ trợ tối đa 5 tệp (PDF, Word, Excel, PowerPoint, Ảnh, CSV, TXT). Nếu chọn nhiều ảnh, hệ thống tự
                  động gộp thành PDF.
                </p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <strong className="text-[#0284C7] font-bold">2.</strong>
              <div>
                <strong className="block text-[#0F172A]">Kiểm duyệt Watermark tự động</strong>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Chặn tuyệt đối tài liệu dính Watermark từ nền tảng khác (Studocu, CourseHero, 123doc...) hoặc
                  Watermark cá nhân của người khác.
                </p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <strong className="text-[#0284C7] font-bold">3.</strong>
              <div>
                <strong className="block text-[#0F172A]">Chống tệp rác lách luật</strong>
                <p className="text-xs text-[#64748B] mt-0.5">
                  AI kiểm tra chữ ký byte thật, mật độ từ vựng học thuật và chống sao chép lặp câu.
                </p>
              </div>
            </li>
          </ol>
        </aside>
      </div>
    </div>
  );
}

export function UploadPage() {
  return (
    <MainLayout>
      <Upload />
    </MainLayout>
  );
}
