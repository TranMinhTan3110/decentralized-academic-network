package com.network.document_service.client;

import com.network.document_service.dto.response.SpreadsheetPreviewResponse;
import com.network.document_service.dto.response.SpreadsheetSheetPreviewDto;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static org.junit.jupiter.api.Assertions.*;

class PdfProcessingServiceSpreadsheetTest {

    private final PdfProcessingService service = new PdfProcessingService();

    @Test
    void extractSpreadsheetPreview_csvWithDrmRestriction_truncatesAndMasksLockedRows() {
        StringBuilder csv = new StringBuilder("age,workclass,education\n");
        for (int i = 1; i <= 60; i++) {
            csv.append(20 + i).append(",\"Private, Inc\",Bachelors_").append(i).append("\n");
        }

        SpreadsheetPreviewResponse preview = service.extractSpreadsheetPreview(
                csv.toString().getBytes(StandardCharsets.UTF_8),
                "adult.data.csv",
                "csv",
                true,
                30
        );

        assertTrue(preview.isRestricted());
        assertEquals(30, preview.getFreeRowsLimit());
        assertEquals(1, preview.getSheets().size());

        SpreadsheetSheetPreviewDto sheet = preview.getSheets().get(0);
        assertEquals(61, sheet.getTotalRows());
        assertEquals(3, sheet.getMaxCols());
        assertEquals(30, sheet.getRows().size());
        assertEquals(10, sheet.getBlurredRows().size());
        assertEquals("Private, Inc", sheet.getRows().get(1).get(1));
        // Dòng làm mờ không được chứa dữ liệu gốc nhạy cảm
        assertFalse(sheet.getBlurredRows().get(0).get(2).contains("Bachelors_"));
    }

    @Test
    void extractSpreadsheetPreview_xlsxMultiSheetWithSparseColumns_preservesSheetNamesAndColAlignment() throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            zos.putNextEntry(new ZipEntry("xl/workbook.xml"));
            zos.write(("<workbook><sheets>"
                    + "<sheet name=\"Bảng điểm\" sheetId=\"1\" r:id=\"rId1\"/>"
                    + "<sheet name=\"Tổng kết\" sheetId=\"2\" r:id=\"rId2\"/>"
                    + "</sheets></workbook>").getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            zos.putNextEntry(new ZipEntry("xl/_rels/workbook.xml.rels"));
            zos.write(("<Relationships>"
                    + "<Relationship Id=\"rId1\" Target=\"worksheets/sheet1.xml\"/>"
                    + "<Relationship Id=\"rId2\" Target=\"worksheets/sheet2.xml\"/>"
                    + "</Relationships>").getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            zos.putNextEntry(new ZipEntry("xl/sharedStrings.xml"));
            zos.write(("<sst><si><t>MSSV</t></si><si><t>Điểm cuối kỳ</t></si></sst>").getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            // Sheet 1 có cột A (MSSV) và nhảy sang cột C (Điểm cuối kỳ), bỏ trống cột B
            zos.putNextEntry(new ZipEntry("xl/worksheets/sheet1.xml"));
            zos.write(("<worksheet><sheetData>"
                    + "<row r=\"1\"><c r=\"A1\" t=\"s\"><v>0</v></c><c r=\"C1\" t=\"s\"><v>1</v></c></row>"
                    + "<row r=\"2\"><c r=\"A2\" t=\"inlineStr\"><is><t>6451071001</t></is></c><c r=\"C2\"><v>9.5</v></c></row>"
                    + "</sheetData></worksheet>").getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            zos.putNextEntry(new ZipEntry("xl/worksheets/sheet2.xml"));
            zos.write(("<worksheet><sheetData>"
                    + "<row r=\"1\"><c r=\"A1\" t=\"b\"><v>1</v></c></row>"
                    + "</sheetData></worksheet>").getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }

        SpreadsheetPreviewResponse preview = service.extractSpreadsheetPreview(
                baos.toByteArray(),
                "grades.xlsx",
                "xlsx",
                false,
                45
        );

        assertFalse(preview.isRestricted());
        assertEquals(2, preview.getSheets().size());
        assertEquals("Bảng điểm", preview.getSheets().get(0).getName());
        assertEquals("Tổng kết", preview.getSheets().get(1).getName());

        SpreadsheetSheetPreviewDto s1 = preview.getSheets().get(0);
        assertEquals(3, s1.getMaxCols());
        assertEquals("MSSV", s1.getRows().get(0).get(0));
        assertEquals("", s1.getRows().get(0).get(1));
        assertEquals("Điểm cuối kỳ", s1.getRows().get(0).get(2));
        assertEquals("9.5", s1.getRows().get(1).get(2));
        assertEquals("TRUE", preview.getSheets().get(1).getRows().get(0).get(0));
    }
}
