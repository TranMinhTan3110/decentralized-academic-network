#!/bin/bash
set -e

# ==============================================================================
# SCRIPT TỰ ĐỘNG KHỞI TẠO 3 CƠ SỞ DỮ LIỆU ĐỘC LẬP CHO MICROSERVICES TRÊN 1 POSTGRES
# ==============================================================================

echo "Starting Multi-Database initialization for Microservices..."

# Tự động sửa lỗi TimeZone Asia/Saigon từ DBeaver trên Windows
ln -snf /usr/share/zoneinfo/Asia/Ho_Chi_Minh /usr/share/zoneinfo/Asia/Saigon 2>/dev/null || true

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE user_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'user_db')\gexec
    SELECT 'CREATE DATABASE document_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'document_db')\gexec
    SELECT 'CREATE DATABASE ai_service_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ai_service_db')\gexec
EOSQL

echo "1. Initializing schema for user_db..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "user_db" -f /docker-entrypoint-initdb.d/schemas/01_init_user_db.sql

echo "2. Initializing schema for document_db..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "document_db" -f /docker-entrypoint-initdb.d/schemas/02_init_document_db.sql

echo "3. Initializing schema for ai_service_db..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "ai_service_db" -f /docker-entrypoint-initdb.d/schemas/03_init_ai_service_db.sql

echo "All 3 microservice databases (user_db, document_db, ai_service_db) initialized successfully!"
