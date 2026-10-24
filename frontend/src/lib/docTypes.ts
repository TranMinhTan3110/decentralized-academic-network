/**
 * Canonical document-type enum shared with the backend DocumentUploadRequest.docType.
 * The backend stores docType as a free string; both sides must use these values.
 */
export interface DocTypeOption {
  value: string;
  label: string;
}

export const DOC_TYPES: DocTypeOption[] = [
  { value: 'SUMMARY', label: 'Tóm tắt / Ghi chép' },
  { value: 'SLIDE', label: 'Slide bài giảng' },
  { value: 'EXAM', label: 'Đề thi' },
  { value: 'EXERCISE', label: 'Bài tập' },
  { value: 'TEXTBOOK', label: 'Giáo trình' },
  { value: 'SYLLABUS', label: 'Giảng đề' },
  { value: 'OTHER', label: 'Khác' },
];

export function docTypeLabel(value?: string | null): string {
  if (!value) return 'Tài liệu';
  return DOC_TYPES.find((t) => t.value === value)?.label ?? value;
}
