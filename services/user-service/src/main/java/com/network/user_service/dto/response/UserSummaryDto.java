package com.network.user_service.dto.response;

import lombok.*;

import java.util.UUID;

/**
 * Summary công khai của người dùng, dùng cho service-to-service (document-service
 * hiển thị tác giả trên feed/chi tiết). Không chứa email hay thông tin nhạy cảm.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSummaryDto {
    private UUID id;
    private String username;
    private String fullName;
    private String avatarUrl;
    private String universityName;
    private String badge;
    private Integer points;
}
