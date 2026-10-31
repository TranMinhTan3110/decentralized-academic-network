import type { DocumentItem } from '../data/documents';

export interface Filters {
  q?: string;
  school?: string;
  subject?: string;
  kind?: string;
  year?: string;
  sort?: string;
}

export const ALLOWED_UPLOAD_EXTENSIONS = [
  'pdf',
  'docx',
  'xlsx',
  'pptx',
  'csv',
  'txt',
  'png',
  'jpg',
  'jpeg',
  'webp',
] as const;

export const IMAGE_UPLOAD_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp']);
export const MAX_UPLOAD_FILES = 5;
export const MAX_TOTAL_UPLOAD_BYTES = 50 * 1024 * 1024;
export const MAX_SINGLE_FILE_BYTES = 25 * 1024 * 1024;

export function getFileExtension(fileName: string): string {
  if (!fileName || !fileName.includes('.')) return '';
  return fileName.split('.').pop()?.toLowerCase().trim() || '';
}

export function isImageExtension(ext: string): boolean {
  return IMAGE_UPLOAD_EXTENSIONS.has(ext.toLowerCase());
}

export function filterDocuments(docs: DocumentItem[], filters: Filters): DocumentItem[] {
  let result = [...docs];

  if (filters.q) {
    const q = filters.q.toLowerCase().trim();
    result = result.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        (doc.description?.toLowerCase().includes(q) ?? false) ||
        (doc.postText?.toLowerCase().includes(q) ?? false) ||
        (doc.tags?.some((t) => t.toLowerCase().includes(q)) ?? false)
    );
  }

  if (filters.school) {
    result = result.filter((doc) => doc.school === filters.school);
  }

  if (filters.subject) {
    result = result.filter((doc) => doc.subject === filters.subject || doc.category === filters.subject);
  }

  if (filters.kind) {
    result = result.filter((doc) => doc.kind === filters.kind);
  }

  if (filters.year) {
    result = result.filter((doc) => doc.year === filters.year);
  }

  if (filters.sort) {
    if (filters.sort === 'newest') {
      result.sort((a, b) => b.id.localeCompare(a.id));
    } else if (filters.sort === 'oldest') {
      result.sort((a, b) => a.id.localeCompare(b.id));
    } else if (filters.sort === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    }
  }

  return result;
}

export function normalize(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}

export interface UploadFields {
  title: string;
  caption?: string;
  school: string;
  subject: string;
  kind: string;
  year: string;
  rights?: boolean;
}

export interface UploadErrors {
  title?: string;
  caption?: string;
  school?: string;
  subject?: string;
  kind?: string;
  year?: string;
  rights?: string;
  file?: string;
}

export function fileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function validateTaxonomyField(
  raw: string,
  minLen: number,
  maxLen: number,
  emptyMsg: string,
  fieldLabel: string
): string | undefined {
  const trimmed = (raw || '').trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return emptyMsg;
  }
  if (trimmed.length < minLen || trimmed.length > maxLen) {
    return `${fieldLabel} phải có độ dài từ ${minLen} đến ${maxLen} ký tự.`;
  }
  const letters = trimmed.match(/\p{L}/gu) || [];
  if (letters.length < 2) {
    return `${fieldLabel} không hợp lệ (phải chứa ít nhất 2 chữ cái, không chỉ gồm số hoặc ký tự đặc biệt).`;
  }
  if (/^(.)\1{4,}$/u.test(trimmed.replace(/\s+/g, ''))) {
    return `${fieldLabel} không hợp lệ (chứa ký tự lặp vô nghĩa).`;
  }
  // Không cho phép chứa các ký tự điều khiển hoặc ký tự lạ gây lỗi
  if (/[<>{}[\]\\^`|~]/.test(trimmed)) {
    return `${fieldLabel} chứa ký tự đặc biệt không hợp lệ.`;
  }
  return undefined;
}

export function validateAcademicYear(raw: string): string | undefined {
  const trimmed = (raw || '').trim();
  if (!trimmed) {
    return 'Vui lòng chọn hoặc tự nhập năm học.';
  }
  const compact = trimmed.replace(/\s+/g, '');
  const maxYear = Math.max(2027, new Date().getFullYear() + 1);

  if (/^\d{4}$/.test(compact)) {
    const yearNum = Number(compact);
    if (yearNum < 1990 || yearNum > maxYear) {
      return `Năm học phải nằm trong khoảng từ 1990 đến ${maxYear}.`;
    }
    return undefined;
  }

  if (/^\d{4}[-/]\d{4}$/.test(compact)) {
    const [startStr, endStr] = compact.split(/[-/]/);
    const startYear = Number(startStr);
    const endYear = Number(endStr);
    if (startYear < 1990 || endYear > maxYear) {
      return `Niên khóa phải nằm trong khoảng từ 1990 đến ${maxYear}.`;
    }
    if (endYear < startYear || endYear - startYear > 6) {
      return 'Niên khóa không hợp lệ (năm kết thúc phải lớn hơn hoặc bằng năm bắt đầu, VD: 2025-2026).';
    }
    return undefined;
  }

  return `Năm học không hợp lệ. Vui lòng nhập năm (VD: 2026) hoặc niên khóa (VD: 2025-2026) trong khoảng 1990–${maxYear}.`;
}

export function validateUpload(fields: UploadFields, fileOrFiles: File | File[] | null): UploadErrors {
  const errors: UploadErrors = {};
  const files: File[] = Array.isArray(fileOrFiles)
    ? fileOrFiles
    : fileOrFiles
      ? [fileOrFiles]
      : [];

  if (files.length === 0) {
    errors.file = 'Vui lòng chọn ít nhất 1 tệp tài liệu để chia sẻ.';
  } else if (files.length > MAX_UPLOAD_FILES) {
    errors.file = `Chỉ được chọn tối đa ${MAX_UPLOAD_FILES} tệp trong 1 lần đăng tải.`;
  } else {
    let totalBytes = 0;
    for (const f of files) {
      totalBytes += f.size;
      const ext = getFileExtension(f.name);
      if (!ALLOWED_UPLOAD_EXTENSIONS.includes(ext as any)) {
        errors.file = `Định dạng tệp "${f.name}" không được hỗ trợ. Chỉ nhận: PDF, DOCX, XLSX, PPTX, CSV, TXT, PNG, JPG, WEBP.`;
        break;
      }
      if (f.size > MAX_SINGLE_FILE_BYTES) {
        errors.file = `Tệp "${f.name}" vượt quá dung lượng tối đa 25 MB / tệp.`;
        break;
      }
    }
    if (!errors.file && totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
      errors.file = 'Tổng dung lượng các tệp vượt quá giới hạn 50 MB / lần đăng.';
    }
  }

  const trimmedTitle = (fields.title || '').trim();
  if (!trimmedTitle) {
    errors.title = 'Vui lòng nhập tiêu đề tài liệu.';
  } else if (trimmedTitle.length < 3) {
    errors.title = 'Tiêu đề tài liệu phải có ít nhất 3 ký tự.';
  }

  const schoolErr = validateTaxonomyField(
    fields.school,
    3,
    150,
    'Vui lòng chọn hoặc tự nhập trường đại học.',
    'Tên trường đại học'
  );
  if (schoolErr) {
    errors.school = schoolErr;
  }

  const subjectErr = validateTaxonomyField(
    fields.subject,
    2,
    150,
    'Vui lòng chọn hoặc tự nhập môn học.',
    'Tên môn học'
  );
  if (subjectErr) {
    errors.subject = subjectErr;
  }

  if (!fields.kind) {
    errors.kind = 'Vui lòng chọn loại tài liệu.';
  }

  const yearErr = validateAcademicYear(fields.year);
  if (yearErr) {
    errors.year = yearErr;
  }

  return errors;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
