package com.network.document_service.config;

import java.util.UUID;

public final class SecurityContextHolder {
    private static final ThreadLocal<UUID> USER_ID_HOLDER = new ThreadLocal<>();
    private static final ThreadLocal<String> ROLE_HOLDER = new ThreadLocal<>();

    private SecurityContextHolder() {}

    public static void setUserId(UUID userId) {
        USER_ID_HOLDER.set(userId);
    }

    public static UUID getUserId() {
        return USER_ID_HOLDER.get();
    }

    public static void setRole(String role) {
        ROLE_HOLDER.set(role);
    }

    public static String getRole() {
        return ROLE_HOLDER.get();
    }

    public static void clear() {
        USER_ID_HOLDER.remove();
        ROLE_HOLDER.remove();
    }
}
