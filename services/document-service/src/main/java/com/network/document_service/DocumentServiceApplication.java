package com.network.document_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

@SpringBootApplication
public class DocumentServiceApplication {

	public static void main(String[] args) {
		loadDotenv();
		SpringApplication.run(DocumentServiceApplication.class, args);
	}

	private static void loadDotenv() {
		String[] candidatePaths = {
			".env",
			"services/document-service/.env",
			"../services/document-service/.env"
		};
		for (String pathStr : candidatePaths) {
			File file = new File(pathStr);
			if (file.exists() && file.isFile()) {
				try {
					List<String> lines = Files.readAllLines(file.toPath());
					for (String line : lines) {
						line = line.trim();
						if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
							continue;
						}
						int eqIdx = line.indexOf('=');
						String key = line.substring(0, eqIdx).trim();
						String val = line.substring(eqIdx + 1).trim();
						if (val.startsWith("\"") && val.endsWith("\"") && val.length() >= 2) {
							val = val.substring(1, val.length() - 1);
						} else if (val.startsWith("'") && val.endsWith("'") && val.length() >= 2) {
							val = val.substring(1, val.length() - 1);
						}
						if (System.getProperty(key) == null && System.getenv(key) == null) {
							System.setProperty(key, val);
						}
					}
					break;
				} catch (Exception ignored) {
				}
			}
		}
	}

}
