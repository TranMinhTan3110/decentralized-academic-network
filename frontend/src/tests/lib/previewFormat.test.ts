import { describe, it, expect } from 'vitest';
import { resolvePreviewFormat } from '../../lib/previewFormat';

describe('resolvePreviewFormat', () => {
    it('detects Office formats from the extension', () => {
        expect(resolvePreviewFormat({ fileExtension: 'pptx' }).format).toBe('PPTX');
        expect(resolvePreviewFormat({ fileExtension: '.PPT' }).format).toBe('PPTX');
        expect(resolvePreviewFormat({ fileExtension: 'xlsx' }).format).toBe('EXCEL');
        expect(resolvePreviewFormat({ fileExtension: 'csv' }).format).toBe('EXCEL');
        expect(resolvePreviewFormat({ fileExtension: 'docx' }).format).toBe('DOCX');
        expect(resolvePreviewFormat({ fileExtension: 'pdf' }).format).toBe('PDF');
    });

    it('falls back to the attachment extension when the document has none', () => {
        const result = resolvePreviewFormat({ attachmentExtension: 'pptx' });
        expect(result.format).toBe('PPTX');
        expect(result.extension).toBe('pptx');
    });

    it('reads the extension from the document title as a last resort', () => {
        expect(resolvePreviewFormat({ title: 'Bài giảng tuần 3.pptx' }).format).toBe('PPTX');
        expect(resolvePreviewFormat({ title: 'Bang diem.xlsx' }).format).toBe('EXCEL');
    });

    it('detects PowerPoint from keywords in the title', () => {
        expect(resolvePreviewFormat({ title: 'PowerPoint giới thiệu môn học' }).format).toBe('PPTX');
    });

    it('returns OTHER for unknown or missing formats so callers avoid raw iframes', () => {
        expect(resolvePreviewFormat({ fileExtension: 'zip' }).format).toBe('OTHER');
        expect(resolvePreviewFormat({ title: 'Tài liệu không rõ định dạng' }).format).toBe('OTHER');
        expect(resolvePreviewFormat({}).format).toBe('OTHER');
    });
});
