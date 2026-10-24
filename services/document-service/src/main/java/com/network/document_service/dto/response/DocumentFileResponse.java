package com.network.document_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

/**
 * Nội dung file PDF tải về kèm tên file gợi ý cho header Content-Disposition.
 */
@Getter
@Setter
@AllArgsConstructor
public class DocumentFileResponse {
    private byte[] content;
    private String filename;
}
