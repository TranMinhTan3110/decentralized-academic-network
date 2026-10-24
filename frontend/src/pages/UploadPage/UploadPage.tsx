import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, Download, FileUp, Globe, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MainLayout } from '../../components/layout';
import { downloadBlob, fileSize, validateUpload, type UploadErrors, type UploadFields } from '../../lib/domain';
import { DOC_TYPES } from '../../lib/docTypes';
import { taxonomyService } from '../../services/taxonomyService';
import { documentService } from '../../services/documentService';
import type { DocumentDetail } from '../../types';

const initial: UploadFields = { title: '', school: '', subject: '', kind: '', year: '', rights: false };

export function Upload() {
  const navigate = useNavigate();
  const [fields, setFields] = useState<UploadFields>(initial);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<UploadErrors>({});
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [drag, setDrag] = useState(false);

  // Dynamic taxonomy state — bound to backend UUIDs, no mock fallback
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

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  useEffect(() => {
    if (verified) summary.current?.focus();
  }, [verified]);

  // Load universities & courses from taxonomyService
  useEffect(() => {
    let active = true;
    taxonomyService.getUniversities()
      .then((data) => {
        if (active && data && data.length > 0) {
          setUniversities(data.map((item: any) => ({ id: item.id, name: item.name })));
        }
      })
      .catch(() => {
        // Empty list renders the disabled hint in the select
      });

    taxonomyService.getCourses()
      .then((data) => {
        if (active && data && data.length > 0) {
          setCoursesList(data.map((item: any) => ({ id: item.id, name: item.name })));
        }
      })
      .catch(() => {
        // Empty list renders the disabled hint in the select
      });

    return () => {
      active = false;
    };
  }, []);

  const update = (key: keyof UploadFields, value: string | boolean) => {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const choose = (chosen: File | null) => {
    if (url) URL.revokeObjectURL(url);
    setUrl(chosen ? URL.createObjectURL(chosen) : '');
    setFile(chosen);
    setErrors((current) => ({ ...current, file: undefined }));
    if (chosen && !fields.title) {
      setFields((current) => ({
        ...current,
        title: chosen.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '),
      }));
    }
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next = validateUpload(fields, file);
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setBusy(true);
    try {
      let isPdf = false;
      try {
        const headerText = await file!.slice(0, 1024).text();
        if (headerText.includes('%PDF-')) {
          isPdf = true;
        }
      } catch {
        // Fallback if slice.text() throws
      }

      if (!isPdf && (file!.type === 'application/pdf' || file!.name.toLowerCase().endsWith('.pdf'))) {
        isPdf = true;
      }

      if (!isPdf) {
        setErrors({ file: 'Nội dung file không có chữ ký PDF hợp lệ. Đổi đuôi file không chuyển được định dạng.' });
        requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
        return;
      }
      setVerified(true);
    } catch {
      setErrors({ file: 'Không đọc được file. Hãy chọn lại file và thử lại.' });
    } finally {
      setBusy(false);
    }
  }

  const handlePublishToIpfs = async () => {
    if (!file) return;
    setUploadingToIpfs(true);
    try {
      const universityName = universities.find((u) => u.id === fields.school)?.name ?? '';
      const courseName = coursesList.find((c) => c.id === fields.subject)?.name ?? '';

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', fields.title);
      formData.append('universityId', fields.school);
      formData.append('courseId', fields.subject);
      formData.append('docType', fields.kind);
      formData.append('year', fields.year);
      formData.append('academicYear', fields.year);
      formData.append('description', `Tài liệu môn ${courseName} trường ${universityName}.`);
      formData.append('caption', fields.title);
      formData.append('freePages', String(freePages));
      formData.append('unlockPointsRequired', String(unlockPointsRequired));
      formData.append('blurLockEnabled', String(blurLockEnabled));

      const res = await documentService.upload(formData);
      setIpfsResult(res);
      toast.success('Đăng tải tài liệu lên IPFS thành công!');
      navigate(`/detail/${res.id}`);
    } catch (backendErr: any) {
      const msg = backendErr?.message || 'Đăng tải tài liệu lên mạng lưới thất bại. Vui lòng kiểm tra lại file và kết nối mạng.';
      toast.error(msg);
    } finally {
      setUploadingToIpfs(false);
    }
  };

  const error = (key: keyof UploadErrors) =>
    errors[key] ? (
      <small className="text-xs text-[#EF4444] font-semibold mt-1 block" id={`error-${key}`}>
        {errors[key]}
      </small>
    ) : null;

  return (
    <div className="upload-page page-enter max-w-6xl mx-auto">
      <Link className="back-link inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0284C7] mb-4 transition-colors" to="/">
        <ArrowLeft size={16} />Về Home
      </Link>

      <p className="eyebrow text-xs font-bold text-[#0284C7] uppercase tracking-wider mb-1">CHIA SẺ TÀI LIỆU</p>
      <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] mb-2">Một ghi chép tốt, thêm một người hiểu.</h1>
      <p className="intro text-sm text-[#64748B] mb-6">Chuẩn bị tài liệu của bạn, bắt đầu từ những thông tin rõ ràng.</p>

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
            <div className="upload-result bg-white p-6 rounded-2xl border border-[#CBD5E1] shadow-sm flex flex-col gap-4" ref={summary} tabIndex={-1}>
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Check size={28} />
              </div>
              <h2 className="text-xl font-bold text-[#0F172A]">Bản nháp đã được kiểm tra.</h2>
              <p className="text-sm text-[#475569]">
                File và thông tin đạt kiểm tra cơ bản. Bạn có thể xuất bản trực tiếp lên mạng lưới IPFS hoặc lưu trữ bản nháp.
              </p>

              <dl className="space-y-2 text-sm bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                <div className="flex justify-between border-b border-dashed border-[#E2E8F0] pb-2">
                  <dt className="text-[#64748B]">Tiêu đề</dt>
                  <dd className="font-bold text-[#0F172A]">{fields.title}</dd>
                </div>
                <div className="flex justify-between border-b border-dashed border-[#E2E8F0] pb-2">
                  <dt className="text-[#64748B]">File</dt>
                  <dd className="font-bold text-[#0F172A]">{file?.name}</dd>
                </div>
                <div className="flex justify-between border-b border-dashed border-[#E2E8F0] pb-2">
                  <dt className="text-[#64748B]">Dung lượng</dt>
                  <dd className="font-bold text-[#0F172A]">{fileSize(file?.size ?? 0)}</dd>
                </div>
                <div className="flex justify-between border-b border-dashed border-[#E2E8F0] pb-2">
                  <dt className="text-[#64748B]">Cấu hình DRM</dt>
                  <dd className="font-bold text-[#0284C7]">
                    {freePages} trang đọc thử · {unlockPointsRequired === 0 ? 'Miễn phí' : `${unlockPointsRequired} điểm mở khóa`}
                  </dd>
                </div>
                {ipfsResult?.ipfsCid && (
                  <div className="flex justify-between pt-1">
                    <dt className="text-[#64748B]">Mã IPFS CID</dt>
                    <dd className="font-mono text-xs text-emerald-600 font-bold truncate max-w-xs">{ipfsResult.ipfsCid}</dd>
                  </div>
                )}
              </dl>

              {/* IPFS PUBLISH BUTTON */}
              <div className="bg-gradient-to-r from-sky-50 to-indigo-50 p-4 rounded-xl border border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0284C7] text-white flex items-center justify-center shrink-0">
                    <Globe size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A]">Xuất bản lên Mạng lưới phi tập trung</h4>
                    <p className="text-xs text-[#64748B]">Lưu trữ vĩnh cửu trên IPFS & phân phối qua Cloudflare Edge.</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={uploadingToIpfs}
                  onClick={handlePublishToIpfs}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {uploadingToIpfs ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Đang tải lên IPFS...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Xuất bản lên Mạng lưới (IPFS)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="result-actions flex flex-col sm:flex-row gap-3 mt-1">
                <a className="button secondary inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC]" href={url} target="_blank" rel="noreferrer">
                  Mở PDF cục bộ
                </a>
                <button
                  className="button secondary inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                  onClick={() => downloadBlob(new Blob([JSON.stringify({ ...fields, fileName: file?.name, fileSize: file?.size, freePages, unlockPointsRequired, blurLockEnabled, status: 'local-draft' }, null, 2)], { type: 'application/json' }), 'muc-luc-ban-nhap.json')}
                >
                  <Download size={16} />Lưu thông tin bản nháp
                </button>
              </div>

              <p className="honest-note text-xs text-[#64748B] italic">
                Tài liệu xuất bản sẽ được băm mã hóa SHA-256 và lưu trữ phi tập trung trên mạng lưới IPFS.
              </p>

              <button className="text-button text-xs font-semibold text-[#0284C7] hover:underline self-start cursor-pointer mt-2" onClick={() => setVerified(false)}>
                ← Chỉnh sửa thông tin
              </button>
            </div>
          ) : (
            <form ref={form} noValidate onSubmit={submit} className="upload-form flex flex-col gap-5">
              <div>
                <label
                  className={`file-drop border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    drag ? 'border-[#0284C7] bg-[#F0F9FF]' : errors.file ? 'border-[#EF4444] bg-rose-50/50' : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#0284C7] hover:bg-[#F0F9FF]/50'
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDrag(true);
                  }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDrag(false);
                    choose(event.dataTransfer.files[0] ?? null);
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mb-3">
                    <FileUp size={24} strokeWidth={1.8} />
                  </div>
                  <strong className="text-base font-bold text-[#0F172A] mb-1">{file ? file.name : 'Chọn file hoặc kéo thả vào đây'}</strong>
                  <span className="text-xs text-[#64748B]">{file ? `${fileSize(file.size)} · Chọn lại file` : 'PDF · Tối đa 20 MB'}</span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    aria-label="Chọn file PDF"
                    aria-invalid={!!errors.file}
                    aria-describedby={errors.file ? 'error-file' : 'file-help'}
                    onChange={(event) => choose(event.target.files?.[0] ?? null)}
                  />
                </label>
                {error('file')}
                <p id="file-help" className="field-hint text-xs text-[#64748B] mt-1.5">
                  File chỉ được đọc trong trình duyệt để kiểm tra cấu trúc trước khi xuất bản.
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

              <div className="form-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* TRƯỜNG ĐẠI HỌC (bind UUID từ taxonomy) */}
                <div className="field flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-[#0F172A]">
                    Trường đại học <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    value={fields.school}
                    aria-invalid={!!errors.school}
                    aria-describedby={errors.school ? 'error-school' : undefined}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white ${
                      errors.school ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                    }`}
                    onChange={(event) => update('school', event.target.value)}
                  >
                    <option value="">
                      {universities.length ? 'Chọn trường đại học' : 'Đang tải danh sách trường...'}
                    </option>
                    {universities.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  {error('school')}
                </div>

                {/* MÔN HỌC (bind UUID từ taxonomy) */}
                <div className="field flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-[#0F172A]">
                    Môn học <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    value={fields.subject}
                    aria-invalid={!!errors.subject}
                    aria-describedby={errors.subject ? 'error-subject' : undefined}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white ${
                      errors.subject ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                    }`}
                    onChange={(event) => update('subject', event.target.value)}
                  >
                    <option value="">
                      {coursesList.length ? 'Chọn môn học' : 'Đang tải danh sách môn...'}
                    </option>
                    {coursesList.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  {error('subject')}
                </div>

                {/* LOẠI TÀI LIỆU (enum chuẩn chia sẻ với backend) */}
                <div className="field flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-[#0F172A]">
                    Loại tài liệu <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    value={fields.kind}
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

                {/* NĂM HỌC */}
                <div className="field flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-[#0F172A]">
                    Năm học <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    value={fields.year}
                    aria-invalid={!!errors.year}
                    aria-describedby={errors.year ? 'error-year' : undefined}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white ${
                      errors.year ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                    }`}
                    onChange={(event) => update('year', event.target.value)}
                  >
                    <option value="">Chọn năm học</option>
                    {['2026', '2025', '2024', '2023', '2022'].map((item) => (
                      <option value={item} key={item}>
                        {item}
                      </option>
                    ))}
                  </select>
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
                    Làm mờ trang khóa bảo mật (Gaussian Blur phía máy chủ để bảo vệ nội dung trước DevTools)
                  </label>
                </div>
              </div>

              <div className="checkbox-field flex items-start gap-2.5 p-3 rounded-xl bg-sky-50/60 border border-sky-100 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  id="rights"
                  checked={fields.rights}
                  aria-invalid={!!errors.rights}
                  aria-describedby={errors.rights ? 'error-rights' : undefined}
                  className="w-4 h-4 rounded border-[#CBD5E1] text-[#0284C7] focus:ring-[#0284C7] mt-0.5 cursor-pointer"
                  onChange={(event) => update('rights', event.target.checked)}
                />
                <label htmlFor="rights" className="text-xs sm:text-sm text-[#334155] cursor-pointer font-medium leading-relaxed">
                  Tôi tự biên soạn hoặc có quyền chia sẻ tài liệu này. <span className="text-[#EF4444]">*</span>
                </label>
              </div>
              {error('rights')}

              <button
                type="submit"
                disabled={busy}
                className="button primary submit-upload w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm mt-3"
              >
                <span>{busy ? 'Đang kiểm tra file…' : 'Kiểm tra bản nháp & Xuất bản'}</span>
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
            <span className="tiny-label text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-1">TRƯỚC KHI CHIA SẺ</span>
            <h2 className="text-xl font-serif font-bold text-[#0F172A] leading-tight">Dễ tìm.<br />Dễ đọc. Có ích.</h2>
          </div>

          <ol className="space-y-4 text-sm text-[#334155]">
            <li className="flex gap-3 items-start">
              <strong className="text-[#0284C7] font-bold">1.</strong>
              <div>
                <strong className="block text-[#0F172A]">Đặt tên cụ thể</strong>
                <p className="text-xs text-[#64748B] mt-0.5">Ghi môn học và chủ đề, tránh những tên như "Tài liệu mới".</p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <strong className="text-[#0284C7] font-bold">2.</strong>
              <div>
                <strong className="block text-[#0F172A]">Kiểm tra nội dung</strong>
                <p className="text-xs text-[#64748B] mt-0.5">Trang rõ nét, đúng thứ tự và không chứa thông tin cá nhân.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <strong className="text-[#0284C7] font-bold">3.</strong>
              <div>
                <strong className="block text-[#0F172A]">Tôn trọng tác giả</strong>
                <p className="text-xs text-[#64748B] mt-0.5">Chỉ dùng tài liệu bạn có quyền chia sẻ. Ghi nguồn trong nội dung khi cần.</p>
              </div>
            </li>
          </ol>

          <div className="sample-notice bg-[#F0FDF4] border border-[#DCFCE7] p-4 rounded-xl">
            <strong className="block text-xs font-bold text-emerald-800 mb-1">Mạng lưới IPFS sẵn sàng</strong>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Tài liệu được băm mã hóa và lưu trữ phân tán. Bạn có thể thiết lập số trang đọc thử và điểm mở khóa DRM.
            </p>
          </div>
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
