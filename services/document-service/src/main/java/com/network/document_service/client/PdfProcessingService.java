package com.network.document_service.client;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class PdfProcessingService {

    private static final Pattern XML_TEXT_PATTERN = Pattern.compile("<(?:w:t|a:t|t|v)(?:\\s[^>]*)?>([^<]+)</(?:w:t|a:t|t|v)>");

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
                PDPage sourcePage = originalDoc.getPage(i);
                PDPage importedPage = previewDoc.importPage(sourcePage);
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

    /**
     * Tự động gộp danh sách các file ảnh (.png, .jpg, .jpeg, .webp) thành 1 file PDF đa trang chuẩn A4.
     */
    public byte[] mergeImagesToPdf(List<byte[]> imageBytesList) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            for (byte[] imgBytes : imageBytesList) {
                PDImageXObject pdImage = null;
                try {
                    pdImage = PDImageXObject.createFromByteArray(doc, imgBytes, "page_img");
                } catch (Exception ex) {
                    BufferedImage bImg = ImageIO.read(new ByteArrayInputStream(imgBytes));
                    if (bImg != null) {
                        pdImage = LosslessFactory.createFromImage(doc, bImg);
                    }
                }
                if (pdImage == null) {
                    continue;
                }

                PDRectangle pageSize = PDRectangle.A4;
                PDPage page = new PDPage(pageSize);
                doc.addPage(page);

                float pageW = pageSize.getWidth();
                float pageH = pageSize.getHeight();
                float margin = 24f;
                float availW = pageW - margin * 2;
                float availH = pageH - margin * 2;

                float imgW = pdImage.getWidth();
                float imgH = pdImage.getHeight();
                float scale = Math.min(availW / Math.max(1f, imgW), availH / Math.max(1f, imgH));
                float drawW = imgW * scale;
                float drawH = imgH * scale;
                float x = (pageW - drawW) / 2f;
                float y = (pageH - drawH) / 2f;

                try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                    cs.drawImage(pdImage, x, y, drawW, drawH);
                }
            }

            if (doc.getNumberOfPages() == 0) {
                doc.addPage(new PDPage(PDRectangle.A4));
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    /**
     * Tạo bản PDF xem trước (Preview PDF) hỗ trợ đầy đủ tiếng Việt cho các định dạng Office/Text (.docx, .xlsx, .pptx, .csv, .txt).
     */
    public byte[] generateOfficeOrTextPreviewPdf(String title, String extension, byte[] fileBytes, int maxPages) throws IOException {
        List<String> lines = extractTextLinesFromOfficeOrText(fileBytes, extension);
        if (lines.isEmpty()) {
            lines.add("Tài liệu định dạng ." + extension.toUpperCase() + ": " + title);
        }

        int linesPerPage = 26;
        int totalEstimatedPages = Math.max(1, (int) Math.ceil((double) lines.size() / linesPerPage));
        int pagesToRender = Math.min(Math.max(1, maxPages), Math.min(5, totalEstimatedPages));

        try (PDDocument doc = new PDDocument()) {
            for (int p = 0; p < pagesToRender; p++) {
                int startIdx = p * linesPerPage;
                int endIdx = Math.min(lines.size(), startIdx + linesPerPage);
                List<String> pageLines = startIdx < endIdx ? lines.subList(startIdx, endIdx) : List.of();

                BufferedImage pageImg = renderTextPageImage(title, extension, pageLines, p + 1, totalEstimatedPages);
                PDPage page = new PDPage(PDRectangle.A4);
                doc.addPage(page);
                PDImageXObject pdImage = LosslessFactory.createFromImage(doc, pageImg);
                try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                    cs.drawImage(pdImage, 0, 0, PDRectangle.A4.getWidth(), PDRectangle.A4.getHeight());
                }
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private List<String> extractTextLinesFromOfficeOrText(byte[] fileBytes, String ext) {
        List<String> lines = new ArrayList<>();
        String lowerExt = ext != null ? ext.toLowerCase() : "txt";

        if ("csv".equals(lowerExt) || "txt".equals(lowerExt)) {
            String content = new String(fileBytes, StandardCharsets.UTF_8).replace("\0", "");
            for (String rawLine : content.split("\\r?\\n")) {
                String trimmed = rawLine.trim();
                if (!trimmed.isEmpty()) {
                    lines.add(trimmed.length() > 95 ? trimmed.substring(0, 95) + "..." : trimmed);
                }
                if (lines.size() >= 120) break;
            }
            return lines;
        }

        // Trích xuất văn bản từ gói OpenXML (.docx, .xlsx, .pptx)
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(fileBytes))) {
            ZipEntry entry;
            StringBuilder extractedBuilder = new StringBuilder();
            while ((entry = zis.getNextEntry()) != null) {
                String name = entry.getName();
                if (name.equals("word/document.xml")
                        || name.startsWith("ppt/slides/slide")
                        || name.equals("xl/sharedStrings.xml")
                        || name.startsWith("xl/worksheets/sheet")) {
                    String xml = new String(zis.readAllBytes(), StandardCharsets.UTF_8);
                    Matcher m = XML_TEXT_PATTERN.matcher(xml);
                    while (m.find()) {
                        String token = m.group(1)
                                .replace("&amp;", "&")
                                .replace("&lt;", "<")
                                .replace("&gt;", ">")
                                .replace("&quot;", "\"")
                                .replace("&apos;", "'")
                                .trim();
                        if (!token.isEmpty()) {
                            extractedBuilder.append(token).append(" ");
                            if (extractedBuilder.length() >= 85) {
                                lines.add(extractedBuilder.toString().trim());
                                extractedBuilder.setLength(0);
                                if (lines.size() >= 120) break;
                            }
                        }
                    }
                }
                if (lines.size() >= 120) break;
            }
            if (extractedBuilder.length() > 0 && lines.size() < 120) {
                lines.add(extractedBuilder.toString().trim());
            }
        } catch (Exception ignored) {
        }
        return lines;
    }

    private BufferedImage renderTextPageImage(String title, String ext, List<String> lines, int pageNum, int totalPages) {
        int width = 794;
        int height = 1123;
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        // Nền trang trắng
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, width, height);

        // Thanh Header học liệu
        g.setColor(new Color(240, 249, 255));
        g.fillRect(0, 0, width, 110);
        g.setColor(new Color(2, 132, 199));
        g.fillRect(0, 107, width, 3);

        // Nhãn định dạng (.DOCX / .XLSX / .PPTX / .CSV / .TXT)
        g.setFont(new Font("SansSerif", Font.BOLD, 13));
        g.setColor(new Color(2, 132, 199));
        g.drawString("BẢN XEM TRƯỚC HỌC LIỆU · ĐỊNH DẠNG ." + (ext != null ? ext.toUpperCase() : "FILE"), 48, 40);

        // Tiêu đề tài liệu
        g.setFont(new Font("SansSerif", Font.BOLD, 20));
        g.setColor(new Color(15, 23, 42));
        String safeTitle = title != null && title.length() > 55 ? title.substring(0, 55) + "..." : (title != null ? title : "Tài liệu học thuật");
        g.drawString(safeTitle, 48, 76);

        // Nội dung văn bản
        g.setFont(new Font("SansSerif", Font.PLAIN, 15));
        g.setColor(new Color(51, 65, 85));
        int y = 160;
        for (String line : lines) {
            g.drawString(line, 48, y);
            y += 32;
            if (y > height - 80) break;
        }

        // Footer số trang
        g.setFont(new Font("SansSerif", Font.ITALIC, 12));
        g.setColor(new Color(100, 116, 139));
        g.drawString("Mạng lưới Học thuật Phi tập trung DeDocu — Trang đọc thử " + pageNum + "/" + totalPages, 48, height - 36);

        g.dispose();
        return img;
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
