import type { DocumentItem } from '../data/documents';

export interface Filters {
  q?: string;
  school?: string;
  subject?: string;
  kind?: string;
  year?: string;
  sort?: string;
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
  school: string;
  subject: string;
  kind: string;
  year: string;
  rights: boolean;
}

export interface UploadErrors {
  title?: string;
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

export function validateUpload(fields: UploadFields, file: File | null): UploadErrors {
  const errors: UploadErrors = {};
  if (!file) {
    errors.file = 'Vui lòng chọn file PDF để chia sẻ.';
  } else if (file.size > 20 * 1024 * 1024) {
    errors.file = 'Dung lượng file vượt quá giới hạn 20 MB.';
  }
  if (!fields.title.trim()) {
    errors.title = 'Vui lòng nhập tiêu đề tài liệu.';
  }
  if (!fields.school.trim()) {
    errors.school = 'Vui lòng chọn hoặc tự nhập trường đại học.';
  }
  if (!fields.subject.trim()) {
    errors.subject = 'Vui lòng chọn hoặc tự nhập môn học.';
  }
  if (!fields.kind) {
    errors.kind = 'Vui lòng chọn loại tài liệu.';
  }
  if (!fields.year) {
    errors.year = 'Vui lòng chọn năm học.';
  }
  if (!fields.rights) {
    errors.rights = 'Bạn phải xác nhận quyền chia sẻ tài liệu.';
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
