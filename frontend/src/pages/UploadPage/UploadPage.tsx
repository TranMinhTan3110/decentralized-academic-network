import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, Download, FileUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { schools, subjects, kinds } from '../../data/documents';
import { downloadBlob, fileSize, validateUpload, type UploadErrors, type UploadFields } from '../../lib/domain';
import { useSocial } from '../../lib/socialStore';

const initial: UploadFields = { title: '', school: '', subject: '', kind: '', year: '', rights: false };

export function Upload() {
  const [fields, setFields] = useState<UploadFields>(initial);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<UploadErrors>({});
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [drag, setDrag] = useState(false);
  const [draftId, setDraftId] = useState('');
  const { publishLocalDraft } = useSocial();
  const form = useRef<HTMLFormElement>(null);
  const summary = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file) {
      setUrl('');
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  useEffect(() => {
    if (verified) summary.current?.focus();
  }, [verified]);

  const update = (key: keyof UploadFields, value: string | boolean) => {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const choose = (chosen: File | null) => {
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
      const signature = await file!.slice(0, 5).text();
      if (signature !== '%PDF-') {
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

  const error = (key: keyof UploadErrors) =>
    errors[key] ? (
      <small className="text-xs text-[#EF4444] font-semibold mt-1 block" id={`error-${key}`}>
        {errors[key]}
      </small>
    ) : null;

  const createDraft = () => {
    if (!draftId) {
      setDraftId(publishLocalDraft({ title: fields.title, school: fields.school, subject: fields.subject, kind: fields.kind, year: fields.year }));
    }
  };

  return (
    <div className="upload-page page-enter max-w-6xl mx-auto px-4 py-4">
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
              02 <strong>Kiểm tra bản nháp</strong>
            </span>
          </div>

          {verified ? (
            <div className="upload-result bg-white p-6 rounded-2xl border border-[#CBD5E1] shadow-sm flex flex-col gap-4" ref={summary} tabIndex={-1}>
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Check size={28} />
              </div>
              <h2 className="text-xl font-bold text-[#0F172A]">Bản nháp đã được kiểm tra.</h2>
              <p className="text-sm text-[#475569]">
                File và thông tin đạt kiểm tra cơ bản. <strong>Tài liệu chưa được tải lên hoặc xuất bản.</strong>
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
                <div className="flex justify-between">
                  <dt className="text-[#64748B]">Dung lượng</dt>
                  <dd className="font-bold text-[#0F172A]">{fileSize(file?.size ?? 0)}</dd>
                </div>
              </dl>

              <div className="result-actions flex flex-col sm:flex-row gap-3 mt-2">
                <a className="button secondary inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC]" href={url} target="_blank" rel="noreferrer">
                  Mở PDF cục bộ
                </a>
                <button
                  className="button primary inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl text-xs font-semibold"
                  onClick={() => downloadBlob(new Blob([JSON.stringify({ ...fields, fileName: file?.name, fileSize: file?.size, status: 'local-draft-not-uploaded' }, null, 2)], { type: 'application/json' }), 'muc-luc-ban-nhap.json')}
                >
                  <Download size={16} />Lưu thông tin bản nháp
                </button>
                <button className="button secondary inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC]" onClick={createDraft} disabled={!!draftId}>
                  {draftId ? 'Đã thêm vào Library cục bộ' : 'Thêm bản nháp vào Library'}
                </button>
              </div>
              
              {draftId && (
                <p className="draft-created text-xs text-emerald-600 font-medium" role="status">
                  Bản nháp đã được thêm vào Library cục bộ. Bạn có thể mở Quiz để tạo câu hỏi từ metadata mẫu.
                </p>
              )}
              
              <p className="honest-note text-xs text-[#64748B] italic">
                File JSON chỉ lưu thông tin, không chứa PDF. Giữ file PDF gốc trên máy. Bản nháp cục bộ không được gửi lên máy chủ.
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
                  File chỉ được đọc trong trình duyệt, chưa gửi đi đâu.
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
                {/* TRƯỜNG ĐẠI HỌC (Tự nhập hoặc chọn gợi ý) */}
                <div className="field flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-[#0F172A]">
                    Trường đại học <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    list="schools-list"
                    value={fields.school}
                    aria-invalid={!!errors.school}
                    aria-describedby={errors.school ? 'error-school' : undefined}
                    placeholder="Chọn gợi ý hoặc tự nhập trường..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white ${
                      errors.school ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                    }`}
                    onChange={(event) => update('school', event.target.value)}
                  />
                  <datalist id="schools-list">
                    {schools.map((item) => (
                      <option value={item.name} key={item.id} />
                    ))}
                  </datalist>
                  {error('school')}
                </div>

                {/* MÔN HỌC (Tự nhập hoặc chọn gợi ý) */}
                <div className="field flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-[#0F172A]">
                    Môn học <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    list="subjects-list"
                    value={fields.subject}
                    aria-invalid={!!errors.subject}
                    aria-describedby={errors.subject ? 'error-subject' : undefined}
                    placeholder="Chọn gợi ý hoặc tự nhập môn học..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white ${
                      errors.subject ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                    }`}
                    onChange={(event) => update('subject', event.target.value)}
                  />
                  <datalist id="subjects-list">
                    {subjects.map((item) => (
                      <option value={item.name} key={item.id} />
                    ))}
                  </datalist>
                  {error('subject')}
                </div>

                {/* LOẠI TÀI LIỆU */}
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
                    {kinds.map((item) => (
                      <option value={item} key={item}>
                        {item}
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

              <div className="checkbox-field flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  id="rights"
                  checked={fields.rights}
                  aria-invalid={!!errors.rights}
                  aria-describedby={errors.rights ? 'error-rights' : undefined}
                  className="w-4 h-4 rounded border-[#CBD5E1] text-[#0284C7] focus:ring-[#0284C7]"
                  onChange={(event) => update('rights', event.target.checked)}
                />
                <label htmlFor="rights" className="text-sm text-[#334155] cursor-pointer">
                  Tôi tự biên soạn hoặc có quyền chia sẻ tài liệu này.
                </label>
              </div>
              {error('rights')}

              <button
                type="submit"
                disabled={busy}
                className="button primary submit-upload w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm mt-3"
              >
                <span>{busy ? 'Đang kiểm tra file…' : 'Kiểm tra bản nháp'}</span>
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

          <div className="sample-notice bg-[#FFF7ED] border border-[#FFEDD5] p-4 rounded-xl">
            <strong className="block text-xs font-bold text-[#C2410C] mb-1">Chế độ trải nghiệm</strong>
            <p className="text-xs text-[#9A3412] leading-relaxed">
              Chưa kết nối máy chủ. Bạn có thể kiểm tra PDF, lưu metadata bản nháp cục bộ; tài liệu không xuất hiện trong kho chung.
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
