package com.network.document_service.client;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.poi.sl.usermodel.ShapeType;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFAutoShape;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFTextBox;
import org.apache.poi.xslf.usermodel.XSLFTextParagraph;
import org.apache.poi.xslf.usermodel.XSLFTextRun;
import org.junit.jupiter.api.Test;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Rectangle;
import java.io.ByteArrayOutputStream;

import static org.junit.jupiter.api.Assertions.*;

class PdfProcessingServicePptxTest {

    private final PdfProcessingService service = new PdfProcessingService();

    @Test
    void convertPptxToPdfViaApachePoi_rendersAllWidescreenSlidesWithVietnameseAndShapes() throws Exception {
        byte[] pptxBytes;
        try (XMLSlideShow ppt = new XMLSlideShow();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ppt.setPageSize(new Dimension(960, 540));

            for (int i = 1; i <= 4; i++) {
                XSLFSlide slide = ppt.createSlide();

                XSLFAutoShape banner = slide.createAutoShape();
                banner.setShapeType(ShapeType.ROUND_RECT);
                banner.setAnchor(new Rectangle(40, 40, 880, 120));
                banner.setFillColor(new Color(30, 41, 59));

                XSLFTextBox titleBox = slide.createTextBox();
                titleBox.setAnchor(new Rectangle(60, 60, 840, 80));
                XSLFTextParagraph p = titleBox.addNewTextParagraph();
                XSLFTextRun r = p.addNewTextRun();
                r.setFontFamily("Canva Sans");
                r.setFontSize(28.0);
                r.setFontColor(Color.WHITE);
                r.setText("Bài thuyết trình Báo cáo Học thuật — Trang chiếu số " + i);
            }

            ppt.write(out);
            pptxBytes = out.toByteArray();
        }

        byte[] pdfBytes = service.convertPptxToPdfViaApachePoi(pptxBytes);
        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 1000);

        try (PDDocument pdfDoc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes))) {
            assertEquals(4, pdfDoc.getNumberOfPages(), "PDF phải giữ đúng 4 trang slide thay vì gộp vào 1 trang dọc");
            PDRectangle mediaBox = pdfDoc.getPage(0).getMediaBox();
            assertTrue(mediaBox.getWidth() > mediaBox.getHeight(), "Trang slide phải giữ tỷ lệ ngang 16:9 gốc");
            assertEquals(960f, mediaBox.getWidth(), 1.0f);
            assertEquals(540f, mediaBox.getHeight(), 1.0f);
        }

        // Kiểm tra cắt DRM 2 slide đọc thử từ bản PDF tạo bởi POI
        byte[] preview2Slides = service.generatePreviewPdf(pdfBytes, 2);
        try (PDDocument previewDoc = Loader.loadPDF(new RandomAccessReadBuffer(preview2Slides))) {
            assertEquals(2, previewDoc.getNumberOfPages());
        }
    }
}
