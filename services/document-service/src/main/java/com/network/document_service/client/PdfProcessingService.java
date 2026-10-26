package com.network.document_service.client;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;

@Service
public class PdfProcessingService {

    public int extractTotalPages(byte[] pdfBytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes))) {
            return document.getNumberOfPages();
        }
    }

    public int extractTotalPages(InputStream pdfStream) throws IOException {
        File tempFile = File.createTempFile("pdf-page-count-", ".tmp");
        try {
            try (FileOutputStream fos = new FileOutputStream(tempFile)) {
                pdfStream.transferTo(fos);
            }
            try (PDDocument document = Loader.loadPDF(tempFile)) {
                return document.getNumberOfPages();
            }
        } finally {
            if (tempFile.exists()) {
                tempFile.delete();
            }
        }
    }

    public byte[] generateThumbnailPng(byte[] pdfBytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes))) {
            return renderFirstPage(document);
        }
    }

    public byte[] generateThumbnailPng(InputStream pdfStream) throws IOException {
        File tempFile = File.createTempFile("pdf-thumbnail-", ".tmp");
        try {
            try (FileOutputStream fos = new FileOutputStream(tempFile)) {
                pdfStream.transferTo(fos);
            }
            try (PDDocument document = Loader.loadPDF(tempFile)) {
                return renderFirstPage(document);
            }
        } finally {
            if (tempFile.exists()) {
                tempFile.delete();
            }
        }
    }

    public byte[] generatePreviewPdf(byte[] originalPdfBytes, int maxPages) throws IOException {
        try (PDDocument originalDoc = Loader.loadPDF(new RandomAccessReadBuffer(originalPdfBytes));
             PDDocument previewDoc = new PDDocument()) {
            int pagesToInclude = Math.min(originalDoc.getNumberOfPages(), maxPages);
            for (int i = 0; i < pagesToInclude; i++) {
                org.apache.pdfbox.pdmodel.PDPage sourcePage = originalDoc.getPage(i);
                org.apache.pdfbox.pdmodel.PDPage importedPage = previewDoc.importPage(sourcePage);
                if (sourcePage.getCropBox() != null) {
                    importedPage.setCropBox(sourcePage.getCropBox());
                }
                if (sourcePage.getMediaBox() != null) {
                    importedPage.setMediaBox(sourcePage.getMediaBox());
                }
                importedPage.setRotation(sourcePage.getRotation());
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            previewDoc.save(baos);
            return baos.toByteArray();
        }
    }

    private byte[] renderFirstPage(PDDocument document) throws IOException {
        if (document.getNumberOfPages() < 1) {
            return new byte[0];
        }
        PDFRenderer renderer = new PDFRenderer(document);
        BufferedImage image = renderer.renderImageWithDPI(0, 150);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", baos);
        return baos.toByteArray();
    }
}
