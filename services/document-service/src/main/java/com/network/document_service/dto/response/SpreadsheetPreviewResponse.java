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
public class SpreadsheetPreviewResponse {
    private String fileName;
    private String fileExtension;
    private boolean restricted;
    private int freeRowsLimit;
    private List<SpreadsheetSheetPreviewDto> sheets;
}
