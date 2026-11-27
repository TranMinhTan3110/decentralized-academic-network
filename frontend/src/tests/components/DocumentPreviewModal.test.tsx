import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentPreviewModal } from '../../pages/admin/AdminDocumentsPage/components/DocumentPreviewModal';
import { documentService } from '../../services/documentService';
import type { AdminDocument } from '../../pages/admin/AdminDocumentsPage/types';

const baseDoc: AdminDocument = {
    id: 'doc-pptx',
    title: 'Bài trình chiếu kiểm thử PPTX',
    cid: 'bafy-test-pptx',
    size: '1.0 MB',
    faculty: 'Khoa học & Kỹ thuật',
    univ: 'Đại học Bách Khoa',
    author: 'Tác giả',
    authorTitle: 'Scholar',
    reads: 0,
    likes: 0,
    comments: 0,
    bookmarks: 0,
    createdAt: '2026-11-25',
    status: 'PUBLISHED',
    fileExtension: 'pptx',
};

const renderModal = (doc: AdminDocument) =>
    render(
        <DocumentPreviewModal
            isOpen
            document={doc}
            onClose={() => {}}
            onDelete={() => {}}
            onCopyCid={() => {}}
            copiedCid={null}
        />
    );

describe('DocumentPreviewModal format handling', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(documentService, 'getDetail').mockResolvedValue({
            id: 'doc-pptx',
            title: 'Bài trình chiếu kiểm thử PPTX',
            fileExtension: 'pptx',
            attachments: [],
        } as any);
    });

    it('renders PowerPoint documents with PptxViewer instead of a raw iframe', async () => {
        renderModal(baseDoc);

        expect(await screen.findByText('Bài trình chiếu Microsoft PowerPoint (.pptx)')).toBeInTheDocument();
        expect(screen.getByTestId('pptx-viewer')).toBeInTheDocument();
        expect(screen.queryByText('Tài liệu PDF (.pdf)')).not.toBeInTheDocument();
    });

    it('renders unknown formats through the converted PDF preview, never the raw file iframe', async () => {
        vi.spyOn(documentService, 'getDetail').mockResolvedValue({
            id: 'doc-zip',
            title: 'Tài liệu nén',
            fileExtension: 'zip',
            attachments: [],
        } as any);
        renderModal({ ...baseDoc, id: 'doc-zip', title: 'Tài liệu nén', fileExtension: 'zip' });

        expect(await screen.findByText('Bản xem trước tài liệu')).toBeInTheDocument();
        const frame = screen.getByTitle('Tài liệu nén') as HTMLIFrameElement;
        expect(frame.getAttribute('src')).toContain('/attachments/0/preview');
    });
});
