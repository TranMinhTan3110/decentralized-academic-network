package com.network.document_service.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "ipfs")
@Getter
@Setter
public class IpfsProperties {
    private String mode = "mock"; // hybrid | local-only | pinata-only | mock
    private Local local = new Local();
    private Pinata pinata = new Pinata();

    @Getter @Setter
    public static class Local {
        private String apiUrl = "http://localhost:5001/api/v0";
        private String gatewayUrl = "http://localhost:8080/ipfs/";
    }

    @Getter @Setter
    public static class Pinata {
        private String jwt = "";
        private String apiUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";
        private String gatewayUrl = "https://gateway.pinata.cloud/ipfs/";
    }
}
