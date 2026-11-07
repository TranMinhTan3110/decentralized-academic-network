package com.network.user_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserStatsResponse {

    private long totalUsers;
    private long activeUsers;
    private long bannedUsers;
    private long newUsersThisWeek;

    public static AdminUserStatsResponseBuilder builder() {
        return new AdminUserStatsResponseBuilder();
    }

    public static class AdminUserStatsResponseBuilder {
        private final AdminUserStatsResponse res = new AdminUserStatsResponse();

        public AdminUserStatsResponseBuilder totalUsers(long totalUsers) { res.totalUsers = totalUsers; return this; }
        public AdminUserStatsResponseBuilder activeUsers(long activeUsers) { res.activeUsers = activeUsers; return this; }
        public AdminUserStatsResponseBuilder bannedUsers(long bannedUsers) { res.bannedUsers = bannedUsers; return this; }
        public AdminUserStatsResponseBuilder newUsersThisWeek(long newUsersThisWeek) { res.newUsersThisWeek = newUsersThisWeek; return this; }

        public AdminUserStatsResponse build() {
            return res;
        }
    }
}
