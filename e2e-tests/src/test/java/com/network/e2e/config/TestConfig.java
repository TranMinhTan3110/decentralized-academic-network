package com.network.e2e.config;

public class TestConfig {

    public static final String BASE_URL = System.getProperty("baseUrl",
            System.getenv().getOrDefault("E2E_BASE_URL", "http://localhost:5173"));

    public static final boolean HEADLESS = Boolean.parseBoolean(System.getProperty("headless",
            System.getenv().getOrDefault("E2E_HEADLESS", "true")));

    public static final String DB_URL = System.getProperty("dbUrl",
            System.getenv().getOrDefault("DB_URL", "jdbc:postgresql://localhost:5432/user_db"));

    public static final String DB_USER = System.getProperty("dbUser",
            System.getenv().getOrDefault("DB_USER", "root"));

    public static final String DB_PASSWORD = System.getProperty("dbPassword",
            System.getenv().getOrDefault("DB_PASSWORD", "rootpassword"));
}
