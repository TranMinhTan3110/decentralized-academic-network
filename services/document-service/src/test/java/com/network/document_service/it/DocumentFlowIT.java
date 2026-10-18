package com.network.document_service.it;

import com.network.document_service.client.IpfsStorageService;
import com.network.document_service.client.PdfProcessingService;
import com.network.document_service.client.UserServiceClient;
import com.network.document_service.dto.response.AuthorSummaryDto;
import com.network.document_service.dto.response.IpfsUploadResult;
import com.network.document_service.event.DocumentEventProducer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DocumentFlowIT {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PdfProcessingService pdfProcessingService;

    @MockBean
    private IpfsStorageService ipfsStorageService;

    @MockBean
    private UserServiceClient userServiceClient;

    @MockBean
    private DocumentEventProducer documentEventProducer;

    @Test
    void testCompleteDocumentFlow() throws Exception {
        UUID authorId = UUID.randomUUID();
        UUID readerId = UUID.randomUUID();

        when(pdfProcessingService.extractTotalPages(any(byte[].class))).thenReturn(10);
        when(pdfProcessingService.generatePreviewPdf(any(), eq(3))).thenReturn("preview3pages".getBytes());
        when(pdfProcessingService.generateThumbnailPng(any(byte[].class))).thenReturn("thumbBytes".getBytes());

        when(ipfsStorageService.uploadFile(any(), any())).thenReturn(
                new IpfsUploadResult("QmOriginalFullCid", "QmPreviewCid", true, true, "http://localhost:8080/ipfs/QmOriginalFullCid")
        );
        when(ipfsStorageService.uploadBytes(any(), any())).thenReturn(
                new IpfsUploadResult("QmPreviewCid", "QmPreviewCid", true, true, "http://localhost:8080/ipfs/QmPreviewCid")
        );

        when(userServiceClient.getAuthorSummary(any())).thenReturn(
                AuthorSummaryDto.builder().id(authorId).username("author1").fullName("Author One").build()
        );

        // 1. Upload PDF document via POST /api/documents
        MockMultipartFile file = new MockMultipartFile(
                "file", "guide.pdf", "application/pdf", "%PDF-1.4 sample content".getBytes()
        );

        String uploadResponse = mockMvc.perform(multipart("/api/documents")
                        .file(file)
                        .param("title", "Hướng dẫn Java nâng cao")
                        .param("description", "Tài liệu học tập chuyên sâu")
                        .param("unlockPointsRequired", "15")
                        .header("X-User-Id", authorId.toString()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Hướng dẫn Java nâng cao"))
                .andExpect(jsonPath("$.data.previewIpfsCid").value("QmPreviewCid"))
                .andReturn().getResponse().getContentAsString();

        // Extract docId from json
        String docIdStr = uploadResponse.split("\"id\":\"")[1].split("\"")[0];
        UUID docId = UUID.fromString(docIdStr);

        // 2. Reader accesses GET /api/documents/{id} before unlocking -> ipfsCid is masked
        mockMvc.perform(get("/api/documents/" + docId)
                        .header("X-User-Id", readerId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.ipfsCid").doesNotExist())
                .andExpect(jsonPath("$.data.previewIpfsCid").value("QmPreviewCid"))
                .andExpect(jsonPath("$.data.hasUnlocked").value(false));

        // 3. Reader toggles like via POST /api/documents/{id}/likes
        mockMvc.perform(post("/api/documents/" + docId + "/likes")
                        .header("X-User-Id", readerId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.liked").value(true));

        // 4. Reader adds a comment on page 2 via POST /api/documents/{id}/comments
        mockMvc.perform(post("/api/documents/" + docId + "/comments")
                        .header("X-User-Id", readerId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\": \"Bài giảng rất dễ hiểu!\", \"pageNumber\": 2}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.content").value("Bài giảng rất dễ hiểu!"))
                .andExpect(jsonPath("$.data.pageNumber").value(2));

        // 5. Reader unlocks the document via POST /api/documents/{id}/unlock
        mockMvc.perform(post("/api/documents/" + docId + "/unlock")
                        .header("X-User-Id", readerId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"unlockType\": \"POINTS\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unlocked").value(true));

        verify(userServiceClient).deductPoints(eq(readerId), eq(15), any());

        // 6. Reader re-fetches GET /api/documents/{id} after unlock -> original ipfsCid is now exposed
        mockMvc.perform(get("/api/documents/" + docId)
                        .header("X-User-Id", readerId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.ipfsCid").value("QmOriginalFullCid"))
                .andExpect(jsonPath("$.data.hasUnlocked").value(true));
    }
}
