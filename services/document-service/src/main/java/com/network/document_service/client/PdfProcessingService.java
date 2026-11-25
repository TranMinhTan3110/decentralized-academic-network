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

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PdfProcessingService.class);

    private static final Pattern XML_TEXT_PATTERN = Pattern.compile("<(?:w:t|a:t|t|v)(?:\\s[^>]*)?>([^<]+)</(?:w:t|a:t|t|v)>");
    private static final int MAX_NATIVE_PDF_CACHE_ENTRIES = 20;
    private final java.util.Map<String, byte[]> nativePptxPdfCache = new java.util.concurrent.ConcurrentHashMap<>();
    /**
     * Giới hạn tối đa 1 tiến trình Office/LibreOffice chạy đồng thời để tránh tăng đột biến RAM trên EC2 t3.small (2GB).
     */
    private final java.util.concurrent.Semaphore officeConversionSemaphore = new java.util.concurrent.Semaphore(1, true);

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
     * Tạo bản PDF xem trước (Preview PDF) chất lượng cao:
     * - Đối với .docx / .doc: Ưu tiên dùng engine Microsoft Word COM (WINWORD.EXE) hoặc LibreOffice headless để tạo bản PDF giữ nguyên 100% bố cục, hình ảnh, font chữ và căn lề.
     * - Fallback cho các định dạng khác hoặc khi môi trường không có Office: Trích xuất văn bản và render qua Graphics2D.
     */
    public byte[] generateOfficeOrTextPreviewPdf(String title, String extension, byte[] fileBytes, int maxPages) throws IOException {
        String lowerExt = extension != null ? extension.toLowerCase().trim() : "";
        if ("docx".equals(lowerExt) || "doc".equals(lowerExt)) {
            try {
                byte[] nativePdf = convertOfficeDocxToPdfNative(fileBytes, lowerExt);
                if (nativePdf != null && nativePdf.length > 0) {
                    if (maxPages > 0) {
                        return generatePreviewPdf(nativePdf, maxPages);
                    }
                    return nativePdf;
                }
            } catch (Exception ex) {
                log.warn("Native docx to pdf conversion failed, falling back to text rendering: {}", ex.getMessage());
            }
        }

        if ("pptx".equals(lowerExt) || "ppt".equals(lowerExt)) {
            try {
                byte[] nativePdf = convertOfficePptxToPdfNative(fileBytes, lowerExt);
                if (nativePdf != null && nativePdf.length > 0) {
                    if (maxPages > 0) {
                        return generatePreviewPdf(nativePdf, maxPages);
                    }
                    return nativePdf;
                }
            } catch (Exception ex) {
                log.warn("Native pptx to pdf conversion failed, falling back to text rendering: {}", ex.getMessage());
            }
        }

        if ("xlsx".equals(lowerExt) || "xls".equals(lowerExt) || "csv".equals(lowerExt)) {
            try {
                byte[] nativePdf = convertOfficeExcelToPdfNative(fileBytes, lowerExt);
                if (nativePdf != null && nativePdf.length > 0) {
                    if (maxPages > 0) {
                        return generatePreviewPdf(nativePdf, maxPages);
                    }
                    return nativePdf;
                }
            } catch (Exception ex) {
                log.warn("Native excel/csv to pdf conversion failed, falling back to text rendering: {}", ex.getMessage());
            }
        }

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

        if ("csv".equals(lowerExt)) {
            String content = new String(fileBytes, StandardCharsets.UTF_8).replace("\0", "");
            for (String rawLine : content.split("\\r?\\n")) {
                String trimmed = rawLine.trim();
                if (!trimmed.isEmpty()) {
                    String[] cells = trimmed.split("[,;\\t]");
                    StringBuilder rowBuilder = new StringBuilder();
                    for (int c = 0; c < cells.length; c++) {
                        String cell = cells[c].trim().replace("\"", "");
                        if (cell.length() > 22) cell = cell.substring(0, 19) + "...";
                        if (c > 0) rowBuilder.append(" | ");
                        rowBuilder.append(cell);
                    }
                    String rowText = rowBuilder.toString();
                    lines.add(rowText.length() > 95 ? rowText.substring(0, 92) + "..." : rowText);
                }
                if (lines.size() >= 120) break;
            }
            return lines;
        }

        if ("txt".equals(lowerExt)) {
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

        if ("xlsx".equals(lowerExt) || "xls".equals(lowerExt)) {
            List<String> spreadsheetRows = extractSpreadsheetRowsFromXlsx(fileBytes);
            if (!spreadsheetRows.isEmpty()) {
                return spreadsheetRows;
            }
        }

        // Trích xuất văn bản từ gói OpenXML (.docx, .pptx hoặc fallback)
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
                        String token = unescapeXml(m.group(1));
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

    private List<String> extractSpreadsheetRowsFromXlsx(byte[] fileBytes) {
        List<String> rows = new ArrayList<>();
        List<String> sharedStrings = new ArrayList<>();
        String sheetXml = null;

        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(fileBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                String name = entry.getName();
                if ("xl/sharedStrings.xml".equals(name)) {
                    String xml = new String(zis.readAllBytes(), StandardCharsets.UTF_8);
                    Matcher sm = Pattern.compile("<t[^>]*>(.*?)</t>", Pattern.DOTALL).matcher(xml);
                    while (sm.find()) {
                        sharedStrings.add(unescapeXml(sm.group(1)));
                    }
                } else if (sheetXml == null && (name.equals("xl/worksheets/sheet1.xml") || name.startsWith("xl/worksheets/sheet"))) {
                    sheetXml = new String(zis.readAllBytes(), StandardCharsets.UTF_8);
                }
            }
        } catch (Exception ignored) {
            return rows;
        }

        if (sheetXml != null) {
            Matcher rowMatcher = Pattern.compile("<row[^>]*>(.*?)</row>", Pattern.DOTALL).matcher(sheetXml);
            while (rowMatcher.find()) {
                String rowContent = rowMatcher.group(1);
                Matcher cellMatcher = Pattern.compile("<c[^>]*?(?:\\st=\"([^\"]+)\")?[^>]*>(?:<v>([^<]*)</v>)?(?:<is><t[^>]*>([^<]*)</t></is>)?</c>", Pattern.DOTALL).matcher(rowContent);
                List<String> cellValues = new ArrayList<>();
                while (cellMatcher.find()) {
                    String type = cellMatcher.group(1);
                    String val = cellMatcher.group(2);
                    String inline = cellMatcher.group(3);
                    String text = "";
                    if (inline != null && !inline.isEmpty()) {
                        text = unescapeXml(inline);
                    } else if (val != null) {
                        if ("s".equals(type)) {
                            try {
                                int sIdx = Integer.parseInt(val.trim());
                                if (sIdx >= 0 && sIdx < sharedStrings.size()) {
                                    text = sharedStrings.get(sIdx);
                                }
                            } catch (NumberFormatException ignored) {}
                        } else {
                            text = val.trim();
                        }
                    }
                    if (text.length() > 22) text = text.substring(0, 19) + "...";
                    if (!text.isEmpty()) {
                        cellValues.add(text);
                    }
                }
                if (!cellValues.isEmpty()) {
                    String formattedRow = String.join(" | ", cellValues);
                    if (formattedRow.length() > 95) {
                        formattedRow = formattedRow.substring(0, 92) + "...";
                    }
                    rows.add(formattedRow);
                    if (rows.size() >= 120) break;
                }
            }
        }
        return rows;
    }

    private String unescapeXml(String text) {
        if (text == null) return "";
        return text
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&apos;", "'")
                .trim();
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

        // Thanh Header học liệu (Bảng tính dùng tông xanh Excel, tài liệu khác dùng tông xanh học thuật)
        boolean isSpreadsheet = "xlsx".equalsIgnoreCase(ext) || "xls".equalsIgnoreCase(ext) || "csv".equalsIgnoreCase(ext);
        g.setColor(isSpreadsheet ? new Color(236, 253, 245) : new Color(240, 249, 255));
        g.fillRect(0, 0, width, 110);
        g.setColor(isSpreadsheet ? new Color(5, 150, 105) : new Color(2, 132, 199));
        g.fillRect(0, 107, width, 3);

        // Nhãn định dạng (.DOCX / .XLSX / .PPTX / .CSV / .TXT)
        g.setFont(new Font("SansSerif", Font.BOLD, 13));
        g.setColor(isSpreadsheet ? new Color(4, 120, 87) : new Color(2, 132, 199));
        String headerLabel = isSpreadsheet
                ? "BẢNG TÍNH HỌC THUẬT · ĐỊNH DẠNG ." + (ext != null ? ext.toUpperCase() : "XLSX")
                : "BẢN XEM TRƯỚC HỌC LIỆU · ĐỊNH DẠNG ." + (ext != null ? ext.toUpperCase() : "FILE");
        g.drawString(headerLabel, 48, 40);

        // Tiêu đề tài liệu
        g.setFont(new Font("SansSerif", Font.BOLD, 20));
        g.setColor(new Color(15, 23, 42));
        String safeTitle = title != null && title.length() > 55 ? title.substring(0, 55) + "..." : (title != null ? title : "Tài liệu học thuật");
        g.drawString(safeTitle, 48, 76);

        // Nội dung văn bản
        if (isSpreadsheet) {
            int tableLeft = 36;
            int tableWidth = width - 72;
            int rowHeight = 46;
            int y = 132;
            int maxCols = 3;

            for (int i = 0; i < lines.size(); i++) {
                if (y + rowHeight > height - 70) break;
                String[] rawCols = lines.get(i).split("\\s*\\|\\s*");
                int colCount = Math.max(1, Math.min(rawCols.length, maxCols));
                int colWidth = tableWidth / colCount;

                // Header xanh ngọc đậm rõ nét (nhìn thu nhỏ vẫn thấy ngay bảng tính Excel thật!)
                if (i == 0) {
                    g.setColor(new Color(5, 150, 105));
                } else if (i % 2 == 0) {
                    g.setColor(new Color(241, 245, 249));
                } else {
                    g.setColor(Color.WHITE);
                }
                g.fillRect(tableLeft, y, tableWidth, rowHeight);

                // Viền bảng rõ ràng
                g.setColor(i == 0 ? new Color(4, 120, 87) : new Color(203, 213, 225));
                g.drawRect(tableLeft, y, tableWidth, rowHeight);

                g.setFont(i == 0 ? new Font("SansSerif", Font.BOLD, 18) : new Font("SansSerif", Font.PLAIN, 17));
                for (int c = 0; c < colCount; c++) {
                    int cellX = tableLeft + c * colWidth;
                    if (c > 0) {
                        g.setColor(i == 0 ? new Color(16, 185, 129) : new Color(203, 213, 225));
                        g.drawLine(cellX, y, cellX, y + rowHeight);
                    }
                    String cellText = rawCols[c].trim();
                    int maxChars = Math.max(8, colWidth / 11);
                    if (cellText.length() > maxChars) {
                        cellText = cellText.substring(0, maxChars - 2) + "..";
                    }
                    g.setColor(i == 0 ? Color.WHITE : new Color(30, 41, 59));
                    g.drawString(cellText, cellX + 14, y + 30);
                }
                y += rowHeight;
            }
        } else {
            // Typography rõ nét, cỡ chữ lớn và thoáng để khi thu nhỏ thành thumbnail 80x80px không bị bết/nhòe
            Font normalFont = new Font("SansSerif", Font.PLAIN, 19);
            g.setFont(normalFont);
            g.setColor(new Color(30, 41, 59));

            int y = 166;
            for (int i = 0; i < lines.size(); i++) {
                String line = lines.get(i);
                if (line.length() > 68) {
                    line = line.substring(0, 65) + "...";
                }
                g.drawString(line, 50, y);
                y += 40;
                if (y > height - 80) break;
            }
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

    /**
     * Chuyển đổi tệp Office (.docx/.doc/.xlsx/.xls/.csv/.pptx/.ppt) sang PDF qua LibreOffice headless.
     * Áp dụng 3 lớp bảo vệ cho EC2 t3.small (2GB RAM):
     * 1. Semaphore(1): tối đa 1 tiến trình chạy tại một thời điểm, tránh nhân đôi RAM.
     * 2. Profile tạm cô lập (-env:UserInstallation + HOME) và dọn sạch sau khi xong, tránh lock/file rác.
     * 3. Timeout cứng + destroyForcibly để không bao giờ treo server.
     */
    private byte[] convertViaLibreOfficeHeadless(File inputFile, int timeoutSeconds) {
        boolean acquired = false;
        java.nio.file.Path profileDir = null;
        File loPdf = null;
        try {
            acquired = officeConversionSemaphore.tryAcquire(30, java.util.concurrent.TimeUnit.SECONDS);
            if (!acquired) {
                log.warn("Office conversion busy (>30s), skipping LibreOffice for {}", inputFile.getName());
                return null;
            }

            profileDir = java.nio.file.Files.createTempDirectory("lo_profile_");
            File outDir = inputFile.getParentFile();
            ProcessBuilder pb = new ProcessBuilder(
                    "soffice",
                    "--headless",
                    "--nologo",
                    "--nodefault",
                    "--nofirststartwizard",
                    "--norestore",
                    "-env:UserInstallation=" + profileDir.toUri().toString(),
                    "--convert-to", "pdf",
                    "--outdir", outDir.getAbsolutePath(),
                    inputFile.getAbsolutePath()
            );
            pb.environment().put("HOME", profileDir.toAbsolutePath().toString());
            pb.redirectErrorStream(true);
            Process process = pb.start();

            boolean finished = process.waitFor(timeoutSeconds, java.util.concurrent.TimeUnit.SECONDS);
            String baseName = inputFile.getName().replaceAll("\\.[^.]+$", "");
            loPdf = new File(outDir, baseName + ".pdf");

            if (finished && process.exitValue() == 0 && loPdf.exists() && loPdf.length() > 0) {
                log.info("Successfully converted {} to PDF via LibreOffice headless (output size: {} bytes)",
                        inputFile.getName(), loPdf.length());
                return java.nio.file.Files.readAllBytes(loPdf.toPath());
            } else if (!finished) {
                process.destroyForcibly();
                log.warn("LibreOffice conversion timed out after {}s for {}", timeoutSeconds, inputFile.getName());
            } else {
                log.warn("LibreOffice conversion exited with code {} for {}", process.exitValue(), inputFile.getName());
            }
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            log.warn("LibreOffice conversion interrupted for {}", inputFile.getName());
        } catch (Exception ex) {
            log.debug("LibreOffice headless not available or failed for {}: {}", inputFile.getName(), ex.getMessage());
        } finally {
            if (loPdf != null && loPdf.exists()) {
                loPdf.delete();
            }
            if (profileDir != null) {
                deleteDirectoryQuietly(profileDir);
            }
            if (acquired) {
                officeConversionSemaphore.release();
            }
        }
        return null;
    }

    private void deleteDirectoryQuietly(java.nio.file.Path dir) {
        try (java.util.stream.Stream<java.nio.file.Path> walk = java.nio.file.Files.walk(dir)) {
            walk.sorted(java.util.Comparator.reverseOrder())
                    .forEach(p -> {
                        try {
                            java.nio.file.Files.deleteIfExists(p);
                        } catch (Exception ignored) {}
                    });
        } catch (Exception ignored) {}
    }

    public byte[] convertOfficeDocxToPdfNative(byte[] fileBytes) {
        return convertOfficeDocxToPdfNative(fileBytes, "docx");
    }

    public byte[] convertOfficeDocxToPdfNative(byte[] fileBytes, String extension) {
        if (fileBytes == null || fileBytes.length == 0) {
            return null;
        }

        String cacheKey = sha256Hex(fileBytes);
        byte[] cached = cacheKey != null ? nativePptxPdfCache.get("docx_" + cacheKey) : null;
        if (cached != null && cached.length > 0) {
            return cached;
        }

        String suffix = "doc".equalsIgnoreCase(extension) ? ".doc" : ".docx";
        File tempDocx = null;
        File tempPdf = null;
        File tempScript = null;

        try {
            tempDocx = File.createTempFile("docx_native_in_", suffix);
            tempPdf = File.createTempFile("docx_native_out_", ".pdf");
            if (tempPdf.exists()) {
                tempPdf.delete();
            }

            try (FileOutputStream fos = new FileOutputStream(tempDocx)) {
                fos.write(fileBytes);
            }

            boolean isWindows = System.getProperty("os.name", "").toLowerCase().contains("win");
            byte[] converted = null;

            if (isWindows) {
                boolean acquired = officeConversionSemaphore.tryAcquire(30, java.util.concurrent.TimeUnit.SECONDS);
                if (acquired) {
                    try {
                        tempScript = File.createTempFile("docx_native_script_", ".ps1");
                        String psScript = "param([string]$InputPath, [string]$OutputPath)\r\n"
                                + "if (-not $InputPath) { $InputPath = $args[0] }\r\n"
                                + "if (-not $OutputPath) { $OutputPath = $args[1] }\r\n"
                                + "$ErrorActionPreference = 'Stop'\r\n"
                                + "try {\r\n"
                                + "    $word = New-Object -ComObject Word.Application\r\n"
                                + "    $word.Visible = $false\r\n"
                                + "    $word.DisplayAlerts = 0\r\n"
                                + "    $doc = $word.Documents.Open($InputPath, $false, $true)\r\n"
                                + "    $doc.ExportAsFixedFormat($OutputPath, 17)\r\n"
                                + "    $doc.Close([ref]$false)\r\n"
                                + "    $word.Quit()\r\n"
                                + "    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null\r\n"
                                + "    if (Test-Path $OutputPath) { exit 0 }\r\n"
                                + "} catch {\r\n"
                                + "    try {\r\n"
                                + "        $outDir = Split-Path -Parent $OutputPath\r\n"
                                + "        & soffice --headless --convert-to pdf --outdir $outDir $InputPath\r\n"
                                + "        $loOut = Join-Path $outDir ([System.IO.Path]::GetFileNameWithoutExtension($InputPath) + '.pdf')\r\n"
                                + "        if ((Test-Path $loOut) -and ($loOut -ne $OutputPath)) { Move-Item -Force $loOut $OutputPath }\r\n"
                                + "        if (Test-Path $OutputPath) { exit 0 }\r\n"
                                + "    } catch {}\r\n"
                                + "    exit 1\r\n"
                                + "}\r\n";

                        java.nio.file.Files.writeString(tempScript.toPath(), psScript, StandardCharsets.UTF_8);

                        ProcessBuilder pb = new ProcessBuilder(
                                "powershell.exe",
                                "-NoProfile",
                                "-ExecutionPolicy", "Bypass",
                                "-File", tempScript.getAbsolutePath(),
                                tempDocx.getAbsolutePath(),
                                tempPdf.getAbsolutePath()
                        );
                        pb.redirectErrorStream(true);
                        Process process = pb.start();

                        boolean finished = process.waitFor(45, java.util.concurrent.TimeUnit.SECONDS);
                        if (finished && process.exitValue() == 0 && tempPdf.exists() && tempPdf.length() > 0) {
                            log.info("Successfully converted {} to PDF via native Word COM (output size: {} bytes)", suffix, tempPdf.length());
                            converted = java.nio.file.Files.readAllBytes(tempPdf.toPath());
                        } else if (!finished) {
                            process.destroyForcibly();
                            log.warn("Word COM conversion timed out after 45 seconds");
                        } else {
                            log.warn("Word COM conversion exited with code {}", process.exitValue());
                        }
                    } finally {
                        officeConversionSemaphore.release();
                    }
                }
            } else {
                // Linux / macOS / Docker: chạy LibreOffice headless trực tiếp với Semaphore + profile cô lập
                converted = convertViaLibreOfficeHeadless(tempDocx, 35);
            }

            if (converted != null && converted.length > 0 && cacheKey != null) {
                if (nativePptxPdfCache.size() >= MAX_NATIVE_PDF_CACHE_ENTRIES) {
                    nativePptxPdfCache.clear();
                }
                nativePptxPdfCache.put("docx_" + cacheKey, converted);
            }
            return converted;
        } catch (Exception ex) {
            log.warn("Native docx to pdf conversion error: {}", ex.getMessage());
        } finally {
            if (tempDocx != null && tempDocx.exists()) {
                tempDocx.delete();
            }
            if (tempPdf != null && tempPdf.exists()) {
                tempPdf.delete();
            }
            if (tempScript != null && tempScript.exists()) {
                tempScript.delete();
            }
        }
        return null;
    }

    public byte[] convertOfficePptxToPdfNative(byte[] fileBytes, String extension) {
        if (fileBytes == null || fileBytes.length == 0) {
            return null;
        }

        String cacheKey = sha256Hex(fileBytes);
        byte[] cached = cacheKey != null ? nativePptxPdfCache.get(cacheKey) : null;
        if (cached != null && cached.length > 0) {
            return cached;
        }

        String suffix = "ppt".equalsIgnoreCase(extension) ? ".ppt" : ".pptx";
        File tempPptx = null;
        File tempPdf = null;
        File tempScript = null;

        try {
            tempPptx = File.createTempFile("pptx_native_in_", suffix);
            tempPdf = File.createTempFile("pptx_native_out_", ".pdf");
            if (tempPdf.exists()) {
                tempPdf.delete();
            }

            try (FileOutputStream fos = new FileOutputStream(tempPptx)) {
                fos.write(fileBytes);
            }

            boolean isWindows = System.getProperty("os.name", "").toLowerCase().contains("win");
            byte[] converted = null;

            if (isWindows) {
                tempScript = File.createTempFile("pptx_native_script_", ".ps1");
                String psScript = "param([string]$InputPath, [string]$OutputPath)\r\n"
                        + "if (-not $InputPath) { $InputPath = $args[0] }\r\n"
                        + "if (-not $OutputPath) { $OutputPath = $args[1] }\r\n"
                        + "$ErrorActionPreference = 'Stop'\r\n"
                        + "$ppt = $null; $pres = $null\r\n"
                        + "try {\r\n"
                        + "    $ppt = New-Object -ComObject PowerPoint.Application\r\n"
                        + "    $pres = $ppt.Presentations.Open($InputPath, -1, -1, 0)\r\n"
                        + "    $pres.SaveAs($OutputPath, 32)\r\n"
                        + "    if (Test-Path $OutputPath) { exit 0 }\r\n"
                        + "} catch {\r\n"
                        + "    try {\r\n"
                        + "        $outDir = Split-Path -Parent $OutputPath\r\n"
                        + "        & soffice --headless --convert-to pdf --outdir $outDir $InputPath\r\n"
                        + "        $loOut = Join-Path $outDir ([System.IO.Path]::GetFileNameWithoutExtension($InputPath) + '.pdf')\r\n"
                        + "        if ((Test-Path $loOut) -and ($loOut -ne $OutputPath)) { Move-Item -Force $loOut $OutputPath }\r\n"
                        + "        if (Test-Path $OutputPath) { exit 0 }\r\n"
                        + "    } catch {}\r\n"
                        + "    exit 1\r\n"
                        + "} finally {\r\n"
                        + "    if ($pres) { try { $pres.Close() } catch {} }\r\n"
                        + "    if ($ppt) { try { $ppt.Quit() } catch {} ; try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null } catch {} }\r\n"
                        + "}\r\n";

                java.nio.file.Files.writeString(tempScript.toPath(), psScript, StandardCharsets.UTF_8);

                ProcessBuilder pb = new ProcessBuilder(
                        "powershell.exe",
                        "-NoProfile",
                        "-ExecutionPolicy", "Bypass",
                        "-File", tempScript.getAbsolutePath(),
                        tempPptx.getAbsolutePath(),
                        tempPdf.getAbsolutePath()
                );
                pb.redirectErrorStream(true);
                Process process = pb.start();

                boolean finished = process.waitFor(60, java.util.concurrent.TimeUnit.SECONDS);
                if (finished && process.exitValue() == 0 && tempPdf.exists() && tempPdf.length() > 0) {
                    log.info("Successfully converted {} to PDF via native PowerPoint/LibreOffice (output size: {} bytes)", suffix, tempPdf.length());
                    converted = java.nio.file.Files.readAllBytes(tempPdf.toPath());
                } else if (!finished) {
                    process.destroyForcibly();
                    log.warn("PowerPoint COM conversion timed out after 60 seconds");
                } else {
                    log.warn("PowerPoint COM conversion exited with code {}", process.exitValue());
                }
            } else {
                // Linux / macOS / Docker: chạy LibreOffice headless với Semaphore + profile cô lập, nếu không có thì fallback Apache POI
                converted = convertViaLibreOfficeHeadless(tempPptx, 35);
            }

            if (converted == null || converted.length == 0) {
                converted = convertPptxToPdfViaApachePoi(fileBytes);
            }

            if (converted != null && converted.length > 0 && cacheKey != null) {
                if (nativePptxPdfCache.size() >= MAX_NATIVE_PDF_CACHE_ENTRIES) {
                    nativePptxPdfCache.clear();
                }
                nativePptxPdfCache.put(cacheKey, converted);
            }
            return converted;
        } catch (Exception ex) {
            log.warn("Native pptx to pdf conversion error, trying Apache POI fallback: {}", ex.getMessage());
            byte[] poiFallback = convertPptxToPdfViaApachePoi(fileBytes);
            if (poiFallback != null && poiFallback.length > 0 && cacheKey != null) {
                nativePptxPdfCache.put(cacheKey, poiFallback);
            }
            return poiFallback;
        } finally {
            if (tempPptx != null && tempPptx.exists()) {
                tempPptx.delete();
            }
            if (tempPdf != null && tempPdf.exists()) {
                tempPdf.delete();
            }
            if (tempScript != null && tempScript.exists()) {
                tempScript.delete();
            }
        }
    }

    /**
     * Kết xuất từng slide PowerPoint (.pptx / .ppt) sang PDF chuẩn tỷ lệ gốc (16:9 / 4:3) bằng Apache POI + Java2D.
     * Hoạt động độc lập trên mọi hệ điều hành (kể cả container Linux Alpine trên EC2 t3.micro không có Office/LibreOffice),
     * giữ nguyên nền slide, hình khối, hình ảnh, bảng biểu và tự động ánh xạ phông chữ Unicode tiếng Việt.
     */
    public byte[] convertPptxToPdfViaApachePoi(byte[] fileBytes) {
        if (fileBytes == null || fileBytes.length == 0) {
            return null;
        }

        try (org.apache.poi.sl.usermodel.SlideShow<?, ?> slideShow =
                     org.apache.poi.sl.usermodel.SlideShowFactory.create(new ByteArrayInputStream(fileBytes));
             PDDocument pdfDoc = new PDDocument()) {

            List<? extends org.apache.poi.sl.usermodel.Slide<?, ?>> slides = slideShow.getSlides();
            if (slides == null || slides.isEmpty()) {
                return null;
            }

            Dimension pageSize = slideShow.getPageSize();
            float slideWidthPt = pageSize != null && pageSize.width > 0 ? (float) pageSize.width : 960f;
            float slideHeightPt = pageSize != null && pageSize.height > 0 ? (float) pageSize.height : 540f;

            // Độ phân giải HD sắc nét (~1600px chiều ngang) nhưng tối ưu RAM cho container nhỏ
            float renderScale = Math.min(2.25f, Math.max(1.5f, 1600f / slideWidthPt));
            int imgWidth = Math.max(1, Math.round(slideWidthPt * renderScale));
            int imgHeight = Math.max(1, Math.round(slideHeightPt * renderScale));

            java.util.Map<String, String> fontFallbackMap = buildSlideFontFallbackMap();

            for (org.apache.poi.sl.usermodel.Slide<?, ?> slide : slides) {
                BufferedImage slideImage = new BufferedImage(imgWidth, imgHeight, BufferedImage.TYPE_INT_RGB);
                Graphics2D g2d = slideImage.createGraphics();
                try {
                    g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                    g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
                    g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                    g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                    g2d.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON);
                    g2d.setRenderingHint(org.apache.poi.sl.draw.Drawable.FONT_FALLBACK, fontFallbackMap);

                    g2d.setColor(Color.WHITE);
                    g2d.fillRect(0, 0, imgWidth, imgHeight);
                    g2d.scale(renderScale, renderScale);
                    slide.draw(g2d);
                } finally {
                    g2d.dispose();
                }

                PDRectangle pdfPageRect = new PDRectangle(slideWidthPt, slideHeightPt);
                PDPage pdfPage = new PDPage(pdfPageRect);
                pdfDoc.addPage(pdfPage);

                PDImageXObject pdImage = org.apache.pdfbox.pdmodel.graphics.image.JPEGFactory.createFromImage(
                        pdfDoc, slideImage, 0.90f
                );
                try (PDPageContentStream contentStream = new PDPageContentStream(pdfDoc, pdfPage)) {
                    contentStream.drawImage(pdImage, 0, 0, slideWidthPt, slideHeightPt);
                }
                slideImage.flush();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            pdfDoc.save(baos);
            byte[] resultBytes = baos.toByteArray();
            log.info("Successfully rendered {} PowerPoint slides to PDF via Apache POI (size: {} bytes)",
                    slides.size(), resultBytes.length);
            return resultBytes;
        } catch (Exception ex) {
            log.warn("Apache POI PowerPoint rendering failed: {}", ex.getMessage());
            return null;
        }
    }

    private java.util.Map<String, String> buildSlideFontFallbackMap() {
        java.util.Map<String, String> fallback = new java.util.HashMap<>();
        try {
            java.util.Set<String> installed = new java.util.HashSet<>();
            for (String f : GraphicsEnvironment.getLocalGraphicsEnvironment().getAvailableFontFamilyNames()) {
                if (f != null) {
                    installed.add(f.toLowerCase(java.util.Locale.ROOT));
                }
            }

            String bestSans = "SansSerif";
            for (String candidate : new String[]{"Noto Sans", "DejaVu Sans", "Segoe UI", "Arial"}) {
                if (installed.contains(candidate.toLowerCase(java.util.Locale.ROOT))) {
                    bestSans = candidate;
                    break;
                }
            }

            String bestSerif = "Serif";
            for (String candidate : new String[]{"Noto Serif", "DejaVu Serif", "Times New Roman", "Georgia"}) {
                if (installed.contains(candidate.toLowerCase(java.util.Locale.ROOT))) {
                    bestSerif = candidate;
                    break;
                }
            }

            String[] commonSansFonts = new String[]{
                    "Calibri", "Calibri Light", "Aptos", "Aptos Display", "Arial", "Segoe UI", "Tahoma",
                    "Verdana", "Trebuchet MS", "Helvetica", "Helvetica Neue", "Canva Sans", "Montserrat",
                    "Roboto", "Open Sans", "Poppins", "Inter", "Lato", "Raleway", "Nunito", "Quicksand",
                    "Be Vietnam Pro", "Plus Jakarta Sans", "Work Sans", "DM Sans"
            };
            for (String fontName : commonSansFonts) {
                if (!installed.contains(fontName.toLowerCase(java.util.Locale.ROOT))) {
                    fallback.put(fontName, bestSans);
                }
            }

            String[] commonSerifFonts = new String[]{
                    "Times New Roman", "Cambria", "Georgia", "Garamond", "Playfair Display", "Merriweather", "Lora"
            };
            for (String fontName : commonSerifFonts) {
                if (!installed.contains(fontName.toLowerCase(java.util.Locale.ROOT))) {
                    fallback.put(fontName, bestSerif);
                }
            }
        } catch (Exception ignored) {
        }
        return fallback;
    }

    public byte[] convertOfficeExcelToPdfNative(byte[] fileBytes, String extension) {
        if (fileBytes == null || fileBytes.length == 0) {
            return null;
        }

        String cacheKey = sha256Hex(fileBytes);
        byte[] cached = cacheKey != null ? nativePptxPdfCache.get("excel_" + cacheKey) : null;
        if (cached != null && cached.length > 0) {
            return cached;
        }

        String lower = extension != null ? extension.toLowerCase().trim() : "xlsx";
        String suffix = "csv".equals(lower) ? ".csv" : ("xls".equals(lower) ? ".xls" : ".xlsx");
        File tempExcel = null;
        File tempPdf = null;
        File tempScript = null;

        try {
            tempExcel = File.createTempFile("excel_native_in_", suffix);
            tempPdf = File.createTempFile("excel_native_out_", ".pdf");
            if (tempPdf.exists()) {
                tempPdf.delete();
            }

            try (FileOutputStream fos = new FileOutputStream(tempExcel)) {
                fos.write(fileBytes);
            }

            boolean isWindows = System.getProperty("os.name", "").toLowerCase().contains("win");
            byte[] converted = null;

            if (isWindows) {
                tempScript = File.createTempFile("excel_native_script_", ".ps1");
                String psScript = "param([string]$InputPath, [string]$OutputPath)\r\n"
                        + "if (-not $InputPath) { $InputPath = $args[0] }\r\n"
                        + "if (-not $OutputPath) { $OutputPath = $args[1] }\r\n"
                        + "$ErrorActionPreference = 'Stop'\r\n"
                        + "$excel = $null; $wb = $null\r\n"
                        + "try {\r\n"
                        + "    $excel = New-Object -ComObject Excel.Application\r\n"
                        + "    $excel.Visible = $false\r\n"
                        + "    $excel.DisplayAlerts = $false\r\n"
                        + "    $wb = $excel.Workbooks.Open($InputPath, 0, $true)\r\n"
                        + "    $sheet = $wb.Worksheets.Item(1)\r\n"
                        + "    try {\r\n"
                        + "        $sheet.PageSetup.Zoom = $false\r\n"
                        + "        $sheet.PageSetup.FitToPagesWide = 1\r\n"
                        + "        $sheet.PageSetup.FitToPagesTall = 1\r\n"
                        + "        $sheet.PageSetup.PrintGridlines = $true\r\n"
                        + "        $sheet.PageSetup.Orientation = 2\r\n"
                        + "    } catch {}\r\n"
                        + "    $sheet.ExportAsFixedFormat(0, $OutputPath)\r\n"
                        + "    if (Test-Path $OutputPath) { exit 0 }\r\n"
                        + "} catch {\r\n"
                        + "    try {\r\n"
                        + "        $outDir = Split-Path -Parent $OutputPath\r\n"
                        + "        & soffice --headless --convert-to pdf --outdir $outDir $InputPath\r\n"
                        + "        $loOut = Join-Path $outDir ([System.IO.Path]::GetFileNameWithoutExtension($InputPath) + '.pdf')\r\n"
                        + "        if ((Test-Path $loOut) -and ($loOut -ne $OutputPath)) { Move-Item -Force $loOut $OutputPath }\r\n"
                        + "        if (Test-Path $OutputPath) { exit 0 }\r\n"
                        + "    } catch {}\r\n"
                        + "    exit 1\r\n"
                        + "} finally {\r\n"
                        + "    if ($wb) { try { $wb.Close($false) } catch {} }\r\n"
                        + "    if ($excel) { try { $excel.Quit() } catch {} ; try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null } catch {} }\r\n"
                        + "}\r\n";

                java.nio.file.Files.writeString(tempScript.toPath(), psScript, StandardCharsets.UTF_8);

                ProcessBuilder pb = new ProcessBuilder(
                        "powershell.exe",
                        "-NoProfile",
                        "-ExecutionPolicy", "Bypass",
                        "-File", tempScript.getAbsolutePath(),
                        tempExcel.getAbsolutePath(),
                        tempPdf.getAbsolutePath()
                );
                pb.redirectErrorStream(true);
                Process process = pb.start();

                boolean finished = process.waitFor(60, java.util.concurrent.TimeUnit.SECONDS);
                if (finished && process.exitValue() == 0 && tempPdf.exists() && tempPdf.length() > 0) {
                    log.info("Successfully converted {} to PDF via native Excel/LibreOffice (output size: {} bytes)", suffix, tempPdf.length());
                    converted = java.nio.file.Files.readAllBytes(tempPdf.toPath());
                } else if (!finished) {
                    process.destroyForcibly();
                    log.warn("Excel COM conversion timed out after 60 seconds");
                } else {
                    log.warn("Excel COM conversion exited with code {}", process.exitValue());
                }
            } else {
                // Linux / macOS / Docker: chạy LibreOffice headless với Semaphore + profile cô lập
                converted = convertViaLibreOfficeHeadless(tempExcel, 35);
            }

            if (converted != null && converted.length > 0 && cacheKey != null) {
                if (nativePptxPdfCache.size() >= MAX_NATIVE_PDF_CACHE_ENTRIES) {
                    nativePptxPdfCache.clear();
                }
                nativePptxPdfCache.put("excel_" + cacheKey, converted);
            }
            return converted;
        } catch (Exception ex) {
            log.warn("Native excel to pdf conversion error: {}", ex.getMessage());
        } finally {
            if (tempExcel != null && tempExcel.exists()) {
                tempExcel.delete();
            }
            if (tempPdf != null && tempPdf.exists()) {
                tempPdf.delete();
            }
            if (tempScript != null && tempScript.exists()) {
                tempScript.delete();
            }
        }
        return null;
    }

    private String sha256Hex(byte[] bytes) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(bytes);
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception ex) {
            return null;
        }
    }

    /**
     * Phân tích tệp bảng tính (.xlsx / .csv) thành cấu trúc bảng nhiều Sheet cho ExcelViewer,
     * đồng thời cắt giới hạn dòng đọc thử (DRM) ngay tại máy chủ để người dùng chưa mở khóa
     * vẫn xem được bảng tính chuẩn Excel mà không lộ dữ liệu khóa hay phụ thuộc Office trên Server.
     */
    public com.network.document_service.dto.response.SpreadsheetPreviewResponse extractSpreadsheetPreview(
            byte[] fileBytes,
            String fileName,
            String extension,
            boolean restrictRows,
            int freeRowsLimit) {
        String ext = extension != null ? extension.toLowerCase().trim() : "xlsx";
        int effectiveFreeLimit = Math.max(25, freeRowsLimit);
        List<com.network.document_service.dto.response.SpreadsheetSheetPreviewDto> sheets;

        if ("csv".equals(ext)) {
            sheets = List.of(parseCsvSheetPreview(fileBytes, restrictRows, effectiveFreeLimit));
        } else {
            sheets = parseXlsxSheetsPreview(fileBytes, restrictRows, effectiveFreeLimit);
            if (sheets.isEmpty()) {
                sheets = List.of(parseCsvSheetPreview(fileBytes, restrictRows, effectiveFreeLimit));
            }
        }

        boolean anySheetRestricted = restrictRows && sheets.stream().anyMatch(s -> s.getTotalRows() > effectiveFreeLimit);

        return com.network.document_service.dto.response.SpreadsheetPreviewResponse.builder()
                .fileName(fileName)
                .fileExtension(ext)
                .restricted(anySheetRestricted)
                .freeRowsLimit(effectiveFreeLimit)
                .sheets(sheets)
                .build();
    }

    private com.network.document_service.dto.response.SpreadsheetSheetPreviewDto parseCsvSheetPreview(
            byte[] fileBytes,
            boolean restrictRows,
            int freeRowsLimit) {
        List<List<String>> visibleRows = new ArrayList<>();
        List<List<String>> blurredRows = new ArrayList<>();
        int totalRows = 0;
        int maxCols = 0;
        int maxUnrestrictedRows = 5000;
        char delimiter = ',';
        boolean delimiterDetected = false;

        if (fileBytes != null && fileBytes.length > 0) {
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(new ByteArrayInputStream(fileBytes), StandardCharsets.UTF_8))) {
                String rawLine;
                boolean firstLine = true;
                while ((rawLine = reader.readLine()) != null) {
                    if (firstLine) {
                        firstLine = false;
                        if (rawLine.startsWith("\uFEFF")) {
                            rawLine = rawLine.substring(1);
                        }
                    }
                    if (rawLine.trim().isEmpty()) {
                        continue;
                    }
                    if (!delimiterDetected) {
                        delimiter = detectCsvDelimiter(rawLine);
                        delimiterDetected = true;
                    }

                    totalRows++;
                    if (restrictRows) {
                        if (visibleRows.size() < freeRowsLimit) {
                            List<String> cells = parseCsvLine(rawLine, delimiter);
                            maxCols = Math.max(maxCols, cells.size());
                            visibleRows.add(cells);
                        } else if (blurredRows.size() < 10) {
                            List<String> cells = parseCsvLine(rawLine, delimiter);
                            maxCols = Math.max(maxCols, cells.size());
                            blurredRows.add(maskRowForDrm(cells));
                        }
                    } else if (visibleRows.size() < maxUnrestrictedRows) {
                        List<String> cells = parseCsvLine(rawLine, delimiter);
                        maxCols = Math.max(maxCols, cells.size());
                        visibleRows.add(cells);
                    }
                }
            } catch (Exception ex) {
                log.warn("CSV preview parse error: {}", ex.getMessage());
            }
        }

        if (!restrictRows || totalRows <= freeRowsLimit) {
            blurredRows.clear();
        }

        return com.network.document_service.dto.response.SpreadsheetSheetPreviewDto.builder()
                .name("Sheet1")
                .totalRows(totalRows)
                .maxCols(maxCols)
                .rows(visibleRows)
                .blurredRows(blurredRows)
                .build();
    }

    private char detectCsvDelimiter(String sampleLine) {
        char[] candidates = new char[]{',', ';', '\t'};
        char best = ',';
        int bestCount = 0;
        for (char c : candidates) {
            int count = parseCsvLine(sampleLine, c).size();
            if (count > bestCount) {
                bestCount = count;
                best = c;
            }
        }
        return best;
    }

    private List<String> parseCsvLine(String line, char delimiter) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        int len = line.length();
        for (int i = 0; i < len; i++) {
            char ch = line.charAt(i);
            if (ch == '"') {
                if (inQuotes && i + 1 < len && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch == delimiter && !inQuotes) {
                result.add(current.toString().trim());
                current.setLength(0);
            } else {
                current.append(ch);
            }
        }
        result.add(current.toString().trim());
        return result;
    }

    private List<com.network.document_service.dto.response.SpreadsheetSheetPreviewDto> parseXlsxSheetsPreview(
            byte[] fileBytes,
            boolean restrictRows,
            int freeRowsLimit) {
        List<com.network.document_service.dto.response.SpreadsheetSheetPreviewDto> result = new ArrayList<>();
        if (fileBytes == null || fileBytes.length < 4) {
            return result;
        }

        java.util.Map<String, byte[]> zipEntries = new java.util.LinkedHashMap<>();
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(fileBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                String name = entry.getName();
                if ("xl/workbook.xml".equals(name)
                        || "xl/_rels/workbook.xml.rels".equals(name)
                        || "xl/sharedStrings.xml".equals(name)
                        || name.startsWith("xl/worksheets/sheet")) {
                    zipEntries.put(name, zis.readAllBytes());
                }
            }
        } catch (Exception ex) {
            return result;
        }

        try {
            javax.xml.parsers.DocumentBuilderFactory dbf = javax.xml.parsers.DocumentBuilderFactory.newInstance();
            dbf.setNamespaceAware(false);
            try {
                dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
                dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
                dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            } catch (Exception ignored) {}

            List<String> sharedStrings = new ArrayList<>();
            byte[] sstBytes = zipEntries.get("xl/sharedStrings.xml");
            if (sstBytes != null) {
                org.w3c.dom.Document sstDoc = dbf.newDocumentBuilder().parse(new ByteArrayInputStream(sstBytes));
                org.w3c.dom.NodeList siNodes = sstDoc.getElementsByTagName("si");
                for (int i = 0; i < siNodes.getLength(); i++) {
                    org.w3c.dom.Node si = siNodes.item(i);
                    StringBuilder sb = new StringBuilder();
                    org.w3c.dom.NodeList tNodes = ((org.w3c.dom.Element) si).getElementsByTagName("t");
                    for (int j = 0; j < tNodes.getLength(); j++) {
                        String txt = tNodes.item(j).getTextContent();
                        if (txt != null) sb.append(txt);
                    }
                    sharedStrings.add(sb.toString());
                }
            }

            java.util.Map<String, String> relIdToTarget = new java.util.HashMap<>();
            byte[] relsBytes = zipEntries.get("xl/_rels/workbook.xml.rels");
            if (relsBytes != null) {
                org.w3c.dom.Document relsDoc = dbf.newDocumentBuilder().parse(new ByteArrayInputStream(relsBytes));
                org.w3c.dom.NodeList relNodes = relsDoc.getElementsByTagName("Relationship");
                for (int i = 0; i < relNodes.getLength(); i++) {
                    org.w3c.dom.Element el = (org.w3c.dom.Element) relNodes.item(i);
                    String id = el.getAttribute("Id");
                    String target = el.getAttribute("Target");
                    if (id != null && target != null) {
                        String normalized = target.startsWith("/") ? target.substring(1)
                                : (target.startsWith("xl/") ? target : "xl/" + target);
                        relIdToTarget.put(id, normalized);
                    }
                }
            }

            List<String[]> orderedSheetDefs = new ArrayList<>();
            byte[] wbBytes = zipEntries.get("xl/workbook.xml");
            if (wbBytes != null) {
                org.w3c.dom.Document wbDoc = dbf.newDocumentBuilder().parse(new ByteArrayInputStream(wbBytes));
                org.w3c.dom.NodeList sheetNodes = wbDoc.getElementsByTagName("sheet");
                for (int i = 0; i < sheetNodes.getLength(); i++) {
                    org.w3c.dom.Element el = (org.w3c.dom.Element) sheetNodes.item(i);
                    String sName = el.getAttribute("name");
                    String rId = el.getAttribute("r:id");
                    String path = relIdToTarget.getOrDefault(rId, "xl/worksheets/sheet" + (i + 1) + ".xml");
                    orderedSheetDefs.add(new String[]{
                            (sName != null && !sName.isBlank()) ? sName : "Sheet" + (i + 1),
                            path
                    });
                }
            }

            if (orderedSheetDefs.isEmpty()) {
                int idx = 1;
                for (String key : zipEntries.keySet()) {
                    if (key.startsWith("xl/worksheets/sheet") && key.endsWith(".xml")) {
                        orderedSheetDefs.add(new String[]{"Sheet" + idx++, key});
                    }
                }
            }

            int maxUnrestrictedRows = 5000;
            for (String[] def : orderedSheetDefs) {
                String sheetName = def[0];
                byte[] sheetBytes = zipEntries.get(def[1]);
                if (sheetBytes == null) continue;

                org.w3c.dom.Document sheetDoc = dbf.newDocumentBuilder().parse(new ByteArrayInputStream(sheetBytes));
                org.w3c.dom.NodeList rowNodes = sheetDoc.getElementsByTagName("row");

                List<List<String>> visibleRows = new ArrayList<>();
                List<List<String>> blurredRows = new ArrayList<>();
                int totalRows = 0;
                int maxCols = 0;

                for (int r = 0; r < rowNodes.getLength(); r++) {
                    org.w3c.dom.Element rowEl = (org.w3c.dom.Element) rowNodes.item(r);
                    org.w3c.dom.NodeList cellNodes = rowEl.getElementsByTagName("c");
                    if (cellNodes.getLength() == 0) continue;

                    totalRows++;
                    boolean needVisible = (!restrictRows && visibleRows.size() < maxUnrestrictedRows)
                            || (restrictRows && visibleRows.size() < freeRowsLimit);
                    boolean needBlurred = restrictRows && !needVisible && blurredRows.size() < 10;
                    if (!needVisible && !needBlurred) {
                        continue;
                    }

                    List<String> rowCells = new ArrayList<>();
                    for (int c = 0; c < cellNodes.getLength(); c++) {
                        org.w3c.dom.Element cellEl = (org.w3c.dom.Element) cellNodes.item(c);
                        String ref = cellEl.getAttribute("r");
                        int colIdx = parseExcelColIndex(ref, c);
                        String type = cellEl.getAttribute("t");
                        String cellText = extractXlsxCellValue(cellEl, type, sharedStrings);

                        while (rowCells.size() <= colIdx && colIdx < 200) {
                            rowCells.add("");
                        }
                        if (colIdx < rowCells.size()) {
                            rowCells.set(colIdx, cellText);
                        }
                    }

                    maxCols = Math.max(maxCols, rowCells.size());
                    if (needVisible) {
                        visibleRows.add(rowCells);
                    } else {
                        blurredRows.add(maskRowForDrm(rowCells));
                    }
                }

                if (!restrictRows || totalRows <= freeRowsLimit) {
                    blurredRows.clear();
                }

                result.add(com.network.document_service.dto.response.SpreadsheetSheetPreviewDto.builder()
                        .name(sheetName)
                        .totalRows(totalRows)
                        .maxCols(maxCols)
                        .rows(visibleRows)
                        .blurredRows(blurredRows)
                        .build());
            }
        } catch (Exception ex) {
            log.warn("XLSX preview parse error: {}", ex.getMessage());
        }
        return result;
    }

    private int parseExcelColIndex(String cellRef, int fallbackIndex) {
        if (cellRef == null || cellRef.isEmpty()) {
            return fallbackIndex;
        }
        int col = 0;
        int letters = 0;
        for (int i = 0; i < cellRef.length(); i++) {
            char ch = Character.toUpperCase(cellRef.charAt(i));
            if (ch >= 'A' && ch <= 'Z') {
                col = col * 26 + (ch - 'A' + 1);
                letters++;
            } else {
                break;
            }
        }
        return letters > 0 ? col - 1 : fallbackIndex;
    }

    private String extractXlsxCellValue(org.w3c.dom.Element cellEl, String type, List<String> sharedStrings) {
        if ("inlineStr".equals(type)) {
            org.w3c.dom.NodeList tNodes = cellEl.getElementsByTagName("t");
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < tNodes.getLength(); i++) {
                String txt = tNodes.item(i).getTextContent();
                if (txt != null) sb.append(txt);
            }
            return sb.toString().trim();
        }

        org.w3c.dom.NodeList vNodes = cellEl.getElementsByTagName("v");
        if (vNodes.getLength() == 0 || vNodes.item(0).getTextContent() == null) {
            return "";
        }
        String rawVal = vNodes.item(0).getTextContent().trim();
        if ("s".equals(type)) {
            try {
                int idx = Integer.parseInt(rawVal);
                if (idx >= 0 && idx < sharedStrings.size()) {
                    return sharedStrings.get(idx);
                }
            } catch (NumberFormatException ignored) {}
        } else if ("b".equals(type)) {
            return "1".equals(rawVal) ? "TRUE" : "FALSE";
        }
        return rawVal;
    }

    private List<String> maskRowForDrm(List<String> originalCells) {
        List<String> masked = new ArrayList<>(originalCells.size());
        for (String val : originalCells) {
            if (val == null || val.isBlank()) {
                masked.add("");
            } else {
                int len = Math.min(12, Math.max(4, val.length()));
                masked.add("•".repeat(len));
            }
        }
        return masked;
    }
}
