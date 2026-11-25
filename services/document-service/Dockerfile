# Multi-stage Dockerfile for Document Service (Spring Boot - Java 21)
# Stage 1: Build JAR using Maven
FROM maven:3.9.8-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Copy pom.xml first to leverage Docker layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build application jar (skip tests for fast build)
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal Runtime Environment
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install LibreOffice headless (Writer/Calc/Impress) + Unicode/Vietnamese/Liberation fonts
# so .docx/.xlsx/.pptx convert natively to crisp PDFs on Linux containers matching Windows MS Office
RUN apk add --no-cache \
    fontconfig \
    ttf-dejavu \
    ttf-liberation \
    font-noto \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    && fc-cache -f

# Add a non-root system user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy jar from builder stage
COPY --from=builder /build/target/*.jar app.jar

# Expose port
EXPOSE 8082

# Optimize JVM memory flags for containers (leave headroom for short-lived soffice child process)
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=60.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
