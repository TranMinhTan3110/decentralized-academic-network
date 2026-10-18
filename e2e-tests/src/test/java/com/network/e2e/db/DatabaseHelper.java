package com.network.e2e.db;

import com.network.e2e.config.TestConfig;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class DatabaseHelper {

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(
                TestConfig.DB_URL,
                TestConfig.DB_USER,
                TestConfig.DB_PASSWORD
        );
    }

    /**
     * Lấy mã OTP mới nhất từ PostgreSQL cho email được đăng ký
     */
    public static String getLatestOtpForEmail(String email) {
        String sql = """
            SELECT uvc.code
            FROM user_verification_codes uvc
            JOIN users u ON u.id = uvc.user_id
            WHERE LOWER(u.email) = LOWER(?)
              AND uvc.type = 'ACCOUNT_ACTIVATION'
              AND uvc.is_used = false
            ORDER BY uvc.created_at DESC
            LIMIT 1
            """;

        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, email.trim().toLowerCase());
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getString("code");
                }
            }
        } catch (SQLException e) {
            System.err.println("[DatabaseHelper] Lỗi khi truy vấn OTP: " + e.getMessage());
        }
        return null;
    }

    /**
     * Xóa dữ liệu user test sau khi hoàn thành test nếu cần
     */
    public static void deleteTestUserByEmail(String email) {
        String deleteCodes = """
            DELETE FROM user_verification_codes 
            WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER(?))
            """;
        String deleteUser = "DELETE FROM users WHERE LOWER(email) = LOWER(?)";

        try (Connection conn = getConnection()) {
            try (PreparedStatement stmt = conn.prepareStatement(deleteCodes)) {
                stmt.setString(1, email.trim().toLowerCase());
                stmt.executeUpdate();
            }
            try (PreparedStatement stmt = conn.prepareStatement(deleteUser)) {
                stmt.setString(1, email.trim().toLowerCase());
                stmt.executeUpdate();
            }
        } catch (SQLException e) {
            System.err.println("[DatabaseHelper] Lỗi khi xóa test user: " + e.getMessage());
        }
    }
}
