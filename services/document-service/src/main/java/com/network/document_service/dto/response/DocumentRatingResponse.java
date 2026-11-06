package com.network.document_service.dto.response;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentRatingResponse {
    private UUID documentId;
    private Double ratingAvg;
    private Integer ratingCount;
    private Integer userRating;
    private String userReview;
}

