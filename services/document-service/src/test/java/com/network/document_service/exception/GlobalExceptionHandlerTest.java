package com.network.document_service.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleResourceNotFoundException_shouldReturn404() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Tài liệu không tồn tại");
        ResponseEntity<?> response = handler.handleResourceNotFound(ex);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void handleBadRequestException_shouldReturn400() {
        BadRequestException ex = new BadRequestException("File không hợp lệ");
        ResponseEntity<?> response = handler.handleBadRequest(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void handleUnauthorizedException_shouldReturn401() {
        UnauthorizedException ex = new UnauthorizedException("Chưa đăng nhập");
        ResponseEntity<?> response = handler.handleUnauthorized(ex);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void handleForbiddenException_shouldReturn403() {
        ForbiddenException ex = new ForbiddenException("Không có quyền");
        ResponseEntity<?> response = handler.handleForbidden(ex);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    @Test
    void handleIpfsStorageException_shouldReturn502() {
        IpfsStorageException ex1 = new IpfsStorageException("IPFS down");
        ResponseEntity<?> response1 = handler.handleIpfsStorage(ex1);
        assertEquals(HttpStatus.BAD_GATEWAY, response1.getStatusCode());

        IpfsStorageException ex2 = new IpfsStorageException("IPFS cause", new RuntimeException("root cause"));
        assertEquals("IPFS cause", ex2.getMessage());
    }

    @Test
    void handleServiceUnavailableException_shouldReturn503() {
        ServiceUnavailableException ex = new ServiceUnavailableException("User service down");
        ResponseEntity<?> response = handler.handleServiceUnavailable(ex);

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
    }

    @Test
    void handleValidationExceptions_shouldReturn400WithErrors() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getAllErrors()).thenReturn(List.of(
                new FieldError("object", "title", "Tiêu đề không được để trống")
        ));

        ResponseEntity<?> response = handler.handleValidationExceptions(ex);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void handleGeneralException_shouldReturn500() {
        Exception ex = new RuntimeException("Lỗi bất ngờ");
        ResponseEntity<?> response = handler.handleGeneralException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }
}
