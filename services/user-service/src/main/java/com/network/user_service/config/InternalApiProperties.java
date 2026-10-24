package com.network.user_service.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Khóa dùng chung cho các endpoint service-to-service (ví dụ document-service
 * gọi deduct-points). Rỗng = chế độ dev, không bắt buộc.
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "internal.api")
public class InternalApiProperties {
    private String key;
}
