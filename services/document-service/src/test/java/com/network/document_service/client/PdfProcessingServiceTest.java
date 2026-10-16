package com.network.document_service.client;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

class PdfProcessingServiceTest {

    private final PdfProcessingService pdfService = new PdfProcessingService();

    @Test
    void testExtractTotalPagesAndGenerateThumbnail() throws IOException {
        byte[] pdfBytes;
        try (PDDocument doc = new PDDocument()) {
            doc.addPage(new PDPage());
            doc.addPage(new PDPage());
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            pdfBytes = baos.toByteArray();
        }

        int pages = pdfService.extractTotalPages(pdfBytes);
        assertEquals(2, pages);

        int streamPages = pdfService.extractTotalPages(new ByteArrayInputStream(pdfBytes));
        assertEquals(2, streamPages);

        byte[] thumbnail = pdfService.generateThumbnailPng(pdfBytes);
        assertNotNull(thumbnail);
        assertTrue(thumbnail.length > 0);

        byte[] streamThumbnail = pdfService.generateThumbnailPng(new ByteArrayInputStream(pdfBytes));
        assertNotNull(streamThumbnail);
        assertTrue(streamThumbnail.length > 0);

        byte[] preview = pdfService.generatePreviewPdf(pdfBytes, 1);
        assertNotNull(preview);
        int previewPages = pdfService.extractTotalPages(preview);
        assertEquals(1, previewPages);
    }
}
