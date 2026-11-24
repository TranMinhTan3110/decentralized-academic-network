package com.network.document_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpreadsheetSheetPreviewDto {
    private String name;
    private int totalRows;
    private int maxCols;
    private List<List<String>> rows;
    private List<List<String>> blurredRows;
}
