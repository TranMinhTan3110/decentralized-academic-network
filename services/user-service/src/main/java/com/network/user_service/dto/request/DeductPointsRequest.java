package com.network.user_service.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeductPointsRequest {

    @NotNull(message = "Số điểm trừ không được để trống")
    @Min(value = 1, message = "Số điểm trừ phải lớn hơn 0")
    @Max(value = 10000, message = "Số điểm trừ vượt quá giới hạn cho phép")
    private Integer points;

    private String idempotencyKey;
}
