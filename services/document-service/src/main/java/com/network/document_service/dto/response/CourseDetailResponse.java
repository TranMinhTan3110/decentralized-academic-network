package com.network.document_service.dto.response;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseDetailResponse {
    private UUID id;
    private String name;
    private String code;
    private String area;
    private Integer credits;
    private int documentCount;
    private List<DocumentFeedResponse> recentDocuments;
}
