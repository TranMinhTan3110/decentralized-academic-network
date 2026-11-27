export type PreviewFormat = 'PDF' | 'DOCX' | 'EXCEL' | 'PPTX' | 'OTHER';

interface PreviewFormatInput {
    fileExtension?: string | null;
    attachmentExtension?: string | null;
    title?: string | null;
}

const normalizeExt = (value?: string | null): string =>
    (value || '').toLowerCase().replace(/^\./, '').trim();

const extFromName = (value?: string | null): string => {
    const match = normalizeExt(value).match(/\.([a-z0-9]+)$/);
    return match ? match[1] : '';
};

const FORMAT_BY_EXTENSION: Record<string, PreviewFormat> = {
    pdf: 'PDF',
    doc: 'DOCX',
    docx: 'DOCX',
    xls: 'EXCEL',
    xlsx: 'EXCEL',
    csv: 'EXCEL',
    ppt: 'PPTX',
    pptx: 'PPTX',
};

function formatFromTitle(title: string): PreviewFormat | null {
    const lower = title.toLowerCase();
    if (lower.endsWith('.pptx') || lower.endsWith('.ppt') || lower.includes('powerpoint') || lower.includes('bài trình chiếu') || lower.includes('presentation')) {
        return 'PPTX';
    }
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv') || lower.includes('excel') || lower.includes('bảng tính')) {
        return 'EXCEL';
    }
    if (lower.endsWith('.docx') || lower.endsWith('.doc') || lower.includes('word')) {
        return 'DOCX';
    }
    if (lower.endsWith('.pdf')) {
        return 'PDF';
    }
    return null;
}

/**
 * Xác định trình xem phù hợp. Trả về `OTHER` khi không nhận diện được loại tệp:
 * khi đó modal phải dùng bản PDF chuyển đổi từ backend thay vì nhúng thẳng tệp gốc
 * (nhúng tệp Office vào iframe khiến trình duyệt tải xuống thay vì hiển thị).
 */
export function resolvePreviewFormat(input: PreviewFormatInput): {
    format: PreviewFormat;
    extension: string;
} {
    const extension =
        normalizeExt(input.fileExtension) ||
        normalizeExt(input.attachmentExtension) ||
        extFromName(input.title);

    if (extension) {
        return {
            format: FORMAT_BY_EXTENSION[extension] ?? 'OTHER',
            extension,
        };
    }

    const fromTitle = formatFromTitle(input.title || '');
    return {
        format: fromTitle ?? 'OTHER',
        extension: '',
    };
}
