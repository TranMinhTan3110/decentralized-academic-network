package com.network.document_service.exception;

public class IpfsStorageException extends RuntimeException {
    public IpfsStorageException(String message) {
        super(message);
    }

    public IpfsStorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
