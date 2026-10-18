package com.network.user_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 150, message = "Họ và tên tối đa 150 ký tự")
    private String fullName;

    @Size(max = 150, message = "Chuyên ngành tối đa 150 ký tự")
    private String major;

    @Size(max = 1000, message = "Tiểu sử tối đa 1000 ký tự")
    private String bio;

    @Size(max = 255, message = "Tên trường đại học tối đa 255 ký tự")
    private String universityName;

    @Size(max = 500, message = "Đường dẫn ảnh đại diện tối đa 500 ký tự")
    private String avatarUrl;
}
