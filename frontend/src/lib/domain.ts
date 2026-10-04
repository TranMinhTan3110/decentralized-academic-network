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
