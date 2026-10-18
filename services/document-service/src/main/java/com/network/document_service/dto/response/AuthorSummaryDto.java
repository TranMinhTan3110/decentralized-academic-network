package com.network.document_service.dto.response;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorSummaryDto {
    private UUID id;
    private String username;
    private String fullName;
    private String avatarUrl;
    private String universityName;
    private String badge;
    private Integer points;

    public static AuthorSummaryDto anonymous() {
        return AuthorSummaryDto.builder()
                .username("anonymous")
                .fullName("Tác giả ẩn danh")
                .avatarUrl("https://api.dicebear.com/7.x/identicon/svg?seed=anonymous")
                .badge("Thành viên")
                .points(0)
                .build();
    }
}
