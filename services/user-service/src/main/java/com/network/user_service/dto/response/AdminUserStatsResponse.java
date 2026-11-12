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

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
    public long getActiveUsers() { return activeUsers; }
    public void setActiveUsers(long activeUsers) { this.activeUsers = activeUsers; }
    public long getBannedUsers() { return bannedUsers; }
    public void setBannedUsers(long bannedUsers) { this.bannedUsers = bannedUsers; }
    public long getNewUsersThisWeek() { return newUsersThisWeek; }
    public void setNewUsersThisWeek(long newUsersThisWeek) { this.newUsersThisWeek = newUsersThisWeek; }

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
