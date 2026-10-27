package com.network.user_service.config;

import com.network.user_service.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/api/v1/users/public/**").permitAll()
                        // Internal service-to-service endpoints (document-service gọi để lấy tác giả & giao dịch điểm).
                        // Các endpoint ghi có thêm kiểm tra X-Internal-Api-Key tại controller.
                        .requestMatchers(
                                "/api/v1/users/*/summary",
                                "/api/v1/users/batch",
                                "/api/v1/users/*/balance",
                                "/api/v1/users/*/deduct-points")
                        .permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/users/badges/catalog")
                        .permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/users/*/badges").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/users/*/is-following")
                        .permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/users/*/following-ids")
                        .permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/users/suggested")
                        .permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/users/*/summary", "/api/v1/users/batch")
                        .permitAll()
                        .requestMatchers("/api/v1/users/*/balance", "/api/v1/users/*/deduct-points")
                        .permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setContentType("application/json;charset=UTF-8");
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.getWriter().write(
                                    "{\"success\":false,\"message\":\"Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.\",\"data\":null}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setContentType("application/json;charset=UTF-8");
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.getWriter().write(
                                    "{\"success\":false,\"message\":\"Bạn không có quyền truy cập tính năng này.\",\"data\":null}");
                        }))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
